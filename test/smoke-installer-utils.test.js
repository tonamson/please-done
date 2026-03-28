/**
 * Installer Utilities Tests
 * Kiem tra 6 ham dung chung trong installer-utils.js.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const os = require("os");

const {
  ensureDir,
  validateGitRoot,
  copyWithBackup,
  savePdconfig,
  cleanLegacyDir,
  cleanOldFiles,
} = require("../bin/lib/installer-utils");

describe("ensureDir", () => {
  it("tao thu muc moi", () => {
    const tmp = path.join(os.tmpdir(), `pd-test-${Date.now()}`);
    try {
      ensureDir(tmp);
      assert.ok(fs.existsSync(tmp));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("khong loi khi thu muc da ton tai", () => {
    const tmp = os.tmpdir();
    assert.doesNotThrow(() => ensureDir(tmp));
  });

  it("throw khi dir la empty string", () => {
    assert.throws(() => ensureDir(""), /dir must be a non-empty string/);
  });

  it("throw khi dir la null", () => {
    assert.throws(() => ensureDir(null), /dir must be a non-empty string/);
  });
});

describe("validateGitRoot", () => {
  it("tra ve true cho project root (co .git)", () => {
    const projectRoot = path.resolve(__dirname, "..");
    assert.strictEqual(validateGitRoot(projectRoot), true);
  });

  it("tra ve false cho thu muc khong co .git", () => {
    assert.strictEqual(validateGitRoot(os.tmpdir()), false);
  });

  it("tra ve false cho null", () => {
    assert.strictEqual(validateGitRoot(null), false);
  });

  it("tra ve false cho empty string", () => {
    assert.strictEqual(validateGitRoot(""), false);
  });
});

describe("copyWithBackup", () => {
  it("copy file thanh cong", () => {
    const tmp = path.join(os.tmpdir(), `pd-copy-${Date.now()}`);
    const src = path.join(tmp, "src.txt");
    const dest = path.join(tmp, "dest.txt");
    try {
      fs.mkdirSync(tmp, { recursive: true });
      fs.writeFileSync(src, "hello");
      const result = copyWithBackup(src, dest);
      assert.strictEqual(result.copied, true);
      assert.strictEqual(result.backed_up, false);
      assert.strictEqual(fs.readFileSync(dest, "utf8"), "hello");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("tao backup khi file dich da ton tai", () => {
    const tmp = path.join(os.tmpdir(), `pd-backup-${Date.now()}`);
    const src = path.join(tmp, "src.txt");
    const dest = path.join(tmp, "dest.txt");
    try {
      fs.mkdirSync(tmp, { recursive: true });
      fs.writeFileSync(src, "new");
      fs.writeFileSync(dest, "old");
      const result = copyWithBackup(src, dest);
      assert.strictEqual(result.backed_up, true);
      assert.strictEqual(fs.readFileSync(`${dest}.bak`, "utf8"), "old");
      assert.strictEqual(fs.readFileSync(dest, "utf8"), "new");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("throw khi file nguon khong ton tai", () => {
    assert.throws(
      () => copyWithBackup("/nonexistent", "/tmp/x"),
      /source file does not exist/,
    );
  });
});

describe("savePdconfig", () => {
  it("ghi config moi", () => {
    const tmp = path.join(os.tmpdir(), `pd-config-${Date.now()}.txt`);
    try {
      savePdconfig(tmp, "/skills", "/fastcode");
      const content = fs.readFileSync(tmp, "utf8");
      assert.ok(content.includes("SKILLS_DIR=/skills"));
      assert.ok(content.includes("FASTCODE_DIR=/fastcode"));
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });

  it("giu lai CURRENT_VERSION tu file cu", () => {
    const tmp = path.join(os.tmpdir(), `pd-config-v-${Date.now()}.txt`);
    try {
      fs.writeFileSync(tmp, "CURRENT_VERSION=1.2.3\n");
      savePdconfig(tmp, "/s", "/f");
      const content = fs.readFileSync(tmp, "utf8");
      assert.ok(content.includes("CURRENT_VERSION=1.2.3"));
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });
});

describe("cleanLegacyDir", () => {
  it("xoa thu muc ton tai va tra ve true", () => {
    const tmp = path.join(os.tmpdir(), `pd-legacy-${Date.now()}`);
    fs.mkdirSync(tmp, { recursive: true });
    assert.strictEqual(cleanLegacyDir(tmp), true);
    assert.strictEqual(fs.existsSync(tmp), false);
  });

  it("tra ve false khi thu muc khong ton tai", () => {
    assert.strictEqual(cleanLegacyDir("/nonexistent-dir-pd"), false);
  });
});

describe("cleanOldFiles", () => {
  it("xoa files theo filter", () => {
    const tmp = path.join(os.tmpdir(), `pd-clean-${Date.now()}`);
    fs.mkdirSync(tmp, { recursive: true });
    fs.writeFileSync(path.join(tmp, "a.old"), "");
    fs.writeFileSync(path.join(tmp, "b.old"), "");
    fs.writeFileSync(path.join(tmp, "c.keep"), "");
    try {
      const count = cleanOldFiles(tmp, (f) => f.endsWith(".old"));
      assert.strictEqual(count, 2);
      assert.strictEqual(fs.existsSync(path.join(tmp, "c.keep")), true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("tra ve 0 khi thu muc khong ton tai", () => {
    assert.strictEqual(
      cleanOldFiles("/nonexistent-pd", () => true),
      0,
    );
  });
});

describe("module exports", () => {
  it("export dung 6 ham", () => {
    const utils = require("../bin/lib/installer-utils");
    const exports = Object.keys(utils);
    assert.strictEqual(exports.length, 6);
    assert.ok(exports.includes("ensureDir"));
    assert.ok(exports.includes("validateGitRoot"));
    assert.ok(exports.includes("copyWithBackup"));
    assert.ok(exports.includes("savePdconfig"));
    assert.ok(exports.includes("cleanLegacyDir"));
    assert.ok(exports.includes("cleanOldFiles"));
  });
});
