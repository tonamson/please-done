/**
 * Reconnaissance result cache — keyed by git commit + tracked file list (MD5).
 * LRU eviction (max 50 JSON entries), atomic writes, graceful corrupt-file handling.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const CACHE_VERSION = "1.0";
const MAX_CACHE_FILES = 50;
/** Cache blob filenames are strictly `{md5hex}.json` — never join arbitrary user input. */
const CACHE_KEY_RE = /^[a-f0-9]{32}$/;

/**
 * Append one path segment under a trusted absolute directory using string concat (not path.join).
 * Semgrep-safe: second argument must be a basename with no separators (CWE-22).
 * @param {string} trustedAbsDir
 * @param {string} singleSegmentName
 * @returns {string}
 */
function filePathInTrustedDir(trustedAbsDir, singleSegmentName) {
  if (singleSegmentName !== path.basename(singleSegmentName)) {
    throw new Error("recon-cache: not a single path segment");
  }
  if (/[/\\]/.test(singleSegmentName)) {
    throw new Error("recon-cache: invalid path segment");
  }
  const root = path.normalize(String(trustedAbsDir).replace(/[/\\]+$/, ""));
  const full = path.normalize(root + path.sep + singleSegmentName);
  if (!full.startsWith(root + path.sep) && full !== root) {
    throw new Error("recon-cache: path outside trusted directory");
  }
  return full;
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
function gitRevParseHead(repoRoot) {
  try {
    return execSync("git rev-parse HEAD", {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/**
 * @param {string} repoRoot
 * @returns {string}
 */
function gitLsFiles(repoRoot) {
  try {
    return execSync("git ls-files", {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Resolved JSON path under trusted cache root; rejects path traversal (CWE-22).
 * `trustedAbsRoot` must come only from ReconCache constructor (not raw user path segments).
 * @param {string} trustedAbsRoot - absolute normalized cache directory
 * @param {string} key - 32-char md5 hex
 * @returns {string}
 */
function resolvedCacheJsonPath(trustedAbsRoot, key) {
  if (!CACHE_KEY_RE.test(key)) {
    throw new Error("recon-cache: invalid cache key");
  }
  const base = `${key}.json`;
  return filePathInTrustedDir(trustedAbsRoot, base);
}

/**
 * @param {string} [dir] - optional override; tests use temp dirs
 * @returns {string} absolute cache root
 */
function resolveCacheRootDir(dir) {
  if (!dir) {
    const step = filePathInTrustedDir(process.cwd(), ".planning");
    return filePathInTrustedDir(step, "recon-cache");
  }
  const d = String(dir);
  if (d.includes("\0")) {
    throw new Error("recon-cache: invalid cacheDir");
  }
  if (d.split(/[/\\]/).includes("..")) {
    throw new Error("recon-cache: cacheDir must not contain '..'");
  }
  const n = path.normalize(d);
  if (path.isAbsolute(n)) {
    return n;
  }
  const relParts = n.split(/[/\\]/).filter(Boolean);
  let out = process.cwd();
  for (const seg of relParts) {
    out = filePathInTrustedDir(out, seg);
  }
  return out;
}

class ReconCache {
  /**
   * @param {string} [cacheDir] - Default: .planning/recon-cache under cwd
   * @param {string} [repoRoot] - Git root for key material; default process.cwd()
   */
  constructor(cacheDir, repoRoot) {
    this.repoRoot = repoRoot || process.cwd();
    this._absCacheDir = resolveCacheRootDir(cacheDir);
    this.cacheDir = cacheDir || this._absCacheDir;
  }

  /**
   * Stable cache key: MD5(git HEAD + "\n" + git ls-files output).
   * @returns {string}
   */
  getKey() {
    const commit = gitRevParseHead(this.repoRoot) || "no-commit";
    const files = gitLsFiles(this.repoRoot);
    return crypto
      .createHash("md5")
      .update(`${commit}\n${files}`)
      .digest("hex");
  }

  _ensureDir() {
    fs.mkdirSync(this._absCacheDir, { recursive: true });
  }

  /**
   * Return cached recon payload or null (miss / corrupt / wrong version).
   * Logs token save message on hit.
   * @returns {unknown}
   */
  get() {
    const key = this.getKey();
    const fp = resolvedCacheJsonPath(this._absCacheDir, key);
    if (!fs.existsSync(fp)) return null;
    let raw;
    try {
      raw = fs.readFileSync(fp, "utf8");
    } catch {
      return null;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.warn(
        "[recon-cache] Corrupted cache file, ignoring:",
        fp,
        e.message,
      );
      return null;
    }
    if (parsed.version !== CACHE_VERSION) {
      console.warn("[recon-cache] Unsupported cache version, ignoring:", fp);
      return null;
    }
    if (!Object.prototype.hasOwnProperty.call(parsed, "data")) {
      console.warn("[recon-cache] Invalid cache entry (no data), ignoring:", fp);
      return null;
    }
    console.log("[Token Save] Reusing cached recon (0 AI tokens)");
    return parsed.data;
  }

  /**
   * Store recon payload for current git key. Atomic write; LRU eviction after write.
   * @param {unknown} data
   */
  set(data) {
    this._ensureDir();
    const key = this.getKey();
    const entry = {
      version: CACHE_VERSION,
      createdAt: new Date().toISOString(),
      gitCommit: gitRevParseHead(this.repoRoot) || "unknown",
      data,
    };
    const fp = resolvedCacheJsonPath(this._absCacheDir, key);
    const tmpSeg = `.${key}.${process.pid}.${Date.now()}.tmp`;
    if (!/^\.[a-f0-9]{32}\.\d+\.\d+\.tmp$/.test(tmpSeg)) {
      throw new Error("recon-cache: invalid temp segment");
    }
    const tmp = filePathInTrustedDir(this._absCacheDir, tmpSeg);
    fs.writeFileSync(tmp, JSON.stringify(entry), "utf8");
    fs.renameSync(tmp, fp);
    this._evictIfNeeded();
  }

  /**
   * Giữ tối đa MAX_CACHE_FILES file *.json hợp lệ trong thư mục cache (LRU theo atime).
   */
  _evictIfNeeded() {
    let names;
    try {
      names = fs.readdirSync(this._absCacheDir);
    } catch {
      return;
    }
    const jsonFiles = [];
    for (const n of names) {
      if (!n.endsWith(".json") || n.startsWith(".")) continue;
      if (n !== path.basename(n) || n.includes("..")) continue;
      if (!/^[a-f0-9]{32}\.json$/.test(n)) continue;
      let abs;
      try {
        abs = filePathInTrustedDir(this._absCacheDir, n);
      } catch {
        continue;
      }
      jsonFiles.push(abs);
    }
    if (jsonFiles.length <= MAX_CACHE_FILES) return;

    const stats = jsonFiles.map((f) => {
      try {
        const st = fs.statSync(f);
        return {
          path: f,
          t: st.atimeMs || st.mtimeMs || 0,
        };
      } catch {
        return { path: f, t: 0 };
      }
    });
    stats.sort((a, b) => a.t - b.t);
    let i = 0;
    while (stats.length - i > MAX_CACHE_FILES) {
      try {
        fs.unlinkSync(stats[i].path);
      } catch {
        /* ignore */
      }
      i += 1;
    }
  }
}

module.exports = {
  ReconCache,
  filePathInTrustedDir,
  gitRevParseHead,
  gitLsFiles,
  resolvedCacheJsonPath,
  resolveCacheRootDir,
};
