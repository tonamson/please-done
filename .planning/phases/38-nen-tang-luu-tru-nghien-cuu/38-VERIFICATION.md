---
phase: 38-nen-tang-luu-tru-nghien-cuu
verified: 2026-03-25T15:22:44Z
status: gaps_found
score: 3/4 must-haves verified
re_verification: false
gaps:
  - truth: "Confidence 3 bac gan o ca cap file (frontmatter) va cap claim (inline)"
    status: partial
    reason: >
      Module ho tro confidence o cap file (frontmatter) day du. Tuy nhien, cap claim
      (inline) khong co structured API — khong co tham so `claims`, khong co parsing
      inline [HIGH]/[MEDIUM]/[LOW] trong parseEntry, khong co validation/enforcement.
      Caller co the truyen body voi inline tags nhung module khong quan li dieu do.
      AUDIT-03 yeu cau "gan o ca cap claim" ngua y module phai support viec gan nay
      mot cach co cau truc, khong chi de nguoi dung tu viet free-form text.
    artifacts:
      - path: "bin/lib/research-store.js"
        issue: >
          createEntry() khong co parameter `claims: [{text, confidence}]`.
          parseEntry() khong extract hoac validate inline claim confidence.
          REQUIRED_FIELDS chi co 5 truong cap file, khong co claim-level schema.
    missing:
      - "claims parameter trong createEntry() de render inline [LEVEL] claim text"
      - "claim parsing trong parseEntry() — extract [{text, confidence}] tu ## Bang chung"
      - "Hoac: document ro rang rang claim-level la caller responsibility (manual body)"
human_verification:
  - test: "Xac nhan rang agent workflow thuc te co the tao file voi inline claim confidence"
    expected: "File co ## Bang chung voi cac dong **[HIGH]** claim text... / **[LOW]** claim text..."
    why_human: "Module khong enforce — chi biet khi agent thuc su dung trong thuc te"
---

# Phase 38: Nen tang Luu tru Nghien cuu — Bao cao Kiem chung

**Phase Goal:** Nguoi dung co noi luu tru research co cau truc phan tach — moi file co metadata chuan, confidence ro rang
**Verified:** 2026-03-25T15:22:44Z
**Status:** gaps_found
**Re-verification:** Khong — lan kiem chung dau tien

---

## Ket qua Tong the: Muc tieu Phan tach Dat Duoc Mot Phan

Module `research-store.js` hoat dong dung voi cau truc thu muc, frontmatter chuan AUDIT-01, va confidence cap file. Tuy nhien, AUDIT-03 + ROADMAP SC3 yeu cau confidence "gan o ca cap claim (inline)" chua duoc module ho tro co cau truc.

---

## Observable Truths (Tu ROADMAP Success Criteria)

| #   | Truth (Success Criteria)                                                                                   | Trang thai | Bang chung                                                          |
| --- | ---------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| 1   | Thu muc internal/ ton tai voi frontmatter day du (agent, created, source: internal, topic, confidence)     | VERIFIED   | Thu muc + .gitkeep ton tai; createEntry() tao dung frontmatter      |
| 2   | Thu muc external/ ton tai voi ten RES-[ID]-[SLUG].md, moi ban la file rieng biet co so tang dan            | VERIFIED   | generateFilename() tao dung format; thu muc external/ ton tai       |
| 3   | Confidence 3 bac (HIGH/MEDIUM/LOW) gan o ca cap file (frontmatter) va cap claim (inline)                  | PARTIAL    | Cap file: OK. Cap claim: khong co API co cau truc, khong enforce    |
| 4   | research-store.js pure function (createEntry, parseEntry) hoat dong dung voi ca 2 loai thu muc             | VERIFIED   | 48/48 tests PASS; khong import fs; roundtrip createEntry+parseEntry OK |

**Diem so:** 3/4 truths verified (SC3 partial)

---

## Kiem tra Artifacts (3 Cap)

### Cap 1: Ton tai

| Artifact                                           | Ton tai | Chi tiet                    |
| -------------------------------------------------- | ------- | --------------------------- |
| `bin/lib/research-store.js`                        | YES     | 234 dong                    |
| `test/smoke-research-store.test.js`                | YES     | 437 dong                    |
| `.planning/research/internal/.gitkeep`             | YES     | File rong, git tracked      |
| `.planning/research/external/.gitkeep`             | YES     | File rong, git tracked      |

### Cap 2: Thuc chat (Khong phai stub)

| Artifact                        | Danh gia | Bang chung                                                                    |
| ------------------------------- | -------- | ----------------------------------------------------------------------------- |
| `bin/lib/research-store.js`     | PASSED   | 8 exports thuc (4 functions, 4 constants); logic validation day du; 234 dong  |
| `test/smoke-research-store.test.js` | PASSED | 48 test cases, 13 describe blocks; coverage da dang (edge cases, errors)     |

Khong co dau hieu stub: khong co TODO/FIXME, khong co `return null`, khong co placeholder.

### Cap 3: Ket noi (Wiring)

| Tu                          | Den                     | Qua                         | Trang thai |
| --------------------------- | ----------------------- | --------------------------- | ---------- |
| `research-store.js`         | `bin/lib/utils.js`      | `require('./utils')`         | WIRED      |
| `research-store.js`         | `parseFrontmatter()`    | destructured import          | WIRED      |
| `research-store.js`         | `buildFrontmatter()`    | destructured import          | WIRED      |
| `smoke-research-store.test.js` | `research-store.js`  | `require('../bin/lib/research-store')` | WIRED |

**Roundtrip test:** `createEntry()` -> `parseEntry()` -> valid=true, khong co errors. PASS.

---

## Data-Flow Trace (Cap 4)

Module la pure function — khong co state, khong render UI, khong co DB queries. Data flow:

| Artifact                | Luong du lieu                                                    | Trang thai  |
| ----------------------- | ---------------------------------------------------------------- | ----------- |
| `createEntry(options)`  | options -> frontmatter build -> content string + filename string | FLOWING     |
| `parseEntry(content)`   | content string -> parseFrontmatter -> validate -> structured obj | FLOWING     |
| `generateFilename(opts)`| source + topic + id -> filename string                           | FLOWING     |
| `validateConfidence(l)` | level string -> boolean                                          | FLOWING     |

Khong co du lieu hardcoded rong ([] hay {}) duoc return cho caller — tat ca output phu thuoc input.

---

## Behavioral Spot-Checks

| Hanh vi                                        | Lenh                                    | Ket qua              | Trang thai |
| ---------------------------------------------- | --------------------------------------- | -------------------- | ---------- |
| 48/48 tests PASS                               | `node --test test/smoke-research-store.test.js` | pass 48, fail 0 | PASS   |
| createEntry tao frontmatter day du             | node inline assertion                   | Dung 5 truong         | PASS       |
| generateFilename external cho RES-[ID]-[SLUG].md | node inline assertion               | "RES-001-react-docs.md" | PASS  |
| Roundtrip createEntry + parseEntry valid=true  | node inline assertion                   | valid=true, 0 errors  | PASS       |
| Khong co require('fs') trong module            | grep                                    | Khong tim thay        | PASS       |
| internal/ va external/ directories ton tai     | ls check                                | Ca 2 ton tai          | PASS       |

---

## Kiem tra Requirements Coverage

| Requirement | Plan khai bao | Mo ta                                                                                                    | Trang thai | Bang chung                                           |
| ----------- | ------------- | -------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------- |
| STORE-01    | 38-01, 38-02  | Thu muc internal/ voi frontmatter source: internal, scope: [project-name], created: ISO-8601             | PARTIAL    | Thu muc OK, source+created+topic OK; `scope` field THIEU |
| STORE-02    | 38-01, 38-02  | Thu muc external/ voi ten RES-[ID]-[SLUG].md, KHONG GHI DE, so tang dan                                 | VERIFIED   | generateFilename() tao dung format, thu muc ton tai  |
| AUDIT-01    | 38-01, 38-02  | Moi file co frontmatter: agent, created, source, topic, confidence                                       | VERIFIED   | REQUIRED_FIELDS = 5 truong nay; createEntry enforce  |
| AUDIT-03    | 38-01, 38-02  | Confidence 3 bac (HIGH/MEDIUM/LOW) gan o ca cap file va cap claim                                        | PARTIAL    | Cap file: OK. Cap claim: khong co structured API     |

### Ghi chu ve STORE-01 va scope

STORE-01 yeu cau `scope: [project-name]` trong frontmatter, nhung:
- AUDIT-01 (requirement chinh cho frontmatter) KHONG yeu cau scope
- ROADMAP SC1 ghi: "(agent, created, source: internal, topic, confidence)" — khong co scope
- Module implement theo AUDIT-01 va ROADMAP SC, khong phai STORE-01 scope detail

Ket luan: scope la chi tiet trong STORE-01 co the conflict voi AUDIT-01. AUDIT-01 la authority. Muc do nghiem trong: WARNING, khong phai blocker.

---

## Anti-Patterns Tim Thay

| File                           | Dong | Pattern                               | Muc do  | Anh huong                          |
| ------------------------------ | ---- | ------------------------------------- | ------- | ---------------------------------- |
| `bin/lib/research-store.js`    | 166  | `body = body \|\| ..._(Chua co bang chung)_...` | INFO | Default body noi "chua co" — dung cho initial entry, khong phai stub |

Khong co TODO/FIXME/HACK. Khong co placeholder. Default body la hop li cho initial entry chua dien day du.

---

## Human Verification Required

### 1. Claim-level confidence trong workflow thuc te

**Test:** Tao 1 research file voi agent thuc te, kiem tra xem ## Bang chung co cac dong `**[HIGH]** claim text` khong
**Expected:** Agent phai tu viet claim voi inline confidence tag — module khong enforce
**Vi sao can nguoi:** Module khong enforce — chi biet khi agent workflow thuc su tao file

---

## Gaps Summary

**1 gap chinh (SC3 / AUDIT-03) — cap claim inline confidence:**

ROADMAP SC3 va AUDIT-03 yeu cau confidence "gan o ca cap file (frontmatter) va cap claim (inline)". Module hien tai ho tro tot cap file. Tuy nhien, o cap claim:
- Khong co tham so `claims: [{text, confidence}]` trong `createEntry()`
- `parseEntry()` khong extract hay validate inline `**[HIGH]**` tags
- Caller co the tu viet inline tags trong `body` parameter, nhung module khong enforce, validate, hay parse dieu nay

Day la partial implementation: co the dat duoc result (file voi inline confidence) nhung chua co API co cau truc de dam bao consistency.

**1 warning nho (STORE-01 scope field):**

STORE-01 noi "scope: [project-name]" nhung AUDIT-01 va ROADMAP SC1 khong yeu cau truong nay. Module implement theo AUDIT-01. Muc uu tien: AUDIT-01 > STORE-01 detail.

---

## Xac nhan Commit Hashes (Tu SUMMARY)

| Commit   | Mo ta                                         | Ton tai |
| -------- | --------------------------------------------- | ------- |
| 679a65f  | feat(38-01): tao cau truc thu muc research   | YES     |
| 3162c83  | feat(38-01): tao research-store.js module     | YES     |
| b47ae04  | test(38-01): them 33 smoke tests              | YES     |
| 7dc6d8b  | feat(38-02): tao module research-store.js     | YES     |
| 6ad982d  | test(38-02): them 48 test cases               | YES     |

Tat ca 5 commits duoc ghi trong SUMMARY deu ton tai trong git log.

---

_Verified: 2026-03-25T15:22:44Z_
_Verifier: Claude (gsd-verifier)_
