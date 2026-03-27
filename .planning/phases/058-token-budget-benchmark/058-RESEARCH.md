# Phase 58: Token Budget & Benchmark - Research

**Researched:** 2026-03-27
**Domain:** Token optimization, benchmarking, eval pipeline
**Confidence:** HIGH

## Summary

Phase 58 tập trung vào 4 mục tiêu: (1) thêm TOKEN_BUDGET constant vào `resource-config.js` theo tier, (2) chạy benchmark before/after và ghi kết quả vào `BENCHMARK_RESULTS.md`, (3) mở rộng `conditional_reading` sang ít nhất 2 workflows mới, (4) verify eval pipeline chạy đúng với `promptfooconfig.yaml`.

Infrastructure đã sẵn sàng gần như hoàn toàn. `count-tokens.js` có đầy đủ `--baseline` và `--compare` mode. `evals/run.js` có `compareBenchmarks()`. 8/13 workflows đã dùng `conditional_reading`. Baseline hiện tại cũ (84,899 tokens từ 2026-03-22, 39 files) nhưng scan mới cho thấy 86,305 tokens trên 48 files -- cần cập nhật baseline.

**Primary recommendation:** Thêm `TOKEN_BUDGET` vào `TIER_MAP` trong `resource-config.js`, chạy `count-tokens.js --baseline` để capture baseline mới, thêm conditional_reading vào `scan.md` và `init.md` (hoặc `audit.md`), rồi ghi kết quả vào `BENCHMARK_RESULTS.md`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Enforce token caps từ REQUIREMENTS.md: Scout <=4K, Builder <=8K, Architect <=12K prompt tokens
- **D-02:** Caps là enforcement limits trong `resource-config.js`, không chỉ documentation -- thêm `TOKEN_BUDGET` constant per tier
- **D-03:** Benchmark thực tế dùng để validate caps (nếu agent vượt budget -> warning log, không hard fail)
- **D-04:** Cập nhật baseline mới từ trạng thái hiện tại (post-v5.0) bằng `node scripts/count-tokens.js --baseline`
- **D-05:** Đo toàn bộ 39+ files trong 4 target directories (commands/pd, workflows, references, templates)
- **D-06:** So sánh per-tier: nhóm files theo tier tiêu thụ (scout agents đọc files nào, builder đọc files nào)
- **D-07:** Kết quả ghi vào `BENCHMARK_RESULTS.md` tại project root -- bảng before/after với delta % per directory
- **D-08:** Scan tất cả workflows chưa có `<conditional_reading>` block
- **D-09:** Ưu tiên workflows có references nặng (token count cao) -- sắp xếp theo tiềm năng tiết kiệm
- **D-10:** Target: ít nhất 2 workflows mới có conditional_reading (per TOKN-03)
- **D-11:** Giữ nguyên format XML tags hiện có (`<required_reading>` + `<conditional_reading>`)
- **D-12:** Chạy `npm run eval:full` trước và sau khi thay đổi -- so sánh pass rate + token count
- **D-13:** Thêm token tracking per eval run vào benchmark history (`evals/benchmarks/`)
- **D-14:** `promptfooconfig.yaml` đã tồn tại và đủ test cases -- chỉ verify nó chạy đúng, không cần thêm tests mới

### Claude's Discretion
- Format cụ thể của `BENCHMARK_RESULTS.md` (bảng markdown, headers, sections)
- Thứ tự scan workflows cho conditional_reading expansion
- Chi tiết implementation của TOKEN_BUDGET enforcement (warning vs log vs metric)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOKN-01 | Token budget per tier -- Scout <=4K, Builder <=8K, Architect <=12K prompt tokens | Thêm `tokenBudget` field vào TIER_MAP trong `resource-config.js`, export TOKEN_BUDGET constant, cập nhật tests |
| TOKN-02 | Before/after benchmark -- chạy `count-tokens.js` trước và sau, ghi vào `BENCHMARK_RESULTS.md` | `count-tokens.js` đã có --baseline/--compare modes. Cần capture baseline mới (hiện tại 86,305 tokens/48 files) |
| TOKN-03 | Mở rộng `conditional_reading` pattern sang các workflows khác | 5 workflows chưa có: scan.md, init.md, conventions.md, audit.md, research.md. Ưu tiên audit.md (3,992 tokens) và scan.md (1,938 tokens) |
| TOKN-04 | Eval integration -- dùng `evals/` + `promptfooconfig.yaml` đo chất lượng sau giảm token | `promptfoo` chưa cài global nhưng `evals/run.js` + `promptfooconfig.yaml` đã sẵn sàng. Cần verify hoặc cài `promptfoo` |
</phase_requirements>

## Architecture Patterns

### Hiện trạng token count (scan mới nhất)

| Directory | Files | Tokens | % tổng |
|-----------|-------|--------|--------|
| commands/pd | 14 | 10,542 | 12.2% |
| workflows | 13 | 49,395 | 57.2% |
| references | 9 | 18,473 | 21.4% |
| templates | 12 | 7,895 | 9.1% |
| **TOTAL** | **48** | **86,305** | **100%** |

So với baseline cũ (84,899 tokens, 39 files): tăng 1,406 tokens (+1.7%) do thêm 9 files mới.

### Workflows chưa có conditional_reading

| Workflow | Tokens | References | Ưu tiên |
|----------|--------|------------|---------|
| `audit.md` | 3,992 | Không dùng @references trực tiếp (tham chiếu qua purpose block) | Cao -- workflow nặng, có thể conditional hóa security-checklist |
| `scan.md` | 1,938 | Không có @references | Trung bình -- ít references nhưng có thể thêm conditional cho security-checklist |
| `init.md` | 2,241 | Không có @references | Trung bình -- workflow đơn giản |
| `conventions.md` | 950 | 1 ref (conventions.md) -- đã required | Thấp -- quá nhỏ, ref duy nhất là bắt buộc |
| `research.md` | 1,019 | 1 ref (conventions.md) -- đã required | Thấp -- nhỏ, ref duy nhất là bắt buộc |

**Khuyến nghị:** Thêm conditional_reading vào `scan.md` và `init.md` (hoặc `audit.md`). Workflows nhỏ (<1K tokens) như `conventions.md` và `research.md` không đáng tối ưu.

### Per-tier token consumption mapping

Dựa trên AGENT_REGISTRY, agents thuộc các tier sẽ đọc workflows khác nhau:

| Tier | Budget | Agents | Workflows thường đọc |
|------|--------|--------|---------------------|
| Scout (<=4K) | 4,000 | bug-janitor, doc-specialist, codebase-mapper, security-researcher, feature-analyst | scan, init -- workflows nhẹ |
| Builder (<=8K) | 8,000 | code-detective, repro-engineer, evidence-collector, sec-reporter, regression-analyzer | fix-bug, write-code, test |
| Architect (<=12K) | 12,000 | fix-architect, fact-checker, research-synthesizer, pd-planner | plan, new-milestone, write-code |

### Pattern: TOKEN_BUDGET trong resource-config.js

```javascript
// Thêm tokenBudget vào TIER_MAP
const TIER_MAP = {
  scout: { model: "haiku", effort: "low", maxTurns: 15, tokenBudget: 4000 },
  builder: { model: "sonnet", effort: "medium", maxTurns: 25, tokenBudget: 8000 },
  architect: { model: "opus", effort: "high", maxTurns: 30, tokenBudget: 12000 },
};

// Export constant cho backward compatibility
const TOKEN_BUDGET = {
  scout: 4000,
  builder: 8000,
  architect: 12000,
};
```

### Pattern: conditional_reading block

Format nhất quán với 8 workflows hiện có:

```markdown
<conditional_reading>
Doc CHI KHI can (phan tich mo ta task truoc):
- @references/security-checklist.md -> kiem tra bao mat -- KHI scan lien quan bao mat
- @references/state-machine.md -> luong trang thai -- KHI can hieu state transitions
</conditional_reading>
```

### Pattern: BENCHMARK_RESULTS.md

```markdown
# Benchmark Results

**Captured:** 2026-03-27
**Tool:** `scripts/count-tokens.js`

## Before/After Summary

| Directory | Before | After | Delta | Change |
|-----------|--------|-------|-------|--------|
| commands/pd | X | Y | Z | -N% |
| workflows | X | Y | Z | -N% |
| references | X | Y | Z | -N% |
| templates | X | Y | Z | -N% |
| **TOTAL** | **X** | **Y** | **Z** | **-N%** |

## Per-Tier Budget Compliance

| Tier | Budget | Actual Max | Status |
|------|--------|-----------|--------|
| Scout | 4,000 | X | OK/WARN |
| Builder | 8,000 | X | OK/WARN |
| Architect | 12,000 | X | OK/WARN |

## Conditional Reading Expansion

| Workflow | Before | After | Savings |
|----------|--------|-------|---------|
| scan.md | N/A | conditional | X tokens |
| init.md | N/A | conditional | X tokens |
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token counting | Custom tokenizer | `js-tiktoken` (GPT-4o encoding) | Chính xác, nhanh, đã dùng trong count-tokens.js |
| Benchmark comparison | Custom diff tool | `count-tokens.js --compare` | Đã có đầy đủ per-file/per-dir delta |
| Eval quality measurement | Custom eval framework | `promptfoo` + `evals/run.js` | Industry standard, đã configured |
| Benchmark history | Custom tracking | `evals/run.js --full` + `saveBenchmark()` | Đã lưu JSON entries với timestamp |

## Common Pitfalls

### Pitfall 1: Baseline cũ không khớp file count
**What goes wrong:** Baseline cũ (39 files) khác scan mới (48 files) -- so sánh sẽ có nhiều entries "NEW"
**Why it happens:** 9 files mới được thêm sau baseline cũ (audit.md, research.md, templates mới...)
**How to avoid:** Capture baseline mới TRƯỚC khi bắt đầu thay đổi, dùng `node scripts/count-tokens.js --baseline`
**Warning signs:** Compare output có nhiều dòng "NEW" thay vì % change

### Pitfall 2: promptfoo chưa cài
**What goes wrong:** `npm run eval:full` fail vì `promptfoo` command không tồn tại
**Why it happens:** `promptfoo` không có trong package.json dependencies, phụ thuộc global install
**How to avoid:** Kiểm tra `command -v promptfoo` trước. Nếu thiếu: `npm install -g promptfoo` hoặc `npx promptfoo`
**Warning signs:** `evals/run.js` exit code 1 với error "command not found"

### Pitfall 3: ANTHROPIC_API_KEY cần cho eval
**What goes wrong:** `evals/run.js` exit ngay dòng 37-39 nếu không có ANTHROPIC_API_KEY
**Why it happens:** Eval cần gọi Claude API thực tế
**How to avoid:** Verify `.env` file có ANTHROPIC_API_KEY trước khi chạy eval. Nếu không có key, chỉ verify config, không chạy eval thực tế
**Warning signs:** Error message "[error] ANTHROPIC_API_KEY not found"

### Pitfall 4: Token budget quá thấp so với thực tế
**What goes wrong:** Scout budget 4K nhưng workflow + refs có thể vượt 4K khi đọc nhiều files
**Why it happens:** Budget là prompt tokens (instructions), không phải total context
**How to avoid:** Budget áp dụng cho phần skill content (workflow + required_reading), không phải toàn bộ conversation
**Warning signs:** Tất cả agents đều WARN khi so sánh

## Code Examples

### Chạy baseline capture
```bash
# Capture baseline mới (post-v5.0)
node scripts/count-tokens.js --baseline

# Output: test/baseline-tokens.json updated
```

### Chạy compare sau thay đổi
```bash
# So sánh với baseline
node scripts/count-tokens.js --compare

# Output: bảng per-file with delta %
```

### Thêm TOKEN_BUDGET vào resource-config.js
```javascript
// Trong TIER_MAP, thêm tokenBudget field
const TIER_MAP = {
  scout: { model: "haiku", effort: "low", maxTurns: 15, tokenBudget: 4000 },
  builder: { model: "sonnet", effort: "medium", maxTurns: 25, tokenBudget: 8000 },
  architect: { model: "opus", effort: "high", maxTurns: 30, tokenBudget: 12000 },
};

// Export riêng cho tiện truy cập
const TOKEN_BUDGET = {
  scout: TIER_MAP.scout.tokenBudget,
  builder: TIER_MAP.builder.tokenBudget,
  architect: TIER_MAP.architect.tokenBudget,
};
```

### Thêm test cho TOKEN_BUDGET
```javascript
describe('TOKEN_BUDGET', () => {
  it('moi tier co tokenBudget', () => {
    for (const [tier, config] of Object.entries(TIER_MAP)) {
      assert.ok(config.tokenBudget > 0, `${tier} thieu tokenBudget`);
    }
  });

  it('scout <= 4000, builder <= 8000, architect <= 12000', () => {
    assert.equal(TIER_MAP.scout.tokenBudget, 4000);
    assert.equal(TIER_MAP.builder.tokenBudget, 8000);
    assert.equal(TIER_MAP.architect.tokenBudget, 12000);
  });
});
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Token counting, eval runner | Checked | (runtime available) | -- |
| js-tiktoken | count-tokens.js | Checked (in package.json ^1.0.21) | ^1.0.21 | -- |
| promptfoo | eval pipeline (TOKN-04) | Not found (global) | -- | `npx promptfoo` hoac skip eval run, chi verify config |
| ANTHROPIC_API_KEY | eval runner | Unknown (.env file) | -- | Skip eval run, chi verify config structure |

**Missing dependencies with fallback:**
- `promptfoo`: Chua cai global. Fallback: dung `npx promptfoo eval` hoac `npm install -g promptfoo`. Hoac chi verify config yaml khong chay eval thuc te.
- `ANTHROPIC_API_KEY`: Can cho eval thuc te. Fallback: chi verify `promptfooconfig.yaml` structure + `evals/run.js` logic, khong chay eval.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Config file | Khong can -- `node --test 'test/*.test.js'` |
| Quick run command | `node --test test/smoke-resource-config.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOKN-01 | TOKEN_BUDGET constant per tier trong resource-config.js | unit | `node --test test/smoke-resource-config.test.js` | Co (can them test cases) |
| TOKN-02 | Before/after benchmark ghi vao BENCHMARK_RESULTS.md | smoke | `node scripts/count-tokens.js --compare` | Co (count-tokens.js da co) |
| TOKN-03 | >=2 workflows moi co conditional_reading | smoke | `grep -l 'conditional_reading' workflows/*.md \| wc -l` (expect >=10) | Khong can test file rieng |
| TOKN-04 | promptfooconfig.yaml configured dung | smoke | `node -e "require('js-yaml').load(require('fs').readFileSync('promptfooconfig.yaml'))"` | Co (yaml da ton tai) |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-resource-config.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green truoc `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Them test cases cho `tokenBudget` field trong `test/smoke-resource-config.test.js`
- [ ] Them test case cho `TOKEN_BUDGET` export

*(Test infrastructure hien tai da du -- chi can them test cases vao file co san)*

## Sources

### Primary (HIGH confidence)
- `scripts/count-tokens.js` -- doc truc tiep, hieu day du --baseline/--compare modes
- `bin/lib/resource-config.js` -- doc truc tiep, hieu TIER_MAP/AGENT_REGISTRY structure
- `evals/run.js` -- doc truc tiep, hieu saveBenchmark()/compareBenchmarks()
- `test/baseline-tokens.json` -- baseline cu: 84,899 tokens, 39 files, 2026-03-22
- `promptfooconfig.yaml` -- doc truc tiep, confirmed configuration
- Token scan thuc te: 86,305 tokens, 48 files (chay `count-tokens.js` truc tiep)

### Secondary (MEDIUM confidence)
- Conditional reading pattern analysis -- grep 8/13 workflows da co pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- tat ca tools da co san trong project, chi can su dung
- Architecture: HIGH -- patterns da established (conditional_reading, TIER_MAP, benchmark)
- Pitfalls: HIGH -- verified truc tiep (promptfoo missing, baseline outdated, API key requirement)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable -- tools va patterns khong thay doi nhanh)
