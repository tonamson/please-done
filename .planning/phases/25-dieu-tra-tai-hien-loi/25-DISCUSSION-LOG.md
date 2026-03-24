# Phase 25: Dieu tra & Tai hien Loi - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 25-dieu-tra-tai-hien-loi
**Areas discussed:** Repro test output, Regression depth, Truths parser, Workflow wiring

---

## Repro test output

### Q1: Reproduction test nen xuat ra dang nao?

| Option | Description | Selected |
|--------|-------------|----------|
| File test rieng (Recommended) | Tao file .test.js/.test.dart trong .planning/debug/repro/ — AI co the chay hoac user chay thu cong | ✓ |
| Markdown trong BUG report | Nhung code block test vao BUG_*.md — khong tao file rieng | |
| Ban quyet dinh | Claude chon approach phu hop nhat | |

**User's choice:** File test rieng
**Notes:** None

### Q2: Templates theo stack nao can ho tro?

| Option | Description | Selected |
|--------|-------------|----------|
| NestJS + Flutter + Generic | 3 templates: NestJS spec, Flutter test, va generic fallback | |
| Chi Generic | 1 template chung cho tat ca stacks | ✓ |
| Ban quyet dinh | Claude chon dua tren phan tich | |

**User's choice:** Chi Generic
**Notes:** Don gian hoa, 1 template du dung

---

## Regression depth

### Q3: Call chain depth cho regression analysis?

| Option | Description | Selected |
|--------|-------------|----------|
| 1-2 levels (Recommended) | Chi xem caller truc tiep va caller cua caller — du thong tin, it noise | ✓ |
| 3 levels | Sau hon — chi tiet hon nhung nhieu false positive | |
| Ban quyet dinh | Claude chon dua tren kich thuoc codebase | |

**User's choice:** 1-2 levels
**Notes:** None

### Q4: Maximum files trong bao cao regression?

| Option | Description | Selected |
|--------|-------------|----------|
| 5 files | Gon gang, tap trung vao impact lon nhat | ✓ |
| 10 files | Bao phu rong hon, co the nhieu noise | |
| Ban quyet dinh | Claude chon dua tren context | |

**User's choice:** 5 files
**Notes:** None

---

## Truths parser

### Q5: Truths parser: inline moi module hay tao shared helper?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline (nhu hien tai) | Moi module tu inline regex — don gian, khong circular deps, de test rieng | |
| Shared helper (Recommended) | Tao bin/lib/truths-parser.js rieng — DRY, nhung can can than voi import order | ✓ |
| Ban quyet dinh | Claude chon dua tren dependency analysis | |

**User's choice:** Shared helper
**Notes:** DRY approach, tao truths-parser.js rieng

---

## Workflow wiring

### Q6: Cach tich hop vao workflow fix-bug?

| Option | Description | Selected |
|--------|-------------|----------|
| Sub-steps (Recommended) | Them 5b.1 (repro) va 8a (regression) nhu conditional sub-steps trong buoc hien co | ✓ |
| Buoc moi so | Tao Buoc 5c (repro) va Buoc 8.5 (regression) rieng | |
| Ban quyet dinh | Claude chon approach giu workflow gon nhat | |

**User's choice:** Sub-steps
**Notes:** None

### Q7: Cac buoc moi nen blocking hay non-blocking?

| Option | Description | Selected |
|--------|-------------|----------|
| Non-blocking (Recommended) | Loi chi warning, khong bao gio chan fix-bug workflow | |
| Blocking | Phai thanh cong moi tiep tuc buoc sau | ✓ |

**User's choice:** Blocking
**Notes:** User xac nhan blocking — muon biet ngay neu co van de, khong bo qua. Khac voi research suggestion (non-blocking).

---

## Claude's Discretion

- Function signatures va return types cua 2 module moi
- Regex patterns cu the cho template generation
- Test file naming convention trong `.planning/debug/repro/`
- Error messages va error types khi blocking

## Deferred Ideas

None — discussion stayed within phase scope
