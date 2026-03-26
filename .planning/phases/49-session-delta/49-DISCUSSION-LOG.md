# Phase 49: Session Delta - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 49-session-delta
**Areas discussed:** Phan loai delta, Git diff scope, Audit history format, Module architecture

---

## Phan loai delta

| Option | Description | Selected |
|--------|-------------|----------|
| KNOWN-UNFIXED (skip) | Giu nguyen ket qua FLAG cu, khong quet lai — tiet kiem token toi da | ✓ |
| RE-VERIFY (scan lai) | Quet lai mac du code khong doi — phong truong hop scanner phien truoc bi sot | |
| Configurable | Mac dinh KNOWN-UNFIXED, cho phep --re-verify-all flag | |

**User's choice:** KNOWN-UNFIXED (skip)
**Notes:** Ap dung cho ham FLAG + code khong doi

| Option | Description | Selected |
|--------|-------------|----------|
| RE-SCAN | Code doi = can quet lai. Yeu cau DELTA-02 | ✓ |
| RE-SCAN chi khi diff cham function body | Phan tich git diff chi tiet hon | |

**User's choice:** RE-SCAN
**Notes:** Ap dung cho ham PASS + code da doi

| Option | Description | Selected |
|--------|-------------|----------|
| NEW (scan) | Ham moi = chua duoc kiem tra bao mat lan nao, phai quet | ✓ |
| SKIP neu khong thuoc category | Chi scan ham moi neu lien quan den category dang quet | |

**User's choice:** NEW (scan)
**Notes:** Ham moi xuat hien trong code nhung khong co trong evidence cu

| Option | Description | Selected |
|--------|-------------|----------|
| PASS→SKIP, FAIL→KNOWN-UNFIXED | PASS khong doi = bo qua, FAIL khong doi = van loi | ✓ |
| Tat ca SKIP | Bat ke PASS hay FAIL, code khong doi = khong xem lai | |

**User's choice:** PASS→SKIP, FAIL→KNOWN-UNFIXED
**Notes:** Logic phan biet ro giua ham an toan va ham van con loi

---

## Git diff scope

| Option | Description | Selected |
|--------|-------------|----------|
| Commit cua phien audit cuoi | Luu commit SHA vao evidence, diff tu SHA do den HEAD | ✓ |
| Tag tu dong (pd-audit-*) | Tao git tag sau moi audit, diff tu tag gan nhat | |
| Timestamp trong evidence | Dung git log --since voi ISO date | |

**User's choice:** Commit cua phien audit cuoi
**Notes:** Chinh xac nhat, khong phu thuoc timestamp

| Option | Description | Selected |
|--------|-------------|----------|
| File-level | git diff --name-only → danh sach files doi | ✓ |
| Function-level | Phan tich diff line ranges → xac dinh ham nao bi sua | |

**User's choice:** File-level
**Notes:** Don gian, dang tin cay

| Option | Description | Selected |
|--------|-------------|----------|
| Full scan | Khong co evidence cu = treat nhu full scan | ✓ |
| Hoi user chon | Thong bao khong tim thay evidence cu, hoi user | |

**User's choice:** Full scan
**Notes:** An toan nhat khi khong co evidence cu

---

## Audit history format

| Option | Description | Selected |
|--------|-------------|----------|
| Cuoi evidence file | Append section ## Audit History cuoi moi evidence_sec_*.md | ✓ |
| File rieng audit-history.md | Tat ca categories ghi chung vao 1 file | |

**User's choice:** Cuoi evidence file
**Notes:** Tat ca trong 1 file, de tra cuu

| Option | Description | Selected |
|--------|-------------|----------|
| Date + Commit + Verdict + Delta | 4 cot: ISO date, commit SHA, verdict summary, delta summary | ✓ |
| Date + Verdict + Notes | 3 cot don gian hon | |
| Ban quyet | Claude chon cot phu hop nhat | |

**User's choice:** Date + Commit + Verdict + Delta
**Notes:** 4 cot day du

| Option | Description | Selected |
|--------|-------------|----------|
| Regex markdown table | Parse section ## Audit History bang regex | ✓ |
| Frontmatter array | Luu history nhu YAML array trong frontmatter | |

**User's choice:** Regex markdown table
**Notes:** Nhat quan voi cach parse evidence hien tai

---

## Module architecture

| Option | Description | Selected |
|--------|-------------|----------|
| session-delta.js moi | Tao bin/lib/session-delta.js — pure function rieng biet | ✓ |
| Mo rong evidence-protocol.js | Them delta functions vao file hien co | |

**User's choice:** session-delta.js moi
**Notes:** Nhat quan voi smart-selection.js (Phase 48)

| Option | Description | Selected |
|--------|-------------|----------|
| classifyDelta(oldEvidence, changedFiles) | Nhan evidence cu (string) + files doi (string[]) | ✓ |
| classifyDelta(oldEvidence, gitDiff) | Nhan evidence cu + raw git diff output | |

**User's choice:** classifyDelta(oldEvidence, changedFiles)
**Notes:** Testability cao hon, workflow caller parse git diff

| Option | Description | Selected |
|--------|-------------|----------|
| appendAuditHistory + parseAuditHistory | 2 ham bo sung | |
| Ban quyet | Claude thiet ke API phu hop | ✓ |

**User's choice:** Ban quyet
**Notes:** Claude quyet dinh API bo sung dua tren requirements

---

## Claude's Discretion

- API bo sung ngoai classifyDelta (appendAuditHistory, parseAuditHistory, helpers)
- Chi tiet regex patterns cho function checklist va audit history
- Cach luu commit SHA vao evidence
- Edge cases: file rename, file xoa, merge conflicts

## Deferred Ideas

- Function-level diff granularity
- Git tag tu dong (pd-audit-*)
- --re-verify-all flag
- Delta-aware cho reporter
