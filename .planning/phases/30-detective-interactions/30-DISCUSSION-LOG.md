# Phase 30: Detective Interactions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 30-detective-interactions
**Areas discussed:** ROOT CAUSE Choices, CHECKPOINT Flow, Continuation Agent, Parallel Dispatch

---

## ROOT CAUSE Choices

### Q1: Khi user chon 'Sua ngay', orchestrator nen lam gi?

| Option | Description | Selected |
|--------|-------------|----------|
| Orchestrator tu sua | Doc evidence_architect.md, truc tiep sua code + chay test + commit [LOI]. Tai su dung logic v1.5. | ✓ |
| Spawn Fix Architect sua | Spawn pd-fix-architect voi instruction 'sua code'. Ton them 1 agent spawn. | |
| Ban quyet dinh | Claude chon cach toi uu nhat. | |

**User's choice:** Orchestrator tu sua (Khuyen nghi)
**Notes:** Nhanh nhat, it token nhat, tai su dung logic v1.5 co san.

### Q2: Khi user chon 'Len ke hoach', output la gi?

| Option | Description | Selected |
|--------|-------------|----------|
| Ghi FIX-PLAN.md vao session | Tao FIX-PLAN.md trong session dir: root cause, files can sua, test can viet, risk. | ✓ |
| Hien ke hoach trong chat | In ke hoach ra console, khong luu file. | |
| Ban quyet dinh | Claude chon format phu hop. | |

**User's choice:** Ghi FIX-PLAN.md vao session (Khuyen nghi)
**Notes:** User co the xem + sua tay truoc khi chay.

### Q3: Khi user chon 'Tu sua', orchestrator nen lam gi?

| Option | Description | Selected |
|--------|-------------|----------|
| Pause session + huong dan | Cap nhat SESSION.md status=paused, hien root cause summary + files can xem. | ✓ |
| Ket thuc session luon | Mark session resolved, khong cho user. | |

**User's choice:** Pause session + huong dan (Khuyen nghi)
**Notes:** User tu sua, sau do chay lai pd:fix-bug de verify.

---

## CHECKPOINT Flow

### Q4: Orchestrator hien cau hoi cho user bang cach nao?

| Option | Description | Selected |
|--------|-------------|----------|
| AskUserQuestion menu | Hien cau hoi tu evidence + cac lua chon goi y. Nhat quan voi UX please-done. | ✓ |
| Plain text prompt | In cau hoi ra console, user go tu do. | |

**User's choice:** AskUserQuestion menu (Khuyen nghi)

### Q5: Truyen cau tra loi cua user cho agent tiep theo qua dau?

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt injection | Gan cau tra loi vao prompt khi spawn Continuation Agent. | ✓ |
| Ghi vao evidence file | Ghi cau tra loi vao checkpoint_response.md trong session dir. | |
| Ca hai | Ghi vao file de luu tru, dong thoi inject vao prompt. | |

**User's choice:** Prompt injection (Khuyen nghi)

### Q6: Agent tiep theo nhan bao nhieu context tu session?

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence cuoi + cau tra loi | Chi evidence file cua agent gui checkpoint + cau tra loi user. Tiet kiem token. | ✓ |
| Toan bo evidence chain | Doc tat ca evidence files trong session. Day du nhung ton nhieu token. | |

**User's choice:** Evidence cuoi + cau tra loi (Khuyen nghi)

---

## Continuation Agent

### Q7: Spawn cung loai agent hay orchestrator tu quyet dinh?

| Option | Description | Selected |
|--------|-------------|----------|
| Cung loai agent | Agent checkpoint → spawn lai chinh agent do voi context moi. | ✓ |
| Orchestrator chon loai tiep theo | Phan tich noi dung checkpoint de quyet dinh spawn agent nao. | |
| Ban quyet dinh | Claude chon logic toi uu. | |

**User's choice:** Cung loai agent (Khuyen nghi)

### Q8: Gioi han bao nhieu vong continuation truoc khi escalate?

| Option | Description | Selected |
|--------|-------------|----------|
| Toi da 2 vong | Sau 2 lan continuation ma van checkpoint → escalate. | ✓ |
| Toi da 3 vong | Cho nhieu co hoi hon truoc khi escalate. | |
| Khong gioi han | Cho den khi user dung hoac root cause. | |

**User's choice:** Toi da 2 vong (Khuyen nghi)

---

## Parallel Dispatch

### Q9: Neu 1 agent fail thi xu ly the nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Tiep tuc voi agent con lai | 1 fail khong block workflow. Ghi warning vao SESSION.md. | ✓ |
| Retry agent fail 1 lan | Thu lai agent fail 1 lan. Neu van fail → tiep tuc. | |
| Cho ca hai bat buoc | Khong tiep tuc neu thieu evidence. | |

**User's choice:** Tiep tuc voi agent con lai (Khuyen nghi)

### Q10: Merge evidence tu 2 agent song song nhu the nao?

| Option | Description | Selected |
|--------|-------------|----------|
| Giu tach rieng | evidence_code.md va evidence_docs.md la 2 files rieng. Repro + Architect doc ca 2. | ✓ |
| Tao evidence_merged.md | Merge ket qua 2 agent vao 1 file tong hop. | |

**User's choice:** Giu tach rieng (Khuyen nghi)

---

## Claude's Discretion

- Module structure cho outcome-router logic
- Unit test cases cu the
- Error messages khi escalate
- FIX-PLAN.md template format

## Deferred Ideas

- Orchestrator workflow loop tong the — Phase 32
- Loop-back khi INCONCLUSIVE — Phase 33
- Single-agent fallback mode — Phase 33
- Bug history recall — Phase 31
- Progressive disclosure — Phase 32
