# Phase 29: Evidence Protocol & Session Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 29-evidence-protocol-session-management
**Areas discussed:** Session structure, Evidence format, Evidence chain, Resume UI flow

---

## Session Structure

### To chuc session

| Option | Description | Selected |
|--------|-------------|----------|
| Folder per session | .planning/debug/S001-ten-loi/ chua tat ca evidence files | ✓ |
| Index file + flat | Giu evidence flat, them SESSION-INDEX.md tracking | |
| Ban quyet | Claude chon | |

**User's choice:** Folder per session
**Notes:** Moi session co folder rieng, isolation hoan toan

### Session ID format

| Option | Description | Selected |
|--------|-------------|----------|
| S001 + slug | So tang dan + slug tu mo ta loi | ✓ |
| Timestamp-based | 20260324-153000-slug | |
| Ban quyet | Claude chon | |

**User's choice:** S001 + slug

### SESSION.md metadata

| Option | Description | Selected |
|--------|-------------|----------|
| Day du | ID, mo ta, status, created, updated, outcome, evidence trail | ✓ |
| Toi gian | Chi ID, mo ta, trang thai | |
| Ban quyet | Claude chon | |

**User's choice:** Day du (voi YAML frontmatter + Markdown body)

### Session management module

| Option | Description | Selected |
|--------|-------------|----------|
| Pure JS module | bin/lib/session-manager.js — createSession, listSessions, getSession, updateSession | ✓ |
| Workflow logic | Ghi truc tiep trong workflow markdown | |
| Ban quyet | Claude chon | |

**User's choice:** Pure JS module

---

## Evidence Format

### Structured header

| Option | Description | Selected |
|--------|-------------|----------|
| Frontmatter + MD | YAML frontmatter (agent, outcome, timestamp, session) + Markdown body | ✓ |
| Chi Markdown | Thuan Markdown sections, khong frontmatter | |
| Ban quyet | Claude chon | |

**User's choice:** Frontmatter + MD

### Elimination Log format

| Option | Description | Selected |
|--------|-------------|----------|
| Table | Bang Markdown: File/Logic, Ket qua, Ghi chu | ✓ |
| Checklist | Checklist Markdown don gian | |
| Ban quyet | Claude chon | |

**User's choice:** Table

### Evidence validation module

| Option | Description | Selected |
|--------|-------------|----------|
| Module rieng | bin/lib/evidence-protocol.js — validateEvidence, parseEvidence, OUTCOME_TYPES | ✓ |
| Gop vao session-manager | Mot module xu ly ca session va evidence | |
| Ban quyet | Claude chon | |

**User's choice:** Module rieng

### CHECKPOINT REACHED sections

| Option | Description | Selected |
|--------|-------------|----------|
| Tien do + Cau hoi + Context | 3 sections: tien do dieu tra, cau hoi cho user, context cho agent tiep | ✓ |
| Chi Cau hoi | Toi gian: chi cau hoi cho user | |
| Ban quyet | Claude chon | |

**User's choice:** Tien do + Cau hoi + Context

---

## Evidence Chain

### Truyen path cho agents

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt injection | Orchestrator truyen session dir qua prompt khi spawn agent | ✓ |
| Sua agent files | Update agent files dung bien $SESSION_DIR | |
| Ban quyet | Claude chon | |

**User's choice:** Prompt injection

### Cap nhat agent files

| Option | Description | Selected |
|--------|-------------|----------|
| Cap nhat luon | Sua 5 agent files bo hardcode paths trong Phase 29 | ✓ |
| De Phase 32 | Giu nguyen, sua khi viet orchestrator | |
| Ban quyet | Claude chon | |

**User's choice:** Cap nhat luon trong Phase 29

### Evidence chain validation

| Option | Description | Selected |
|--------|-------------|----------|
| Validation nhe | evidence-protocol.js validateEvidence(), non-blocking warnings | ✓ |
| Khong can validation | Tin tuong agents ghi dung format | |
| Ban quyet | Claude chon | |

**User's choice:** Validation nhe (non-blocking)

---

## Resume UI Flow

### Hien thi sessions

| Option | Description | Selected |
|--------|-------------|----------|
| AskUserQuestion menu | Menu voi danh sach active/paused + "Tao phien moi" | ✓ |
| Text list + so | In text, user nhap so | |
| Ban quyet | Claude chon | |

**User's choice:** AskUserQuestion menu

### Resume behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Doc SESSION.md + evidence cuoi | Route theo outcome cuoi cung (root_cause/checkpoint/inconclusive/null) | ✓ |
| Restart tu Janitor | Luon chay lai Janitor khi resume | |
| Ban quyet | Claude chon | |

**User's choice:** Doc SESSION.md + evidence cuoi

### Resolved sessions

| Option | Description | Selected |
|--------|-------------|----------|
| Chi active/paused | Resolved khong hien trong Resume UI | ✓ |
| Hien tat ca | Hien ca resolved sessions | |
| Ban quyet | Claude chon | |

**User's choice:** Chi active/paused

---

## Claude's Discretion

- maxTurns cho session-manager va evidence-protocol
- Error message format khi validation fail
- Unit test structure cho 2 modules moi
- Slug generation algorithm

## Deferred Ideas

- ROOT CAUSE choices — Phase 30
- CHECKPOINT flow va Continuation Agent — Phase 30
- Bug history recall — Phase 31
- Orchestrator workflow loop — Phase 32
