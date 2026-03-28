---
phase: 65
slug: skills-config-foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-28
---

# Phase 65 — Chien luoc Kiem chung

> Hop dong kiem chung theo phase de dam bao migration ngon ngu khong gay regression converter.

---

## Ha tang Test

| Thuoc tinh             | Gia tri                                 |
| ---------------------- | --------------------------------------- |
| **Framework**          | Node.js built-in test runner            |
| **Config file**        | Khong can file config rieng             |
| **Lenh chay nhanh**    | node --test test/smoke-snapshot.test.js |
| **Lenh chay day du**   | npm test                                |
| **Thoi gian uoc tinh** | ~45 giay                                |

---

## Tan suat lay mau

- **Sau moi task commit:** Chay grep sweep scope lien quan + smoke-snapshot
- **Sau moi plan wave:** Chay smoke-snapshot + kiem tra count snapshots
- **Truoc verify-work:** Full suite phai xanh
- **Do tre phan hoi toi da:** 60 giay

---

## Ban do Kiem chung theo Task

| Task ID  | Plan | Wave | Requirement | Loai test | Lenh tu dong                                                                                             | File ton tai | Trang thai |
| -------- | ---- | ---- | ----------- | --------- | -------------------------------------------------------------------------------------------------------- | ------------ | ---------- | ------ |
| 65-01-01 | 01   | 1    | TRANS-02    | grep      | rg -n --glob 'CLAUDE.md' '[àáạảãâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]'         | ✅           | ⬜ cho     |
| 65-01-02 | 01   | 1    | TRANS-01    | grep      | rg -n --glob 'commands/pd/\*.md' '[àáạảãâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]' | ✅           | ⬜ cho     |
| 65-02-01 | 02   | 2    | SYNC-01     | script    | node test/generate-snapshots.js && find test/snapshots -type f -name '\*.md'                             | wc -l        | ✅         | ⬜ cho |
| 65-02-02 | 02   | 2    | SYNC-01     | test      | node --test test/smoke-snapshot.test.js                                                                  | ✅           | ⬜ cho     |

_Trang thai: ⬜ cho · ✅ xanh · ❌ do · ⚠ flaky_

---

## Yeu cau Wave 0

Khong co — ha tang snapshot test da san sang.

---

## Kiem chung Thu cong

| Hanh vi                       | Requirement | Ly do thu cong                                   | Huong dan                                             |
| ----------------------------- | ----------- | ------------------------------------------------ | ----------------------------------------------------- |
| Do tu nhien ngon ngu sau dich | TRANS-01/02 | Chat luong cau van khong danh gia tot bang regex | Doc mau 3-5 files dai (plan.md, fix-bug.md, audit.md) |

---

## Ky xac nhan Kiem chung

- [x] Tat ca task co lenh kiem chung tu dong
- [x] Khong co khoang trong 3 task lien tiep khong verify
- [x] Wave 0 khong can bo sung
- [x] Khong dung watch-mode
- [x] Do tre phan hoi < 60s
- [x] nyquist_compliant true

**Phe duyet:** pending
