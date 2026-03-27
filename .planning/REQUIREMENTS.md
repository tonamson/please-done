# Requirements: Please-Done Repo Optimization

**Defined:** 2026-03-27
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v1 Requirements

Requirements for v5.0 milestone. Each maps to roadmap phases.

### Agent Reform

- [x] **AGEN-01**: 3-tier model system (Scout/Builder/Architect) replaces hardcoded model names in agent configs
- [x] **AGEN-02**: `pd-codebase-mapper` agent (Scout tier) quét cấu trúc codebase nhanh, cập nhật `.planning/codebase/`
- [x] **AGEN-03**: `pd-security-researcher` agent (Scout tier) bổ sung research security chuyên sâu
- [x] **AGEN-04**: `pd-feature-analyst` agent (Scout tier) phân tích tính năng
- [x] **AGEN-05**: `pd-research-synthesizer` agent (Architect tier) tổng hợp research từ nhiều agents
- [x] **AGEN-06**: `pd-planner` agent (Architect tier) chuyên plan cho PD phases
- [x] **AGEN-07**: `pd-regression-analyzer` agent (Builder tier) nâng từ `regression-analyzer.js` thành agent có dispatch
- [x] **AGEN-08**: Mỗi agent mới có smoke test trong `test/smoke-agent-files.test.js`
- [x] **AGEN-09**: `pd-regression-analyzer` được thêm vào `AGENT_REGISTRY` trong `resource-config.js`

### Platform Mapping

- [x] **PLAT-01**: `TIER_MAP` config trong `resource-config.js` map tier→model per platform (Claude Code, Gemini CLI, Cursor/Windsurf, Copilot)
- [x] **PLAT-02**: Fallback tự động — nền tảng thiếu tier cao → hạ cấp xuống model cao nhất hiện có

### Parallel Dispatch

- [x] **PARA-01**: `parallel-dispatch.js` gọi `getAdaptiveParallelLimit()` thay vì hardcode 2 workers
- [x] **PARA-02**: `isHeavyAgent()` check trước khi spawn — agent nặng giảm 1 worker
- [x] **PARA-03**: `PARALLEL_MIN=2` và `PARALLEL_MAX=4` được enforce
- [x] **PARA-04**: Backpressure — worker timeout >120s → không spawn thêm, chờ xong
- [x] **PARA-05**: Graceful degradation — load average > CPU count → giảm 1 worker, log cảnh báo

### Skill Integration

- [x] **SKIL-01**: `init` workflow tự động triệu hồi `pd-codebase-mapper` sau init brownfield project
- [x] **SKIL-02**: Research Squad activation — Mapper + Security + Feature + Synthesizer chạy đồng thời
- [x] **SKIL-03**: `plan` workflow soft-guard `TECHNICAL_STRATEGY.md` — warning nếu thiếu, cho phép tiếp tục
- [x] **SKIL-04**: Auto-injection — nạp `TECHNICAL_STRATEGY.md` vào `pd-planner` context nếu tồn tại

### Reference Dedup

- [x] **DEDU-01**: Gộp `verification-patterns.md` + `plan-checker.md` → `verification.md`
- [x] **DEDU-02**: Cập nhật tất cả references đến 2 file cũ → file mới

### Runtime DRY

- [x] **DRYU-01**: Trích `ensureDir()`, `validateGitRoot()`, `copyWithBackup()` thành `installer-utils.js`
- [x] **DRYU-02**: 4 platform installers import utils, giữ logic platform-specific nguyên vẹn
- [x] **DRYU-03**: Review 4 converter configs consistent (key names, format)

### Token Budget

- [x] **TOKN-01**: Token budget per tier — Scout ≤ 4K, Builder ≤ 8K, Architect ≤ 12K prompt tokens
- [x] **TOKN-02**: Before/after benchmark — chạy `count-tokens.js` trước và sau, ghi vào `BENCHMARK_RESULTS.md`
- [x] **TOKN-03**: Mở rộng `conditional_reading` pattern sang các workflows khác (ngoài `plan.md`)
- [x] **TOKN-04**: Eval integration — dùng `evals/` + `promptfooconfig.yaml` đo chất lượng sau giảm token

## Future Requirements

### Codebase Handoff

- **HAND-01**: Unified handoff format — mọi kết quả nộp về Markdown chuẩn trong `.planning/research/raw/`
- **HAND-02**: State-first — Agent luôn đọc `STATE.md` trước khi bắt đầu
- **HAND-03**: Audit citations — dẫn chứng link/file bắt buộc, kiểm tra chéo

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rewriting skills from scratch | Improve existing, don't replace |
| Breaking changes to skill names | Maintain backward compatibility |
| New platform targets | Focus on improving existing workflow quality |
| New framework rules | Focus on optimizing the workflow engine |
| Modifying FastCode subsystem | Python stack independent, not in scope |
| Modifying existing agent behavior | Only add new agents, don't change working ones |
| Deleting `fix-bug-v1.5.md` | Fallback workflow — xóa = crash |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AGEN-01 | Phase 59 | Complete |
| AGEN-02 | Phase 53 | Complete |
| AGEN-03 | Phase 53 | Complete |
| AGEN-04 | Phase 53 | Complete |
| AGEN-05 | Phase 53 | Complete |
| AGEN-06 | Phase 53 | Complete |
| AGEN-07 | Phase 53 | Complete |
| AGEN-08 | Phase 53 | Complete |
| AGEN-09 | Phase 59 | Complete |
| PLAT-01 | Phase 54, 59 | Complete |
| PLAT-02 | Phase 54, 59 | Complete |
| PARA-01 | Phase 55 | Complete |
| PARA-02 | Phase 55, 59 | Complete |
| PARA-03 | Phase 55 | Complete |
| PARA-04 | Phase 55 | Complete |
| PARA-05 | Phase 55 | Complete |
| SKIL-01 | Phase 56 | Complete |
| SKIL-02 | Phase 56 | Complete |
| SKIL-03 | Phase 56 | Complete |
| SKIL-04 | Phase 56 | Complete |
| DEDU-01 | Phase 57 | Complete |
| DEDU-02 | Phase 57 | Complete |
| DRYU-01 | Phase 57 | Complete |
| DRYU-02 | Phase 57 | Complete |
| DRYU-03 | Phase 57 | Complete |
| TOKN-01 | Phase 58 | Complete |
| TOKN-02 | Phase 58 | Complete |
| TOKN-03 | Phase 58 | Complete |
| TOKN-04 | Phase 58 | Complete |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation*
