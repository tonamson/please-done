#!/usr/bin/env node

/**
 * Benchmark — Đo lường hiệu suất installer + phân tích cấu trúc workflow.
 *
 * Chạy: node test/benchmark.js
 * Kết quả: in ra terminal dạng markdown (copy-paste được)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILLS_DIR = path.resolve(__dirname, '..');
const RESULTS = [];

function out(msg = '') { console.log(msg); RESULTS.push(msg); }

// ─── Helpers ──────────────────────────────────────────────
function countFilesRecursive(dir) {
  let files = 0, lines = 0;
  if (!fs.existsSync(dir)) return { files, lines };
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countFilesRecursive(full);
      files += sub.files;
      lines += sub.lines;
    } else {
      files++;
      try { lines += fs.readFileSync(full, 'utf8').split('\n').length; } catch {}
    }
  }
  return { files, lines };
}

function silenced(fn) {
  const orig = console.log;
  console.log = () => {};
  const result = fn();
  console.log = orig;
  return result;
}

function countPattern(content, regex) {
  return (content.match(regex) || []).length;
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  out('# Benchmark — Please Done');
  out(`> Ngày: ${new Date().toISOString().slice(0, 10)}`);
  out(`> Node: ${process.version}`);
  out(`> OS: ${os.platform()} ${os.arch()}`);

  // ════════════════════════════════════════════════════════
  out('\n## 1. Hiệu suất cài đặt');
  out('');
  out('Cài vào thư mục tạm → đo thời gian + files sinh ra → gỡ → xác nhận sạch.');
  out('');
  out('| Nền tảng | Cài (ms) | Gỡ (ms) | Files | Dòng | Rò rỉ path |');
  out('|----------|---------|---------|-------|------|-----------|');

  const { scanLeakedPaths } = require('../bin/lib/manifest');
  const platformMap = {
    codex: 'Codex CLI',
    copilot: 'GitHub Copilot',
    gemini: 'Gemini CLI',
    opencode: 'OpenCode',
  };

  let totalFiles = 0, totalLines = 0;

  for (const [key, name] of Object.entries(platformMap)) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `pd-bench-${key}-`));
    const installer = require(`../bin/lib/installers/${key}`);

    // Cài
    const t1 = performance.now();
    await silenced(() => installer.install(SKILLS_DIR, tmpDir, { version: '0.0.0-bench' }));
    const installMs = Math.round(performance.now() - t1);

    // Đếm
    const { files, lines } = countFilesRecursive(tmpDir);
    totalFiles += files;
    totalLines += lines;

    // Rò rỉ
    const leaked = scanLeakedPaths(tmpDir, '~/.claude/');

    // Gỡ
    const t2 = performance.now();
    await silenced(() => installer.uninstall(tmpDir));
    const uninstallMs = Math.round(performance.now() - t2);

    out(`| ${name} | ${installMs} | ${uninstallMs} | ${files} | ${lines.toLocaleString()} | ${leaked.length === 0 ? '✅ 0' : '❌ ' + leaked.length} |`);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  out('');
  out(`**Tổng**: ${totalFiles} files, ${totalLines.toLocaleString()} dòng được sinh ra cho 4 nền tảng từ 1 bộ source duy nhất.`);

  // ════════════════════════════════════════════════════════
  out('\n## 2. Idempotency (cài lại an toàn)');
  out('');

  let idempotentPass = 0;
  for (const key of Object.keys(platformMap)) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `pd-idem-${key}-`));
    const installer = require(`../bin/lib/installers/${key}`);

    await silenced(() => installer.install(SKILLS_DIR, tmpDir, { version: '1.0.0' }));
    const count1 = countFilesRecursive(tmpDir).files;

    await silenced(() => installer.install(SKILLS_DIR, tmpDir, { version: '2.0.0' }));
    const count2 = countFilesRecursive(tmpDir).files;

    const ok = Math.abs(count1 - count2) <= 1; // manifest file may differ
    if (ok) idempotentPass++;

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  out(`Cài 2 lần liên tiếp (v1 → v2): **${idempotentPass}/4 nền tảng** không tạo file thừa.`);

  // ════════════════════════════════════════════════════════
  out('\n## 3. Smoke tests');
  out('');

  // Chạy test và đếm kết quả
  const { execSync } = require('child_process');
  try {
    const testOutput = execSync("node --test 'test/smoke-*.test.js' 2>&1", {
      encoding: 'utf8',
      cwd: SKILLS_DIR,
      timeout: 60000,
    });

    const passMatch = testOutput.match(/pass (\d+)/);
    const failMatch = testOutput.match(/fail (\d+)/);
    const durationMatch = testOutput.match(/duration_ms ([\d.]+)/);

    const pass = passMatch ? passMatch[1] : '?';
    const fail = failMatch ? failMatch[1] : '?';
    const duration = durationMatch ? Math.round(parseFloat(durationMatch[1])) : '?';

    out(`| Kết quả | Số lượng |`);
    out(`|---------|---------|`);
    out(`| ✅ Đạt | ${pass} |`);
    out(`| ❌ Lỗi | ${fail} |`);
    out(`| ⏱ Thời gian | ${duration}ms |`);
  } catch (err) {
    const output = err.stdout || err.stderr || '';
    const passMatch = output.match(/pass (\d+)/);
    const failMatch = output.match(/fail (\d+)/);
    out(`Tests: ${passMatch ? passMatch[1] : '?'} đạt, ${failMatch ? failMatch[1] : '?'} lỗi`);
  }

  // ════════════════════════════════════════════════════════
  out('\n## 4. Phân tích cấu trúc workflow');
  out('');

  // Đọc tất cả workflow + command files
  const workflowDir = path.join(SKILLS_DIR, 'workflows');
  const commandDir = path.join(SKILLS_DIR, 'commands', 'pd');
  const refDir = path.join(SKILLS_DIR, 'references');
  const tplDir = path.join(SKILLS_DIR, 'templates');

  let totalSteps = 0;
  let totalGates = 0;
  let totalRecovery = 0;
  let totalUserInteraction = 0;
  let totalWorkflowLines = 0;

  const workflowFiles = fs.readdirSync(workflowDir).filter(f => f.endsWith('.md'));

  for (const file of workflowFiles) {
    const content = fs.readFileSync(path.join(workflowDir, file), 'utf8');
    totalWorkflowLines += content.split('\n').length;
    totalSteps += countPattern(content, /^##\s+Bước\s+/gm);
    totalGates += countPattern(content, /DỪNG|CHẶN|\*\*DỪNG\*\*|\*\*CHẶN\*\*/g);
    totalRecovery += countPattern(content, /khôi phục|phục hồi|PROGRESS\.md|DISCUSS_STATE|debug\//gi);
    totalUserInteraction += countPattern(content, /AskUserQuestion|hỏi user|yêu cầu.*xác nhận/gi);
  }

  // Đếm files hỗ trợ
  const refFiles = fs.existsSync(refDir) ? fs.readdirSync(refDir).filter(f => f.endsWith('.md')).length : 0;
  const tplFiles = fs.existsSync(tplDir) ? fs.readdirSync(tplDir).filter(f => f.endsWith('.md')).length : 0;
  const commandFiles = fs.readdirSync(commandDir).filter(f => f.endsWith('.md')).length;
  const rulesDir = path.join(commandDir, 'rules');
  const rulesFiles = fs.existsSync(rulesDir) ? countFilesRecursive(rulesDir).files : 0;

  out('| Thành phần | Số lượng |');
  out('|-----------|---------|');
  out(`| Skills (lệnh người dùng gọi) | ${commandFiles} |`);
  out(`| Workflows (quy trình chi tiết) | ${workflowFiles.length} |`);
  out(`| Tổng bước workflow | ${totalSteps} |`);
  out(`| Cổng kiểm tra (DỪNG/CHẶN) | ${totalGates} |`);
  out(`| Điểm khôi phục (gián đoạn) | ${totalRecovery} |`);
  out(`| Điểm tương tác người dùng | ${totalUserInteraction} |`);
  out(`| Templates (mẫu file) | ${tplFiles} |`);
  out(`| References (quy ước chung) | ${refFiles} |`);
  out(`| Rules (quy tắc code theo stack) | ${rulesFiles} |`);
  out(`| Tổng dòng workflow | ${totalWorkflowLines.toLocaleString()} |`);

  // ════════════════════════════════════════════════════════
  out('\n## 5. Khả năng đa nền tảng');
  out('');
  out('Viết 1 lần bằng format Claude Code → trình cài đặt tự chuyển đổi cho từng nền tảng.');
  out('');
  out('| Nền tảng | Lệnh gọi | Đường dẫn config | Tool mapping |');
  out('|----------|----------|-----------------|-------------|');

  const { PLATFORMS } = require('../bin/lib/platforms');
  for (const [key, p] of Object.entries(PLATFORMS)) {
    const toolCount = Object.keys(p.toolMap || {}).length;
    out(`| ${p.name} | \`${p.commandPrefix}init\` | \`~/${p.dirName}/\` | ${toolCount > 0 ? toolCount + ' tools' : 'giữ nguyên'} |`);
  }

  // ════════════════════════════════════════════════════════
  out('\n## 6. Luồng làm việc chính');
  out('');
  out('```');
  out('/pd:init          Khởi tạo môi trường, phát hiện tech stack');
  out('    ↓');
  out('/pd:scan          Quét cấu trúc dự án, báo cáo bảo mật');
  out('    ↓');
  out('/pd:new-milestone Lập kế hoạch chiến lược + yêu cầu + lộ trình');
  out('    ↓');
  out('/pd:plan          Thiết kế kỹ thuật + chia danh sách công việc');
  out('    ↓');
  out('/pd:write-code    AI viết code theo kế hoạch (auto/parallel)');
  out('    ↓');
  out('/pd:test          Kiểm thử tự động (hoặc thủ công cho frontend)');
  out('    ↓');
  out('/pd:fix-bug       Sửa lỗi theo phương pháp khoa học');
  out('    ↓');
  out('/pd:complete-milestone  Đóng phiên bản, tạo git tag, báo cáo');
  out('```');
  out('');
  out('Mỗi bước có cổng kiểm tra — AI không thể bỏ qua hoặc tự ý thay đổi thiết kế đã duyệt.');

  // ════════════════════════════════════════════════════════
  out('\n---');
  out(`*Benchmark chạy tự động bởi \`node test/benchmark.js\` — ${new Date().toISOString()}*`);

  // Ghi file
  const outputPath = path.join(SKILLS_DIR, 'BENCHMARK_RESULTS.md');
  fs.writeFileSync(outputPath, RESULTS.join('\n') + '\n', 'utf8');
  console.log(`\n→ Đã ghi kết quả vào ${outputPath}`);
}

main().catch(err => {
  console.error('Benchmark lỗi:', err.message);
  process.exit(1);
});
