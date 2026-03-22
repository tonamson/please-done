# Requirements: Please-Done Workflow Optimization

**Defined:** 2026-03-22
**Core Value:** Every workflow step must produce the highest quality code output while consuming the minimum tokens and time

## v1 Requirements

### Token Optimization

- [x] **TOKN-01**: Loại bỏ redundancy giữa 12 skill files — extract shared content thành micro-templates
- [x] **TOKN-02**: Giảm 30-40% dòng text thừa trong workflow prose (structural content, không đụng behavioral instructions)
- [x] **TOKN-03**: Conditional context loading — chỉ load references/rules khi task type cần, không dump hết upfront
- [x] **TOKN-04**: Effort-level routing — dùng model nhỏ hơn cho task đơn giản, Opus chỉ cho planning/complex

### Library-Aware Generation

- [ ] **LIBR-01**: Standardize Context7 usage — mọi task dùng external library phải resolve-library-id + query-docs
- [ ] **LIBR-02**: Fallback chain khi Context7 fail — project docs > codebase examples > training data
- [ ] **LIBR-03**: Auto-detect library versions từ package.json/pubspec.yaml/composer.json để truyền vào Context7

### Parallel Execution

- [ ] **PARA-01**: Wave-based parallel execution — topological sort tasks, nhóm independent tasks thành waves chạy đồng thời
- [ ] **PARA-02**: File-conflict detection — phân tích affected files, ngăn 2 agents sửa cùng 1 file trong cùng wave
- [ ] **PARA-03**: Enhanced shared-file detection — phát hiện barrel exports, config files, shared modules, framework hotspots (app.module.ts, layout.tsx)

### Skill Readability

- [x] **READ-01**: Consistent structure across all 12 skills — format thống nhất: frontmatter, guards, execution, output
- [x] **READ-02**: Tách rõ shell layer (argument parsing, validation, prerequisites) vs execution layer (business logic)

### Installer/Converter

- [ ] **INST-01**: Extract ~80% shared converter logic thành base converter — platform-specific converters chỉ override differences
- [ ] **INST-02**: Propagate errors rõ ràng — không silent catch, log failures, verify outputs

## v2 Requirements

### Advanced Token Optimization

- **TOKN-05**: Persistent agent memory — cache project context across sessions
- **TOKN-06**: Token counting instrumentation — đo lường token usage per skill invocation

### Advanced Parallel

- **PARA-04**: Agent Teams integration — evaluate vs current subagent model
- **PARA-05**: Optimistic parallel execution — run with rollback on conflict

### Platform

- **INST-03**: Automated cross-platform regression testing
- **INST-04**: Rollback mechanism for failed installations

## Out of Scope

| Feature | Reason |
|---------|--------|
| New platform targets | Focus on optimizing existing 5 platforms, not adding new ones |
| New framework rules | Focus on workflow engine, not expanding rule coverage |
| Rewrite from scratch | Improve existing code, maintain backward compatibility |
| Build step / bundler | Project uses pure scripts, keep it simple |
| IDE integration | Out of scope for this workflow optimization cycle |
| AI-on-AI review | Over-engineering, not proven to improve quality |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| READ-01 | Phase 1: Skill Structure Normalization | Complete |
| READ-02 | Phase 1: Skill Structure Normalization | Complete |
| TOKN-01 | Phase 2: Cross-Skill Deduplication | Complete |
| TOKN-02 | Phase 3: Prompt Prose Compression | Complete |
| TOKN-03 | Phase 4: Conditional Context Loading | Complete |
| TOKN-04 | Phase 5: Effort-Level Routing | Complete |
| LIBR-01 | Phase 6: Context7 Standardization | Pending |
| LIBR-02 | Phase 7: Library Fallback and Version Detection | Pending |
| LIBR-03 | Phase 7: Library Fallback and Version Detection | Pending |
| PARA-01 | Phase 8: Wave-Based Parallel Execution | Pending |
| PARA-02 | Phase 8: Wave-Based Parallel Execution | Pending |
| PARA-03 | Phase 8: Wave-Based Parallel Execution | Pending |
| INST-01 | Phase 9: Converter Pipeline Optimization | Pending |
| INST-02 | Phase 9: Converter Pipeline Optimization | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation*
