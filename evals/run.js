#!/usr/bin/env node
/**
 * Eval runner — load .env, chạy promptfoo, lưu benchmark history.
 *
 * Usage:
 *   node evals/run.js                    — chạy workflow eval
 *   node evals/run.js --trigger          — chạy trigger accuracy eval
 *   node evals/run.js --full             — chạy cả 2 + lưu benchmark
 *   node evals/run.js --compare          — so sánh benchmark history
 *   node evals/run.js --filter-pattern X — filter tests
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BENCHMARK_DIR = path.join(ROOT, 'evals', 'benchmarks');
const TMP_DIR = '/tmp/pd-eval';

// ── Load .env ──────────────────────────────────────────────────
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[error] ANTHROPIC_API_KEY not found. Create .env with: ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

// ── Helpers ────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/**
 * Chạy eval với output real-time (stdio: inherit) + capture output vào file tạm.
 * Dùng shell pipe tee để vừa hiển thị vừa lưu.
 */
function runEval(configFlag, label) {
  ensureDir(TMP_DIR);
  const tmpFile = path.join(TMP_DIR, `${label}.txt`);
  const configArg = configFlag ? `--config ${configFlag}` : '';
  const cmd = `promptfoo eval ${configArg} --max-concurrency 1 2>&1 | tee ${tmpFile}`;

  const result = spawnSync('sh', ['-c', cmd], {
    stdio: 'inherit',
    env: process.env,
    cwd: ROOT,
  });

  // Read captured output for benchmark
  let output = '';
  try { output = fs.readFileSync(tmpFile, 'utf-8'); } catch (_) {}
  return { exitCode: result.status, output };
}

// ── Benchmark save ─────────────────────────────────────────────
function saveBenchmark(name, output) {
  ensureDir(BENCHMARK_DIR);

  const resultMatch = output.match(/(\d+) passed.*?(\d+) failed.*?(\d+) error/);
  const tokenMatch = output.match(/Total Tokens:\s*([\d,]+)/);
  const durationMatch = output.match(/Duration:\s*(\S+)/);

  const entry = {
    timestamp: new Date().toISOString(),
    suite: name,
    passed: resultMatch ? parseInt(resultMatch[1]) : 0,
    failed: resultMatch ? parseInt(resultMatch[2]) : 0,
    errors: resultMatch ? parseInt(resultMatch[3]) : 0,
    total_tokens: tokenMatch ? parseInt(tokenMatch[1].replace(/,/g, '')) : 0,
    duration: durationMatch ? durationMatch[1] : 'unknown',
  };
  entry.pass_rate = entry.passed + entry.failed + entry.errors > 0
    ? Math.round((entry.passed / (entry.passed + entry.failed + entry.errors)) * 100)
    : 0;

  const file = path.join(BENCHMARK_DIR, `${timestamp()}_${name}.json`);
  fs.writeFileSync(file, JSON.stringify(entry, null, 2));
  console.log(`\n[benchmark] Saved → ${path.relative(ROOT, file)}`);
  return entry;
}

// ── Compare benchmarks ─────────────────────────────────────────
function compareBenchmarks() {
  ensureDir(BENCHMARK_DIR);
  const files = fs.readdirSync(BENCHMARK_DIR).filter(f => f.endsWith('.json')).sort();

  if (files.length === 0) {
    console.log('Chua co benchmark nao. Chay: npm run eval:full');
    return;
  }

  const entries = files.map(f => JSON.parse(fs.readFileSync(path.join(BENCHMARK_DIR, f), 'utf-8')));
  const suites = {};
  for (const e of entries) {
    if (!suites[e.suite]) suites[e.suite] = [];
    suites[e.suite].push(e);
  }

  console.log('\n+--------------------------------------------------------------+');
  console.log('|                    BENCHMARK HISTORY                         |');
  console.log('+--------------------------------------------------------------+');

  for (const [suite, runs] of Object.entries(suites)) {
    console.log(`| Suite: ${suite.padEnd(53)}|`);
    console.log('+----------------------+--------+--------+--------+---------+');
    console.log('| Ngay                 | Pass % | Passed | Failed | Tokens  |');
    console.log('+----------------------+--------+--------+--------+---------+');

    for (const r of runs.slice(-10)) {
      const date = r.timestamp.slice(0, 16).replace('T', ' ');
      const pct = `${r.pass_rate}%`.padStart(5);
      const p = String(r.passed).padStart(4);
      const f = String(r.failed).padStart(4);
      const t = String(r.total_tokens).padStart(7);
      console.log(`| ${date.padEnd(20)} | ${pct}  | ${p}   | ${f}   | ${t} |`);
    }
    console.log('+----------------------+--------+--------+--------+---------+');

    if (runs.length >= 2) {
      const prev = runs[runs.length - 2];
      const curr = runs[runs.length - 1];
      const diff = curr.pass_rate - prev.pass_rate;
      const arrow = diff > 0 ? 'UP' : diff < 0 ? 'DOWN' : '==';
      console.log(`| Trend: ${prev.pass_rate}% ${arrow} ${curr.pass_rate}% (${diff >= 0 ? '+' : ''}${diff}%)`.padEnd(62) + '|');
      console.log('+--------------------------------------------------------------+');
    }
  }
  console.log('');
}

// ── Main ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isCompare = args.includes('--compare');
const isTrigger = args.includes('--trigger');
const isFull = args.includes('--full');
const filterArgs = args.filter(a => !['--compare', '--trigger', '--full'].includes(a)).join(' ');

if (isCompare) {
  compareBenchmarks();
  process.exit(0);
}

if (isFull) {
  console.log('\n=== [1/3] Workflow Compliance Tests ===\n');
  const w = runEval(null, 'workflow');
  const wBench = saveBenchmark('workflow', w.output);

  console.log('\n=== [2/3] Trigger Accuracy Tests ===\n');
  const t = runEval('evals/trigger-config.yaml', 'trigger');
  const tBench = saveBenchmark('trigger', t.output);

  console.log('\n=== [3/3] Benchmark Summary ===\n');
  compareBenchmarks();

  const wTotal = wBench.passed + wBench.failed + wBench.errors;
  const tTotal = tBench.passed + tBench.failed + tBench.errors;
  console.log(`Workflow: ${wBench.pass_rate}% (${wBench.passed}/${wTotal})`);
  console.log(`Trigger:  ${tBench.pass_rate}% (${tBench.passed}/${tTotal})`);
  console.log(`\nXem chi tiet: promptfoo view`);

  if (w.exitCode || t.exitCode) process.exit(1);

} else if (isTrigger) {
  const cmd = `promptfoo eval --config evals/trigger-config.yaml --max-concurrency 1 ${filterArgs}`;
  try { execSync(cmd, { stdio: 'inherit', env: process.env, cwd: ROOT }); }
  catch (e) { process.exit(e.status || 1); }

} else {
  const cmd = `promptfoo eval --max-concurrency 1 ${filterArgs}`;
  try { execSync(cmd, { stdio: 'inherit', env: process.env, cwd: ROOT }); }
  catch (e) { process.exit(e.status || 1); }
}
