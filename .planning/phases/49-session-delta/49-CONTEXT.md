# Phase 49: Session Delta - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Thay stub B2 trong workflow audit bang logic delta-aware: doc evidence phien cu, so sanh git diff, phan loai tung ham (SKIP / RE-SCAN / NEW / KNOWN-UNFIXED), va ghi audit history append-only vao evidence file. Audit lan sau chi quet lai nhung gi thay doi, tiet kiem token va thoi gian.

</domain>

<decisions>
## Implementation Decisions

### Phan loai delta (classification logic)
- **D-01:** Ham FLAG (nghi ngo) + code KHONG doi → KNOWN-UNFIXED (skip). Giu ket qua cu trong bao cao, khong quet lai
- **D-02:** Ham PASS + code DA DOI (git diff) → RE-SCAN. Day la yeu cau chinh cua DELTA-02
- **D-03:** Ham MOI (co trong code hien tai nhung khong co trong evidence cu) → NEW (scan). Chua duoc kiem tra bao mat lan nao
- **D-04:** Ham PASS + code KHONG doi → SKIP. An toan, bo qua hoan toan
- **D-05:** Ham FAIL + code KHONG doi → KNOWN-UNFIXED. Van loi, ghi trong bao cao nhung khong quet lai
- **D-06:** Ham SKIP (khong lien quan category) + code KHONG doi → giu SKIP

### Git diff scope
- **D-07:** Moc so sanh: commit SHA cua phien audit cuoi cung. Luu commit SHA vao evidence file khi audit. Lan sau diff tu SHA do den HEAD
- **D-08:** Granularity: file-level. `git diff --name-only {old_sha}..HEAD` → danh sach files doi. Neu file doi, TAT CA ham trong file do duoc RE-SCAN
- **D-09:** Khong co evidence cu (lan dau hoac bi xoa) → treat nhu full scan. Moi ham la NEW

### Audit history format
- **D-10:** Append section `## Audit History` cuoi moi evidence_sec_*.md. Moi phien them 1 dong vao table
- **D-11:** 4 cot: Date (ISO) | Commit (7-char SHA) | Verdict (PASS/FLAG/FAIL count) | Delta (N new, M re-scan, K skip)
- **D-12:** Parse bang regex markdown table — nhat quan voi cach parse evidence hien tai

### Module architecture
- **D-13:** Tao file moi `bin/lib/session-delta.js` — pure function, khong doc file, khong require('fs'). Nhat quan voi smart-selection.js (Phase 48)
- **D-14:** Function chinh: `classifyDelta(oldEvidence, changedFiles)` — nhan noi dung evidence cu (string) + danh sach files doi (string[]). Tra ve `{ functions: Map<name, {status, reason}>, summary: {skip, rescan, new, knownUnfixed} }`
- **D-15:** Workflow B2 (caller) chiu trach nhiem: doc evidence file, chay `git diff --name-only`, truyen vao classifyDelta()

### Claude's Discretion
- Thiet ke API bo sung ngoai classifyDelta: appendAuditHistory(), parseAuditHistory(), hoac cac helper khac — researcher va planner quyet dinh dua tren requirements
- Chi tiet regex patterns de parse function checklist va audit history table
- Cach luu commit SHA vao evidence (frontmatter hay section rieng)
- Logic xu ly edge cases: file bi rename, file bi xoa, merge conflicts

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflow stub (extension point)
- `workflows/audit.md` §B2 — Stub "Delta-aware" hien tai, can thay bang logic thuc

### Evidence format
- `commands/pd/agents/pd-sec-scanner.md` — Template scanner, output evidence_sec_*.md voi Function Checklist
- `commands/pd/agents/pd-sec-reporter.md` — Reporter doc evidence bang Glob

### Existing modules
- `bin/lib/session-delta.js` — TBD (file moi se tao)
- `bin/lib/smart-selection.js` — Pattern tham khao: pure function, constants, export structure
- `bin/lib/evidence-protocol.js` — parseFrontmatter, validateEvidence — co the tai dung cho parse evidence cu
- `bin/lib/parallel-dispatch.js` — buildScannerPlan, evidence_sec_* naming convention (line 135)

### Prior phase contexts
- `.planning/phases/47-luong-audit-cot-loi/47-CONTEXT.md` — D-05 (B2 stub), D-06 (output format), D-09 (dispatch pattern)
- `.planning/phases/48-evidence-smart-selection/48-CONTEXT.md` — D-07/D-08 (function checklist format), D-12 (reporter merge)

### Requirements
- `.planning/REQUIREMENTS.md` — DELTA-01, DELTA-02, DELTA-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `smart-selection.js`: Pattern tham khao cho pure function module moi — constants, JSDoc, export structure
- `evidence-protocol.js`: parseFrontmatter() co the dung de parse evidence cu lay metadata (commit SHA, date)
- `parallel-dispatch.js` line 135: naming convention `evidence_sec_${cat}.md` — session-delta can biet pattern nay de tim evidence cu

### Established Patterns
- Pure function pattern: tat ca modules trong bin/lib/ khong doc file, khong require('fs'), content truyen qua tham so
- Markdown table parse: regex pipe-delimited table da dung trong nhieu modules
- YAML frontmatter: evidence files co frontmatter voi metadata — co the them commit_sha vao day

### Integration Points
- B2 stub trong `workflows/audit.md` → thay bang goi classifyDelta() + appendAuditHistory()
- Evidence files (evidence_sec_*.md) → input cho classifyDelta (doc noi dung cu) va output cho appendAuditHistory (ghi history moi)
- Git CLI → workflow caller chay `git diff --name-only` va `git rev-parse HEAD` truoc khi goi pure functions

</code_context>

<specifics>
## Specific Ideas

- Token saving la muc tieu chinh — SKIP cang nhieu ham cang tot khi code khong doi
- File-level granularity don gian va dang tin cay hon function-level diff parsing
- Commit SHA la moc chinh xac nhat, khong phu thuoc timestamp hay tags
- Audit history table giup developer theo doi xu huong bao mat qua thoi gian ma khong can doc het evidence

</specifics>

<deferred>
## Deferred Ideas

- Function-level diff granularity (chi scan ham bi sua, khong phai ca file) — co the nang cap sau neu file-level qua rong
- Git tag tu dong (pd-audit-*) sau moi audit — huu ich nhung tao nhieu tags
- --re-verify-all flag de scan lai tat ca FLAG cu mac du code khong doi — edge case, co the them sau
- Delta-aware cho reporter (chi update phan thay doi trong SECURITY_REPORT.md) — scope Phase 49 chi la scanner delta

</deferred>

---

*Phase: 49-session-delta*
*Context gathered: 2026-03-26*
