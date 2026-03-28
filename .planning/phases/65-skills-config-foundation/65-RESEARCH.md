# Phase 65: Skills + Config Foundation - Research

**Researched:** 2026-03-28
**Domain:** Skills translation, snapshot synchronization, converter regression safety
**Confidence:** HIGH

## Summary

Phase 65 can duoc trien khai theo huong migration language-only: dich 14 skill files trong commands/pd va cap nhat CLAUDE.md, sau do regenerate snapshots va chay smoke snapshot tests.

Codebase da co day du infrastructure de lam viec nay an toan:

- Snapshot generator da doc toan bo skills tu commands/pd thong qua listSkillFiles.
- Snapshot smoke test da compare output cua 4 converters voi baseline snapshots.
- Noi dung can thay doi la van ban huong dan; khong can can thiep vao converter logic.

Khuyen nghi chinh: tach thanh 2 plans theo roadmap (translation -> synchronization), va trong moi task phai co read_first + acceptance_criteria cu the de tranh shallow execution.

## User Constraints (from CONTEXT)

### Locked Decisions

- D-01..D-03: Scope chi gom 14 skills + CLAUDE.md, khong mo rong sang workflows/rules/references, khong doi ten file/duong dan/structure.
- D-04..D-05: Translation theo 2 batch (7 nho -> 7 lon) va cap nhat CLAUDE.md trong batch dau.
- D-06..D-07: Standardize English terminology, giu nguyen command names/placeholders.
- D-08..D-10: Bat buoc gate verify: grep zero Vietnamese, regenerate 56 snapshots, smoke-snapshot pass.

### Deferred

None.

## Phase Requirements

| ID       | Description                                     | Research Support                                                |
| -------- | ----------------------------------------------- | --------------------------------------------------------------- |
| TRANS-01 | Translate 14 skill files to English             | File inventory da xac dinh day du trong commands/pd/\*.md       |
| TRANS-02 | Update CLAUDE.md language convention            | CLAUDE.md la file don, tac dong truc tiep                       |
| SYNC-01  | Regenerate 56 snapshots after skill translation | test/generate-snapshots.js + smoke-snapshot.test.js da san sang |

## Architecture Patterns

### Source of truth and generation flow

- skills source: commands/pd/\*.md
- generator: test/generate-snapshots.js
- converter paths: bin/lib/converters/{codex,copilot,gemini,opencode}.js
- snapshot assertions: test/smoke-snapshot.test.js

### Observed constants

- so luong skills hien tai: 14 files trong commands/pd
- so luong platforms trong generator: 4
- expected snapshot count: 56

### Safe migration pattern

1. Dich text trong skills + CLAUDE.md, giu nguyen markers/cau truc.
2. Chay grep ky tu tieng Viet de chan sot.
3. Regenerate snapshots.
4. Chay smoke snapshot tests de chan regression converter output.

## Don't Hand-Roll

| Problem               | Don’t build                  | Use instead                             | Why                                         |
| --------------------- | ---------------------------- | --------------------------------------- | ------------------------------------------- |
| Snapshot diff logic   | Custom compare scripts       | test/smoke-snapshot.test.js             | Da co assertion on output by platform/skill |
| Skill inventory       | Hardcoded skill list moi noi | listSkillFiles() trong bin/lib/utils.js | Tranh mismatch khi them/bot skill file      |
| Translation QA parser | Custom parser moi            | grep + existing snapshot tests          | Nhanh, ro, dung voi requirement phase       |

## Common Pitfalls

### Pitfall 1: Doi marker XML/placeholders trong luc dich

- What goes wrong: parser/converter output khac han mong doi.
- Avoid: giu nguyen tags (<objective>, <process>, ...), placeholders ($ARGUMENTS, @path).

### Pitfall 2: Doi ten file skill

- What goes wrong: snapshot path mismatch vi skill.name thay doi.
- Avoid: khong doi ten file, chi sua noi dung.

### Pitfall 3: Dem snapshot sai

- What goes wrong: khong kiem tra tong 56 file nen bo sot platform/skill.
- Avoid: always run find test/snapshots -type f -name '\*.md' | wc -l

### Pitfall 4: Dung grep pattern qua hep

- What goes wrong: con sot Vietnamese nhung khong bi phat hien.
- Avoid: dung regex ky tu co dau tieng Viet tren dung scope phase.

## Environment Availability

| Dependency                       | Required by                 | Available | Fallback         |
| -------------------------------- | --------------------------- | --------- | ---------------- |
| Node.js                          | snapshot generation + tests | Yes       | —                |
| ripgrep (rg)                     | Vietnamese sweep            | Yes       | grep -E fallback |
| converters in bin/lib/converters | snapshot generation         | Yes       | —                |

## Validation Architecture

### Test Framework

| Property           | Value                                   |
| ------------------ | --------------------------------------- |
| Framework          | Node.js built-in test runner            |
| Quick run command  | node --test test/smoke-snapshot.test.js |
| Full suite command | npm test                                |
| Estimated runtime  | ~20-45 seconds                          |

### Requirement to verification map

| Req ID   | Behavior                                 | Test Type     | Automated Command                                                                                        |
| -------- | ---------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| TRANS-01 | 14 skills translated, no Vietnamese text | grep sweep    | rg -n --glob 'commands/pd/\*.md' '[àáạảãâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]' |
| TRANS-02 | CLAUDE.md language convention updated    | grep sweep    | rg -n --glob 'CLAUDE.md' '[àáạảãâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]'         |
| SYNC-01  | 56 snapshots regenerated and consistent  | script + test | node test/generate-snapshots.js && find test/snapshots -type f -name '\*.md'                             | wc -l && node --test test/smoke-snapshot.test.js |

### Wave 0 requirements

None — test infrastructure da co san.

## Sources

### Primary

- .planning/phases/65-skills-config-foundation/65-CONTEXT.md
- .planning/ROADMAP.md (section Phase 65)
- .planning/REQUIREMENTS.md
- CLAUDE.md
- commands/pd/\*.md
- test/generate-snapshots.js
- test/smoke-snapshot.test.js
- bin/lib/utils.js

## Metadata

Research date: 2026-03-28
Valid until: 2026-04-28
