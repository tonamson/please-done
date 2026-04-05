"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { ReconCache } = require("./recon-cache");

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error("FAIL:", name);
    failed++;
  } else {
    console.log("ok:", name);
  }
}

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "recon-cache-test-"));
}

// Test 1: getKey() stable
(function t1() {
  const dir = mkTmp();
  const c = new ReconCache(dir, process.cwd());
  const a = c.getKey();
  const b = c.getKey();
  assert("getKey consistent", a === b && a.length === 32);
  fs.rmSync(dir, { recursive: true, force: true });
})();

// Test 2: miss
(function t2() {
  const dir = mkTmp();
  const c = new ReconCache(dir, process.cwd());
  assert("get miss", c.get() === null);
  fs.rmSync(dir, { recursive: true, force: true });
})();

// Test 3–4: set/get + entry shape
(function t3() {
  const dir = mkTmp();
  const c = new ReconCache(dir, process.cwd());
  c.set({ hello: "world" });
  const data = c.get();
  assert("get hit payload", data && data.hello === "world");
  const key = c.getKey();
  const fp = path.join(dir, `${key}.json`);
  const raw = JSON.parse(fs.readFileSync(fp, "utf8"));
  assert(
    "entry version and gitCommit",
    raw.version === "1.0" &&
      typeof raw.createdAt === "string" &&
      typeof raw.gitCommit === "string",
  );
  fs.rmSync(dir, { recursive: true, force: true });
})();

// Test 5: corrupt file
(function t5() {
  const dir = mkTmp();
  const c = new ReconCache(dir, process.cwd());
  const key = c.getKey();
  fs.writeFileSync(path.join(dir, `${key}.json`), "not json {{{", "utf8");
  assert("corrupt returns null", c.get() === null);
  fs.rmSync(dir, { recursive: true, force: true });
})();

// Test 6: LRU — 51 hợp lệ *.json → còn ≤50
(function t6() {
  const dir = mkTmp();
  const repo = process.cwd();
  const c = new ReconCache(dir, repo);
  for (let i = 0; i < 50; i++) {
    const hex = `${i.toString(16).padStart(32, "0")}.json`;
    fs.writeFileSync(
      path.join(dir, hex),
      JSON.stringify({
        version: "1.0",
        createdAt: new Date().toISOString(),
        gitCommit: "x",
        data: {},
      }),
      "utf8",
    );
    const p = path.join(dir, hex);
    const t = Date.now() / 1000 + i;
    try {
      fs.utimesSync(p, t, t);
    } catch {
      /* ignore */
    }
  }
  c.set({ lrutest: true });
  const list = fs.readdirSync(dir).filter((n) => /^[a-f0-9]{32}\.json$/.test(n));
  assert("LRU keeps max 50 json", list.length <= 50);
  fs.rmSync(dir, { recursive: true, force: true });
})();

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nrecon-cache.test.js: all passed");
