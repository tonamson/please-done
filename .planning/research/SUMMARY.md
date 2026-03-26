# Tóm tắt Nghiên cứu: v4.0 OWASP Security Audit

**Dự án:** please-done
**Tên miền:** Tích hợp lệnh `pd:audit` — quét bảo mật OWASP Top 10 vào AI coding skill framework
**Tổng hợp:** 2026-03-26
**Độ tin cậy tổng thể:** HIGH
**Dựa trên:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Tóm tắt Điều hành

v4.0 xây dựng khả năng kiểm toán bảo mật OWASP Top 10 cho framework please-done thông qua lệnh `pd:audit`. Điểm mạnh cốt lõi: 13 scanner agent chuyên biệt đã **tồn tại sẵn** trong codebase, cùng với infrastructure wave-based parallel execution (parallel-dispatch.js), session management (session-manager.js), và evidence protocol (evidence-protocol.js) đã được kiểm chứng qua 45 phases trước. Công việc v4.0 là **kết nối và mở rộng**, không phải xây mới từ đầu. Dependency runtime mới duy nhất cần thêm là `js-yaml ^4.1.0` (22KB, zero transitive deps) để parse `security-rules.yaml` với cấu trúc nested objects 3+ cấp.

Cách tiếp cận được khuyến nghị: 1 template scanner thống nhất (`pd-sec-scanner.md`) thay thế 13 file agent riêng lẻ, kết hợp `config/security-rules.yaml` làm nguồn sự thật duy nhất cho OWASP category mapping, regex patterns, và stack applicability. Smart Scanner Selection loại bỏ scanners không liên quan dựa trên tech stack (giảm 40-60% token), wave-based dispatch chạy tối đa 2 scanners song song, và reporter agent tổng hợp 13 evidence files thành `SECURITY_REPORT.md`. Hai chế độ vận hành: độc lập (quét toàn bộ repo) và tích hợp milestone (quét git diff scope, tạo fix phases tự động).

Rủi ro chính cần kiểm soát ngay từ đầu: (1) **False positive overload** — regex pattern matching có false positive rate 30-70%, phải có secondary verification và severity filtering trước khi reporter tổng hợp; (2) **Token explosion** — 13 scanners × full codebase scan có thể tiêu thụ 150K+ tokens, Smart Scanner Selection là bắt buộc chứ không phải nice-to-have; (3) **Agent dispatch reliability** — với 13 agents, xác suất ít nhất 1 agent fail là khoảng 49%, cần validation logic và per-scanner retry sau mỗi wave.

---

## Kết quả Chính

### Từ STACK.md

- **Dependency mới duy nhất:** `js-yaml ^4.1.0` — cần thiết vì `parseFrontmatter()` trong utils.js chỉ xử lý flat YAML, trong khi `security-rules.yaml` cần nested objects 3+ cấp. js-yaml là lựa chọn tối ưu (22KB, zero transitive deps, 25K+ npm dependents, stable từ 2021).
- **5 module JS mới:** `security-rules-loader.js`, `security-scanner-dispatch.js`, `security-delta.js`, `security-report-builder.js`, `security-fix-planner.js` — tất cả pure functions, nhất quán với pattern của 22 modules hiện có.
- **5 module JS mở rộng:** `resource-config.js` (thêm 14 agent entries), `parallel-dispatch.js` (thêm `buildBatchPlan()` tổng quát), `evidence-protocol.js` (thêm outcome types bảo mật), `session-manager.js` (thêm security session functions), `plan-checker.js` (thêm CHECK-08 Security Gate).
- **Không cần:** Static analysis tools (Semgrep/CodeQL), Docker/sandbox, database, SARIF output — 13 agents đã dùng Grep + FastCode MCP, đủ cho scope này.
- **Constraint bất biến:** No Build Step, Node.js 16.7+, CommonJS, backward compatible.

### Từ FEATURES.md

**Bắt buộc cho v4.0 launch (P0):**
- Skill `commands/pd/audit.md` — điểm vào duy nhất, parse flags `--poc`, `--full`, `--only`, `--auto-fix`
- Workflow `workflows/audit.md` — orchestrator 9 bước đầy đủ
- 2 chế độ tự động phát hiện (độc lập vs tích hợp milestone)
- Template scanner `pd-sec-scanner.md` + `config/security-rules.yaml` (thay thế 13 files riêng lẻ)
- Đăng ký 14 agents trong `resource-config.js`
- Smart Scanner Selection (context analysis + mapping tín hiệu)
- Wave-based dispatch + failure isolation
- Function-level evidence checklist (PASS/FLAG/FAIL mỗi hàm)
- `SECURITY_REPORT.md` tổng hợp với OWASP coverage table
- FastCode MCP tool-first integration (discovery trước, AI phân tích sau)

**Nên có cho v4.0 (P1):**
- Session Delta — phân loại NEW / KNOWN-UNFIXED / RE-VERIFY / RESOLVED
- Git diff scope cho RE-SCAN
- POC đơn lẻ (chỉ khi `--poc`)
- Security gate trong `complete-milestone` (non-blocking, chỉ cảnh báo)
- `what-next` priority 0.5 khi có CRITICAL findings

**Defer sang v4.1+ (P2):**
- Gadget Chain POC — VERY HIGH complexity, cần POC đơn lẻ và delta stable trước
- Auto-generate fix phases theo gadget chain order — cần gadget chain analysis stable
- Re-verify phase tự động — cần session delta + fix phases

**Anti-features đã xác nhận không làm:**
- DAST (cần chạy server — ngoài phạm vi AI coding tool)
- AST parser riêng (FastCode MCP đã wrap tree-sitter)
- Auto-fix code trực tiếp (nguy hiểm nếu không qua test)
- Bắt buộc audit sau mỗi phase (quá nghiêm ngặt — chỉ trước `complete-milestone`)

### Từ ARCHITECTURE.md

**Luồng dữ liệu cốt lõi:**

```
pd:audit → workflows/audit.md
  → Context analysis → Smart Scanner Selection (security-rules.yaml)
  → Session setup (.planning/security/S{NNN}-audit-{date}/)
  → Wave dispatch (2 scanners/wave, tối đa 7 waves)
      → Mỗi scanner → evidence_sec_{type}.md
  → [--delta] Session Delta comparison
  → pd-sec-reporter → SECURITY_REPORT.md
  → [--poc] POC Pipeline
  → [--milestone] Fix phase generation
```

**Ranh giới component:**

| Component | Trách nhiệm | Ghi chú |
|-----------|-------------|---------|
| `commands/pd/audit.md` (MỚI) | Skill entry point, parse flags | Pattern giống research.md |
| `workflows/audit.md` (MỚI) | Orchestrator toàn bộ pipeline | Kết hợp write-code.md --parallel + research.md patterns |
| `bin/lib/security-scanner.js` (MỚI) | `selectScanners()`, `buildScanWaves()`, `parseScanEvidence()`, `compareSessions()` | Pure functions |
| `bin/lib/security-reporter.js` (MỚI) | `generateFixPhases()`, `buildGadgetChain()`, `formatSecurityGate()` | Pure functions |
| 13 `pd-sec-*.md` agents (DA CO) | Quét 1 OWASP category, ghi evidence | Không cần tạo mới |
| `pd-sec-reporter.md` (DA CO) | Tổng hợp evidence → SECURITY_REPORT | Không cần tạo mới |

**5 patterns bắt buộc tuân theo:**
1. **Pure Function Library** — không đọc file, không `require('fs')`, content truyền qua tham số
2. **Wave-based Agent Dispatch** — max 2/wave, đợi cả wave hoàn thành trước khi tiếp
3. **Agent Communication via Evidence Files** — scanner ghi riêng, reporter đọc sau (tránh race condition)
4. **Non-blocking Workflow Integration** — security gate cảnh báo nhưng không chặn workflow
5. **YAML Config for Scanner Routing** — không hardcode scanner list trong workflow

### Từ PITFALLS.md

**6 bẫy nghiêm trọng (Critical):**

| # | Bẫy | Phòng ngừa chính |
|---|-----|-----------------|
| 1 | **False Positive Overload** — Regex FP rate 30-70%. 13 scanners × 5-10 findings = 65-130 raw results, 50% là noise | Secondary verification sau Grep (đọc context ±15 dòng), severity filtering trong reporter, whitelist `.pd-security-ignore` |
| 2 | **Token Explosion** — 13 scanners × full codebase = 150K+ tokens. Rate limit risk khi 4 agents song song gọi tools | Smart Scanner Selection PHAI implement trước dispatch — giảm xuống 5-8 scanners thực sự liên quan |
| 3 | **Session Delta Edge Cases** — File rename, partial fix, code move làm file:line identifier không ổn định | Finding ID dựa trên content hash (không phải file:line), function-level anchoring, git-aware rename detection |
| 4 | **POC Safety** — POC hoạt động thật có thể gây hại nếu chạy nhầm; AI-generated POC có thể hallucinate | POC chỉ sinh code, không thực thi. Double opt-in: `--poc --chain`. Redact trong git commits |
| 5 | **Agent Dispatch Reliability** — 13 agents, p(ít nhất 1 fail) ≈ 49% nếu mỗi agent có 5% failure rate | `validateScannerEvidence()` sau mỗi agent, per-scanner retry, critical scanner designation |
| 6 | **Gadget Chain Accuracy** — LLM không có call graph, không có data flow analysis → chain analysis sai | Chain là ADVISORY (không phải finding). Tối đa 3 steps. Confidence = MIN(steps) × length_penalty |

**4 bẫy vừa (Moderate):**
- YAML Config Complexity — validate schema trước khi scanner đọc, fallback về defaults nếu YAML sai
- Evidence File Sprawl — giữ tối đa N=3 sessions, `evidence_sec_*.md` không commit vào git
- Integration Breaking — security gate OPT-IN mặc định, feature flags cho tất cả tích hợp v4.0
- Reporter Coverage Sai — 3 trạng thái: SCANNED / FINDINGS / NOT SCANNED; không bao giờ hiện "10/10" khi có NOT SCANNED

---

## Gợi ý Cấu trúc Roadmap

### 5 Phases được khuyến nghị

```
Phase 1: Foundation (config + libs + registry)
    ↓
Phase 2: Core Audit Workflow (skill + workflow bước 1-3-5)
    ↓
Phase 3: Evidence Parsing + Smart Selection + Function Checklist
    ↓
Phase 4: Advanced (Delta + POC + Fix Phases)
    ↓ (có thể song song với Phase 4)
Phase 5: Workflow Integration (security gate + what-next + state machine)
```

---

#### Phase 1: Foundation — Config, Libs, Registry

**Lý do:** Mọi thứ phụ thuộc vào YAML config và AGENT_REGISTRY — phải có trước tất cả. Smart Scanner Selection là optimization bắt buộc, không thể bake sau.
**Deliverable:** `config/security-rules.yaml`, `bin/lib/security-rules-loader.js`, `bin/lib/security-scanner.js` với `selectScanners()` + `buildScanWaves()` (partial), cập nhật `resource-config.js` với 14 agent entries.
**Features:** B-TS2, B-TS4, C-TS2 (bang ánh xạ tín hiệu).
**Bẫy phải tránh:** Pitfall 7 (YAML complexity — validate schema từ đầu, fallback về defaults), Pitfall 2 (token explosion — Smart Selection là foundation layer, không phải afterthought).
**Research flag:** BO QUA — YAML schema, AGENT_REGISTRY pattern, js-yaml đã rõ từ codebase analysis.

---

#### Phase 2: Core Audit Workflow — Skill + Workflow

**Lý do:** Sau khi có foundation (config + lib + registry), xây skill entry point và orchestrator workflow. Deliverable user-facing đầu tiên có thể test end-to-end.
**Deliverable:** `commands/pd/audit.md`, `workflows/audit.md` với bước 1 (context), 2 (session setup), 3 (wave dispatch), 5 (reporter dispatch), `templates/security-report.md`, 2 chế độ (độc lập + milestone).
**Features:** A-TS1, A-TS2, A-TS3, D-TS1, D-TS2, E-TS2, I-D4.
**Bẫy phải tránh:** Pitfall 5 (agent dispatch reliability — `validateScannerEvidence()` và per-scanner retry PHAI có trong workflow ngay từ đầu), Pitfall 10 (reporter coverage sai — 3 trạng thái SCANNED/FINDINGS/NOT SCANNED).
**Research flag:** BỎ QUA — pattern từ write-code.md --parallel và research.md đã chứng minh đủ.

---

#### Phase 3: Evidence Parsing + Smart Scanner Selection + Function Checklist

**Lý do:** Cần có evidence files thực tế (từ Phase 2) để test parser. Function-level checklist là điểm khác biệt cốt lõi so với SAST tools khác — mỗi hàm đã kiểm tra đều được liệt kê, kể cả PASS.
**Deliverable:** `bin/lib/security-scanner.js` hoàn chỉnh (`parseScanEvidence()`, `buildFunctionChecklist()`), `bin/lib/security-reporter.js` với `formatSecurityGate()`, `bin/lib/scanner-selector.js` với full Smart Scanner Selection logic, false positive filter trong reporter.
**Features:** C-TS1, C-TS2, C-TS3, E-TS1.
**Bẫy phải tránh:** Pitfall 1 (false positive overload — secondary verification + severity filtering + whitelist mechanism PHAI có ở phase này, không defer).
**Research flag:** CO THE cần research phase — Smart Scanner Selection threshold (số tín hiệu relevance đủ để kích hoạt scanner) chưa được test với real projects.

---

#### Phase 4: Advanced — Session Delta, POC, Fix Phases

**Lý do:** Phụ thuộc vào `parseScanEvidence()` từ Phase 3. Nhóm tính năng advanced lại thành 1 phase vì chúng có dependency chain với nhau (delta → POC → fix phases).
**Deliverable:** `bin/lib/security-delta.js` với `compareSessions()` (content hash-based), `bin/lib/security-fix-planner.js`, `bin/lib/security-report-builder.js`, `templates/security-fix-phase.md`, cập nhật `workflows/audit.md` bước 4 (delta), 6 (POC), 7 (milestone). **Không làm G-D2 (Gadget Chain POC)** — defer sang v4.1.
**Features:** F-D1, F-D2, F-D3, G-D1, H-D1, H-D2.
**Bẫy phải tránh:** Pitfall 3 (session delta edge cases — thiết kế finding content hash schema TRƯỚC khi implement delta, sai ở data model = rewrite toàn bộ), Pitfall 4 (POC safety — không bao giờ execute POC, redact trong git), Pitfall 6 (gadget chain accuracy — chain tối đa 3 steps, luôn là ADVISORY).
**Research flag:** CO THE cần research phase — finding content hash schema cần thiết kế cẩn thận để tránh collision và handle edge cases (rename, move, partial fix).

---

#### Phase 5: Workflow Integration — Security Gate + What-Next + State Machine

**Lý do:** Chỉ cần `formatSecurityGate()` từ Phase 3 — độc lập với Phase 4, có thể song song nếu cần. Làm sau cùng khi core stable để tránh integration breaking existing workflows.
**Deliverable:** Cập nhật `workflows/complete-milestone.md` Bước 3.7 (non-blocking security gate), cập nhật `workflows/what-next.md` priority 0.5, cập nhật state machine, CHECK-08 trong `plan-checker.js`.
**Features:** I-D1, I-D2, I-D3, CHECK-08.
**Bẫy phải tránh:** Pitfall 9 (integration breaking — security gate OPT-IN mặc định, feature flags cho tất cả, smoke test `pd:plan` và `pd:complete-milestone` sau khi tích hợp), Pitfall 3 anti-pattern (CANH BAO nhưng không CHAN milestone completion).
**Research flag:** BỎ QUA — non-blocking pattern từ Bước 3.6 (complete-milestone) đã chứng minh, plan-checker extension đã rõ.

---

### Defer sang v4.1

- **G-D2: Gadget Chain POC** — VERY HIGH complexity, cần POC đơn lẻ và delta stable trước
- **H-D3: Re-verify phase tự động** — cần session delta + fix phases stable
- **Evidence retention/archive** — implement khi có đủ data thực tế để calibrate policy N sessions
- **`pd:audit --dry-run`** — nice-to-have, implement khi có users phản hồi về token cost

---

## Đánh giá Độ Tin Cậy

| Lĩnh vực | Độ tin cậy | Ghi chú |
|----------|------------|---------|
| Stack | HIGH | Phân tích trực tiếp codebase v3.0 + npm registry. Quyết định js-yaml xác minh từ nhiều nguồn. |
| Features | HIGH | Nguồn chính từ `4_AUDIT_MILESTONE.md` (design document) + 13 agent files đã có + codebase analysis. OWASP scope từ nguồn chính thức. |
| Architecture | HIGH | 601+ tests chứng minh các patterns. Mọi quyết định kiến trúc có tiền lệ trong codebase hiện tại. |
| Pitfalls | HIGH | Kết hợp codebase analysis (agent failure modes, token cost đo được) + nghiên cứu học thuật 2025-2026 (OWASP FP rate, AI-generated PoC quality). |

### Gaps Cần Chú Ý Trong Planning

1. **Smart Scanner Selection thresholds chưa được test** — "relevance_signals" trong security-rules.yaml chưa được test với real projects. Threshold "< 2 matches → chạy full" có thể cần điều chỉnh. Validate trong Phase 3.
2. **Finding content hash schema chưa được định nghĩa** — PITFALLS.md đề xuất `sha256(vuln_type + normalized_snippet + function_name)` nhưng "normalized" cụ thể nghĩa gì chưa rõ. Thiết kế data model trước Phase 4.
3. **maxTurns per scanner type chưa có data** — đề xuất 10 (simple) / 20 (complex) nhưng chưa có số thực tế. Monitor trong Phase 2 với 2-3 scanners trước khi scale.
4. **Template scanner vs 13 agent files — cần quyết định rõ** — FEATURES.md (B-TS1) đề xuất 1 template thay 13 files. ARCHITECTURE.md liệt kê 13 files "đã có, không cần tạo mới". Hai hướng tiếp cận mâu thuẫn nhau, cần thống nhất trước Phase 2.
5. **Session directory path — cần thống nhất** — ARCHITECTURE.md đề xuất `.planning/security/S{NNN}-audit-{date}/`. PITFALLS.md đề xuất `.planning/security-sessions/` để tránh conflict với existing session pattern. Cần chọn 1 hướng.

---

## Research Flags

| Phase | Flag | Lý do |
|-------|------|-------|
| Phase 1: Foundation | BỎ QUA research | YAML schema, AGENT_REGISTRY pattern, js-yaml — tất cả đã rõ từ codebase |
| Phase 2: Core Audit Workflow | BỎ QUA research | Wave dispatch pattern (write-code.md), agent pipeline (research.md) — đã chứng minh |
| Phase 3: Evidence Parsing + Smart Selection | CO THE research | Smart Scanner Selection relevance thresholds chưa test với real projects |
| Phase 4: Advanced (Delta + POC) | CO THE research | Finding content hash schema, delta comparison edge cases cần thiết kế cẩn thận |
| Phase 5: Workflow Integration | BỎ QUA research | Non-blocking pattern, plan-checker extension — patterns đã rõ |

---

## Nguồn Tổng Hợp

### Nguồn OWASP / Bảo mật (HIGH confidence)
- [OWASP Top 10:2021 — Official](https://owasp.org/Top10/2021/)
- [PoCo: Agentic PoC Exploit Generation (arXiv 2511.02780)](https://arxiv.org/pdf/2511.02780)
- [SonarQube Incremental SAST](https://www.sonarsource.com/solutions/security/sast/)
- [GitLab SAST Documentation](https://docs.gitlab.com/user/application_security/sast/)

### Nguồn Industry / AI Security (MEDIUM confidence)
- [OpenAI Aardvark — Agentic Security Researcher](https://openai.com/index/introducing-aardvark/)
- [AI-Powered SAST Tools 2026 — Aikido](https://www.aikido.dev/blog/top-10-ai-powered-sast-tools-in-2025)
- [AquilaX AI Auto-Remediation](https://aquilax.ai/blog/ai-auto-remediation-security-vulnerabilities)
- [Semgrep AI Agent Trends 2026](https://semgrep.dev/blog/2025/what-a-hackathon-reveals-about-ai-agent-trends-to-expect-2026/)

### Codebase (PRIMARY, HIGH confidence)
- 13 `commands/pd/agents/pd-sec-*.md` + `pd-sec-reporter.md` (đã tồn tại, đã verify)
- `bin/lib/resource-config.js`, `bin/lib/parallel-dispatch.js`, `bin/lib/session-manager.js`, `bin/lib/evidence-protocol.js`
- `workflows/write-code.md` (wave dispatch pattern), `workflows/research.md` (agent pipeline pattern)
- `workflows/complete-milestone.md` (non-blocking pattern, Bước 3.6)
- `.planning/PROJECT.md` + `4_AUDIT_MILESTONE.md` — constraints và design decisions chính

---

*Nghiên cứu tổng hợp: 2026-03-26*
*Synthesizer: gsd-research-synthesizer*
*Sẵn sàng cho roadmap: có*
