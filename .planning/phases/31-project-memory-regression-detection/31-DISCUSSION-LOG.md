# Phase 31: Project Memory & Regression Detection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 31-project-memory-regression-detection
**Areas discussed:** Bug Record Format, Keyword Matching, Regression Alert UX, Bug Lifecycle

---

## Bug Record Format

### Q1: Moi bug file nen chua nhung thong tin gi?

| Option | Description | Selected |
|--------|-------------|----------|
| Toi thieu (Recommended) | YAML frontmatter: file, function, error_message, session_id, resolved_date. Body: 1-2 dong. Du cho keyword matching, khong bloat. | ✓ |
| Day du context | Nhu tren + stack trace snippet, related_files list, fix_commit hash, tags[]. Giau hon nhung nang hon. | |
| Claude quyet dinh | Claude tu chon muc chi tiet phu hop. | |

**User's choice:** Toi thieu (Recommended)
**Notes:** Khong can

### Q2: Ten file bug nen theo format nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Session-linked (Recommended) | BUG-{NNN}.md theo thu tu tang dan. YAML frontmatter chua session_id lien ket ve session goc. | ✓ |
| Slug-based | BUG-{NNN}-{slug}.md. De doc hon khi browse thu muc nhung slug co the dai. | |
| Claude quyet dinh | Claude chon format phu hop voi naming convention cua project. | |

**User's choice:** Session-linked (Recommended)
**Notes:** Khong can

### Q3: Module nao chiu trach nhiem tao/cap nhat bug records?

| Option | Description | Selected |
|--------|-------------|----------|
| Module moi: bug-memory.js (Recommended) | Pure function module rieng: createBugRecord(), searchBugs(), buildIndex(). Tach biet concern. | ✓ |
| Mo rong session-manager.js | Them functions vao session-manager.js. It file hon nhung session-manager se phinh. | |
| Claude quyet dinh | Claude chon dua tren kich thuoc va complexity. | |

**User's choice:** Module moi: bug-memory.js (Recommended)
**Notes:** Khong can

---

## Keyword Matching

### Q1: Janitor tim bug tuong tu bang cach nao?

| Option | Description | Selected |
|--------|-------------|----------|
| 3-field scoring (Recommended) | So khop 3 truong: file path, function name, error message. Moi truong khop = 1 diem. Score >= 2/3 = regression alert. | ✓ |
| Weighted scoring | Nhu tren nhung co trong so: error_message (0.5) > file (0.3) > function (0.2). Linh hoat hon nhung phuc tap hon. | |
| Claude quyet dinh | Claude chon strategy phu hop. | |

**User's choice:** 3-field scoring (Recommended)
**Notes:** Khong can

### Q2: Ket qua tim bug tuong tu duoc ghi o dau?

| Option | Description | Selected |
|--------|-------------|----------|
| Trong evidence_janitor.md (Recommended) | Janitor ghi section 'Bug tuong tu' vao evidence file cua minh. Nhat quan voi luong hien tai. | ✓ |
| File rieng: similar_bugs.md | Tao file rieng trong session dir. Sach hon nhung them 1 file. | |
| Claude quyet dinh | Claude chon dua tren evidence chain hien tai. | |

**User's choice:** Trong evidence_janitor.md (Recommended)
**Notes:** Khong can

### Q3: Keyword matching la exact hay substring/case-insensitive?

| Option | Description | Selected |
|--------|-------------|----------|
| Case-insensitive substring (Recommended) | file: includes(), function: exact (case-insensitive), error: substring (case-insensitive). Thuc te hon. | ✓ |
| Exact match | 3 truong phai khop chinh xac. Strict hon, it false positive nhung co the miss regression that. | |
| Claude quyet dinh | Claude chon strategy phu hop cho tung field. | |

**User's choice:** Case-insensitive substring (Recommended)
**Notes:** Khong can

---

## Regression Alert UX

### Q1: Khi phat hien regression, orchestrator hien thi the nao cho user?

| Option | Description | Selected |
|--------|-------------|----------|
| Warning banner + chi tiet (Recommended) | In warning ro rang, non-blocking. Architect thay trong evidence. | |
| AskUserQuestion confirm | Dung lai hoi user. Blocking nhung user kiem soat hon. | |
| Claude quyet dinh | Claude chon UX phu hop voi flow hien tai. | ✓ |

**User's choice:** "Hay tu quyet dinh phuong an tot nhat cho repo di"
**Notes:** User tin tuong Claude tu quyet dinh UX regression alert

### Q2: Architect double-check: kiem tra fix moi khong pha fix cu bang cach nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Bug records trong prompt (Recommended) | Gan danh sach related bugs vao prompt. Architect tu danh gia. Nhe. | |
| Auto-run regression tests | Tu dong chay lai test cua cac fix cu lien quan. Chac chan hon nhung phuc tap. | |
| Claude quyet dinh | Claude chon approach phu hop. | ✓ |

**User's choice:** Claude quyet dinh
**Notes:** Khong can

---

## Bug Lifecycle

### Q1: Bug record duoc tao khi nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Sau fix commit (Recommended) | Khi orchestrator commit [LOI] thanh cong, tu dong tao BUG-{NNN}.md. | |
| Sau verify pass | Chi tao bug record khi user xac nhan fix thanh cong. Chac chan hon. | ✓ |
| Claude quyet dinh | Claude chon timing phu hop. | |

**User's choice:** Sau verify pass
**Notes:** Dam bao chi ghi bug that su da duoc fix thanh cong

### Q2: INDEX.md cap nhat nhu the nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Tu dong rebuild (Recommended) | Moi khi tao/cap nhat bug record, buildIndex() generate lai toan bo INDEX.md. Luon dong bo. | ✓ |
| Incremental append | Chi them dong moi vao INDEX.md. Nhanh hon nhung co the mat dong bo. | |
| Claude quyet dinh | Claude chon approach phu hop. | |

**User's choice:** Tu dong rebuild (Recommended)
**Notes:** Khong can

### Q3: Bug records da resolved xu ly the nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Giu nguyen (Recommended) | Bug files vinh vien trong .planning/bugs/. Khong archive, khong xoa. INDEX.md phan biet resolved/active. | ✓ |
| Archive sau 30 ngay | Move bugs resolved > 30 ngay sang archive/. Giu thu muc gon nhung Janitor can scan ca archive. | |
| Claude quyet dinh | Claude chon dua tren so luong bugs du kien. | |

**User's choice:** Giu nguyen (Recommended)
**Notes:** Khong can

---

## Claude's Discretion

- Regression alert UX: blocking vs non-blocking, format hien thi (D-07)
- Architect double-check approach: prompt-based vs test-based (D-08)
- Unit test structure cho bug-memory.js
- Error handling khi .planning/bugs/ chua ton tai

## Deferred Ideas

- Agent memory cross-session (MEM-05) — v2.2
- AI-powered bug similarity scoring — Out of Scope
- Auto-fix tu lich su bug — Out of Scope
