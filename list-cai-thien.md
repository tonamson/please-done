# Danh sách cải thiện please-done so với GSD

> **Ngày cập nhật:** 2026-04-06
> **Baseline:** please-done v4.0.0 vs get-shit-done v1.33.0
> **Mục tiêu:** Nâng cấp please-done lên ngang tầm GSD về chất lượng, tính năng và developer experience

## 🎯 Project Philosophy — Universal AI CLI Support

**"please-done"** là cái tên runtime-agnostic:
- ✅ **pd:** viết tắt của "please-done", KHÔNG phải "project-claude"
- ✅ Hỗ trợ **mọi AI CLI**: Claude Code, OpenCode, Gemini CLI, Codex, Copilot, Cursor, Kimi, MiniMax, v.v.
- ✅ Không thiên vị bất kỳ runtime nào — commands dùng prefix `/pd:` thay vì `/claude:`

**Nguyên tắc cross-runtime:**
1. Commands: `/pd:init`, `/pd:plan` — không đề cập runtime trong tên
2. Instructions: `AGENTS.md` — universal name, không phải `CLAUDE.md`
3. Testing: Phải verified trên ít nhất 3 runtimes trước khi release
4. Tool support: Graceful degradation nếu tool không available

---

## Changelog (cập nhật 2026-04-06)

| Ngày | Items | Thay đổi |
|------|-------|----------|
| 2026-04-06 | C-03, H-05 | Đã kiểm chứng và đánh dấu **COMPLETED** |
| 2026-04-06 | H-01 | Cập nhật trạng thái: đã partial fix với PD_DEBUG logging |
| 2026-04-06 | H-04 | Cập nhật: test đã bao gồm plan-check.js và utils.js |
| 2026-04-06 | L-02 | **GỘP** `gsd:next` vào `pd:what-next`, rename thành `/pd:next`, giữ alias `/pd:what-next` |
| 2026-04-06 | H-07 | **NÂNG CẤP** thành Universal Cross-Runtime Support — đảm bảo hoạt động trên mọi AI CLI (OpenCode, Gemini, Kimi, MiniMax, v.v.), không chỉ Claude |
| 2026-04-06 | M-09 | **XÓA** — Không làm CI/CD Pipeline (không có kế hoạch), giảm estimate từ 123 → 117 giờ |

---

## Mục lục

1. [Critical — Cần fix ngay](#1-critical--cần-fix-ngay)
2. [High Priority — Quan trọng](#2-high-priority--quan-trọng)
3. [Medium Priority — Nên có](#3-medium-priority--nên-có)
4. [Low Priority — Nice to have](#4-low-priority--nice-to-have)
5. [Future — Ý tưởng dài hạn](#5-future--ý-tưởng-dài-hạn)
6. [Completed — Đã fix](#6-completed--đã-fix)

---

## 1. Critical — Cần fix ngay

### C-01: Fix 5 broken references trong commands

**Trạng thái:** ⏳ OPEN — Đã kiểm chứng, vẫn tồn tại

**Vấn đề:** Nhiều command reference đến files/commands không tồn tại.

| Reference sai | File | Fix |
|---------------|------|-----|
| `pd:map-codebase` | CLAUDE.md:106, CLAUDE.md:245 | Tạo `commands/pd/map-codebase.md` hoặc sửa thành `pd:scan` |
| `pd:verify` | CLAUDE.md:170 (workflow 5) | Tạo `commands/pd/verify.md` hoặc sửa thành `pd:test` |
| `pd:fix-bug` cho lint errors | status.md rules | Tạo rule riêng cho lint, không dùng fix-bug |
| `lib/key-file-selector.js` path | pd:onboard process | Fix path: `lib/` vs `bin/lib/` |
| `lib/doc-link-mapper.js` path | pd:onboard process | Fix path: `lib/` vs `bin/lib/` |

**Evidence:**
```bash
$ ls commands/pd/verify.md  # Không tồn tại
$ ls commands/pd/map-codebase.md  # Không tồn tại
$ grep "pd:verify" CLAUDE.md | head -1
# > - **If verification report missing:** Run `/pd:verify` first
```

**Estimate:** 2-3 giờ

---

### C-02: Fix test script không chạy đúng

**Trạng thái:** ⏳ OPEN — Đã kiểm chứng, vẫn tồn tại

**Vấn đề:** `package.json` test script chỉ chạy `test/*.test.js`, bỏ qua:
- `test/smoke/*.test.js` (40 files)
- `test/integration/*.test.js` (7 files)

**Evidence:**
```json
// package.json:34
"test": "node --test 'test/*.test.js'"  // Chỉ chạy root test files
```

**Fix:**
```json
{
  "scripts": {
    "test": "node --test 'test/**/*.test.js'",
    "test:smoke": "node --test 'test/smoke/*.test.js'",
    "test:integration": "node --test 'test/integration/*.test.js'",
    "test:coverage": "c8 --check-coverage --lines 70 node --test 'test/**/*.test.js'"
  }
}
```

**Thêm devDependencies:**
```json
{
  "devDependencies": {
    "c8": "^11.0.0"
  }
}
```

**Estimate:** 1 giờ

---

### C-03: Cleanup 12 `.test-temp-*` directories

**Trạng thái:** ✅ COMPLETED — Đã kiểm chứng, repo đã clean

**Vấn đề:** Test cleanup không hoạt động, 12 temporary directories còn sót lại trong repo root.

**Evidence (2026-04-06):**
```bash
$ find . -name ".test-temp-*" -type d 2>/dev/null
# Không tìm thấy — repo đã clean
```

**Kết luận:** Issue này đã được fix trong các phase gần đây. Không cần hành động thêm.

---

### C-04: Update version badge và CHANGELOG

**Trạng thái:** ⏳ OPEN — Đã kiểm chứng, vẫn tồn tại

**Vấn đề:**
- CHANGELOG.md stuck at 2.8.0, 13 milestones (v3.0–v4.0) không documented

**Evidence:**
```markdown
// CHANGELOG.md:1-2
> **Note:** This changelog is frozen at v2.8.0. For history from v3.0 onward, see [.planning/MILESTONES.md](.planning/MILESTONES.md).
```

**Lưu ý:** README badge đã đúng v4.0.0, chỉ cần fix CHANGELOG.

**Fix:**
1. Unfreeze CHANGELOG.md hoặc auto-generate từ MILESTONES.md
2. Hoặc xóa dòng "frozen at v2.8.0" và thay bằng link đến MILESTONES.md

**Estimate:** 2 giờ

---

## 2. High Priority — Quan trọng

### H-01: Fix bare catch blocks trong JS code

**Trạng thái:** ⚠️ PARTIAL — Đã có PD_DEBUG logging nhưng vẫn cần review

**Vấn đề:** Các `catch {}` blocks trong:
- `bin/plan-check.js:66` — research directory check
- `bin/plan-check.js:76` — config.json severity overrides
- `bin/lib/utils.js:140` — fileHash()
- `bin/lib/utils.js:169` — isWsl()
- `bin/lib/utils.js:200` — detectPlatformSync()

**Evidence (2026-04-06):**
```javascript
// bin/plan-check.js:66-68 — Đã có logging
} catch (err) {
  if (process.env.PD_DEBUG) console.error('[plan-check] research dir read error:', err);
}

// bin/lib/utils.js:140-143 — Đã có logging
catch (err) {
  if (process.env.PD_DEBUG) console.error('[fileHash]', err);
  return null;
}
```

**Kết luận:** Đã được partial fix. Các catch blocks giờ có `PD_DEBUG` logging. Có thể cần thêm `log.warn` cho consistency.

**Estimate:** 30 phút (nếu cần thêm log.warn)

---

### H-02: Refactor `process.exit(1)` trong `claude.js` installer

**Trạng thái:** ⏳ PENDING — Chưa kiểm chứng

**Vấn đề:** `bin/lib/installers/claude.js` có 6 calls `process.exit(1)`, làm:
- Không thể reuse trong non-CLI contexts
- Không thể test properly
- Inconsistent với các installers khác (codex, copilot, gemini, opencode đều throw)

**Fix:** Replace `process.exit(1)` với `throw new Error(...)`, để `bin/install.js` handle exit.

**Estimate:** 1 giờ

---

### H-03: Tạo 4 missing command docs

**Trạng thái:** ⏳ PENDING — Chưa kiểm chứng đầy đủ

**Vấn đề:** 16 commands nhưng chỉ 12 có docs trong `docs/skills/`. Missing:
- `docs/skills/audit.md`
- `docs/skills/conventions.md`
- `docs/skills/onboard.md`
- `docs/skills/status.md`

**Fix:** Tạo 4 files theo format existing docs (objective, usage, examples, error handling).

**Estimate:** 3 giờ

---

### H-04: Expand error-handling test scope

**Trạng thái:** ✅ COMPLETED — Đã kiểm chứng, test đã bao gồm đủ files

**Vấn đề (cũ):** `smoke-error-handling.test.js` chỉ check 3 files, bỏ qua:
- `bin/plan-check.js` (2 bare catches)
- `bin/lib/utils.js` (3 bare catches)

**Evidence (2026-04-06):**
```javascript
// test/smoke-error-handling.test.js:12-18
const TARGET_FILES = [
  'bin/lib/manifest.js',
  'bin/lib/installers/claude.js',
  'bin/lib/installers/gemini.js',
  'bin/plan-check.js',      // ✅ Đã thêm
  'bin/lib/utils.js',       // ✅ Đã thêm
];
```

**Kết luận:** Issue này đã được fix. Cả plan-check.js và utils.js đều đã nằm trong TARGET_FILES.

---

### H-05: Fix Vietnamese commit message rule contradiction

**Trạng thái:** ✅ COMPLETED — Đã kiểm chứng, đã được fix

**Vấn đề (cũ):** `workflows/write-code.md:471` yêu cầu commit bằng Vietnamese, nhưng `references/conventions.md:70` yêu cầu English.

**Evidence (2026-04-06):**
```markdown
// workflows/write-code.md:471 hiện tại nói về wave execution:
1. **Spawn Agent tool** for each task — DO NOT dump the entire PLAN.md...
```

Line 471 hiện tại không liên quan đến commit message. Nội dung đã được refactor.

**Kết luận:** Issue này đã được fix trong các phase gần đây.

---

### H-06: Cleanup orphaned files

**Trạng thái:** ⏳ PENDING — Chưa kiểm chứng đầy đủ

**Vấn đề:** Nhiều files không được reference bởi bất kỳ command/workflow nào:

| File | Action |
|------|--------|
| `workflows/legacy/fix-bug-v1.5.md` | Archive hoặc document fallback |
| `references/mermaid-rules.md` | Wire vào command hoặc remove |
| `de_xuat_cai_tien.md` | Translate sang English hoặc archive |
| `N_FIGMA_TO_HTML_NOTES.md` | Move to `docs/notes/` |
| `INTEGRATION_GUIDE.md` reference | Create file hoặc remove references |

**Estimate:** 2 giờ

---

### H-07: Universal Cross-Runtime Support (Không chỉ Claude)

**Trạng thái:** ⏳ PENDING — Quan trọng cho đa nền tảng

**Vấn đề:** PD hiện tại thiên về Claude Code quá nhiều. Cần đảm bảo **toàn bộ workflow hoạt động trên mọi AI CLI**: OpenCode, Gemini, Kimi, MiniMax, Codex, Copilot, Cursor, v.v.

**Các runtime cần support:**

| Runtime | File Config | Trạng thái PD |
|---------|-------------|---------------|
| **Claude Code** | `CLAUDE.md` | ✅ Full support |
| **OpenCode** | `AGENTS.md` | ⚠️ Partial (th缺少 AGENTS.md) |
| **Gemini CLI** | `GEMINI.md` | ⚠️ Partial (th缺少 GEMINI.md) |
| **Codex** | `.codex/config.toml` | ⚠️ Chỉ copy commands |
| **Copilot** | `.github/copilot-instructions.md` | ⚠️ Chỉ copy commands |
| **Kimi** | Via OpenCode | ❌ Không tested |
| **MiniMax** | Via OpenCode | ❌ Không tested |
| **Cursor** | `.cursorrules` | ❌ Chưa support |
| **Windsurf** | `.windsurf/rules/` | ❌ Chưa support |
| **Cline** | `.clinerules` | ❌ Chưa support |

→ Khi dùng Qwen, MiniMax qua OpenCode → **không đọc được CLAUDE.md** → **không hiểu workflow**.

**Giải pháp 1: AGENTS.md làm source of truth (Universal)**

Đổi `CLAUDE.md` → `AGENTS.md` (universal name), symlink/copy sang các runtime:

```
AGENTS.md (source of truth)
├── CLAUDE.md → symlink
├── GEMINI.md → symlink
├── .cursorrules → copy
├── .clinerules → copy
└── .github/copilot-instructions.md → copy
```

**Giải pháp 2: Script sync tự động**

Tạo `bin/sync-instructions.js`:

```javascript
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(process.cwd(), 'CLAUDE.md');
const TARGETS = [
  { path: 'AGENTS.md', format: 'universal' },
  { path: 'GEMINI.md', format: 'universal' },
  { path: '.cursorrules', format: 'plain' },
  { path: '.clinerules', format: 'plain' },
  { path: '.github/copilot-instructions.md', format: 'universal' },
];

function sync() {
  if (!fs.existsSync(SOURCE)) {
    console.error('CLAUDE.md not found');
    process.exit(1);
  }

  const content = fs.readFileSync(SOURCE, 'utf8');

  for (const target of TARGETS) {
    const fullPath = path.join(process.cwd(), target.path);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content);
    console.log(`✓ Synced to ${target.path}`);
  }
}

sync();
```

**Integration vào package.json:**

```json
{
  "scripts": {
    "sync-instructions": "node bin/sync-instructions.js",
    "postinstall": "npm run sync-instructions"
  }
}
```

**Integration vào installer (`bin/install.js`):**

Thêm bước sync instructions khi install cho runtime mới:

```javascript
// Sau khi copy commands/skills
function syncInstructions(runtime) {
  const source = path.join(projectRoot, 'CLAUDE.md');
  if (!fs.existsSync(source)) return;

  const targets = getRuntimeInstructionTargets(runtime);
  for (const target of targets) {
    fs.copyFileSync(source, path.join(projectRoot, target));
  }
}
```

**Benefit:**
- Mọi AI runtime đều đọc được cùng instructions
- Single source of truth — edit 1 lần, sync everywhere
- Auto-sync khi install/update

**Yêu cầu thêm cho universal support:**

1. **Test trên tất cả runtimes:**
   - OpenCode + Kimi/MiniMax models
   - Gemini CLI (native, không qua OpenCode)
   - Codex CLI (OpenAI)
   - Copilot (GitHub CLI)

2. **Command names phải universal:**
   - ❌ Tránh: `/claude:init`, `/claude-code:plan`
   - ✅ Dùng: `/pd:init`, `/pd:plan` (runtime-agnostic)

3. **Workflow không hardcode Claude-specific:**
   - ❌ Tránh: "Claude will read this file"
   - ✅ Dùng: "AI will read this file" hoặc "The agent will"

4. **Tool constraints:**
   - Mỗi runtime có tool support khác nhau
   - Cần graceful degradation nếu tool không available
   - Ví dụ: Không phải runtime nào cũng có `Agent` tool

**Estimate:** 4-6 giờ (bao gồm testing đa nền tảng)

---

## 3. Medium Priority — Nên có

### M-01: Thêm Wave Execution (parallel plans)

**Trạng thái:** ⏳ PENDING

**GSD có:** Execute-phase chạy plans trong waves — independent plans chạy parallel, dependent plans chạy sequential.

**please-done hiện tại:** Không có wave execution, plans chạy sequential.

**Implementation:**
1. Thêm dependency analysis trong PLAN.md
2. Group plans vào waves dựa trên dependencies
3. Spawn parallel agents cho independent plans
4. Sequential execution cho dependent plans

**Benefit:** Tốc độ execution nhanh hơn 2-3x cho phases lớn.

**Estimate:** 8-12 giờ

---

### M-02: Thêm nhiều runtime support

**Trạng thái:** ⏳ PENDING

**GSD hỗ trợ 12 runtimes:** Claude, OpenCode, Gemini, Kilo, Codex, Copilot, Cursor, Windsurf, Antigravity, Augment, Trae, Cline

**please-done hiện tại:** 5 runtimes (Claude, Codex, Gemini, OpenCode, Copilot)

**Missing runtimes cần thêm:**
1. **Cursor** — popular AI IDE
2. **Windsurf** — Codeium-based
3. **Cline** — VS Code extension
4. **Trae** — ByteDance IDE
5. **Augment** — AI coding assistant
6. **Kilo** — OpenCode fork
7. **Antigravity** — Google Gemini-based

**Implementation:** Tạo installer + converter cho mỗi runtime (theo pattern existing installers).

**Estimate:** 16-24 giờ (2-3 giờ per runtime)

---

### M-03: Thêm TypeScript SDK cho headless execution

**Trạng thái:** ⏳ PENDING

**GSD có:** `@gsd-build/sdk` với `gsd-sdk init` và `gsd-sdk auto` CLI cho autonomous execution.

**Benefit:**
- CI/CD integration
- Headless autonomous execution
- Programmatic API cho custom workflows

**Implementation:**
1. Tạo `sdk/` directory
2. Port core logic sang TypeScript
3. Build CLI với `gsd-sdk` command
4. Publish lên npm

**Estimate:** 24-40 giờ

---

### M-04: Thêm Git Branching Strategies

**Trạng thái:** ⏳ PENDING

**GSD có:** 3 strategies — `none`, `phase`, `milestone`

**Implementation:**
```json
{
  "git": {
    "branching_strategy": "phase",
    "phase_branch_template": "pd/phase-{phase}-{slug}",
    "milestone_branch_template": "pd/{milestone}-{slug}"
  }
}
```

**Benefit:** Clean git history, easy code review, isolated feature branches.

**Estimate:** 6-8 giờ

---

### M-05: Thêm Context Window Monitoring

**Trạng thái:** ⏳ PENDING

**GSD có:** Hook cảnh báo khi context usage vượt threshold (WARNING/CRITICAL).

**Implementation:**
1. Tạo `hooks/context-monitor.js`
2. Track token usage per agent
3. Advisory warnings khi >70% context used
4. Critical alert khi >90%

**Benefit:** Prevents context overflow, maintains output quality.

**Estimate:** 4-6 giờ

---

### M-06: Thêm Developer Profiling

**Trạng thái:** ⏳ PENDING

**GSD có:** `/gsd:profile-user` analyzes session history để build behavioral profile (8 dimensions).

**Implementation cho please-done:**
1. Tạo `pd:profile-user` command
2. Analyze git commit history + planning patterns
3. Generate `USER-PROFILE.md` với preferences
4. Inject vào agent prompts

**Benefit:** Personalized responses, better decision suggestions.

**Estimate:** 8-12 giờ

---

### M-07: Thêm Verification Debt Tracking

**Trạng thái:** ⏳ PENDING

**GSD có:** Cross-phase UAT audit, tracks pending/skipped/blocked verification items.

**Implementation:**
1. Thêm `status: partial` và `result: blocked` trong UAT files
2. `pd:audit-uat` command để scan outstanding items
3. `HUMAN-UAT.md` files cho items cần human verification
4. Surface verification debt trong `pd:progress`

**Benefit:** Không bỏ sót verification items khi project advances.

**Estimate:** 6-8 giờ

---

### M-08: Thêm Ship Command (auto PR creation)

**Trạng thái:** ⏳ PENDING

**GSD có:** `/gsd:ship` — auto PR creation từ verified phase work.

**Implementation:**
1. Tạo `pd:ship` command
2. Generate PR body từ planning artifacts
3. Push branch, create PR via `gh`
4. Update STATE.md

**Benefit:** One-command PR creation, consistent PR bodies.

**Estimate:** 4-6 giờ

---

### M-09: Thêm Quick Mode với composable flags

**Trạng thái:** ⏳ PENDING

**GSD có:** `/gsd:quick` với `--discuss`, `--research`, `--validate`, `--full` flags.

**Implementation cho please-done:**
```bash
pd:quick "add dark mode" --discuss --research
pd:quick "fix typo"  # minimal path
pd:quick "refactor auth" --validate
```

**Benefit:** Faster path cho ad-hoc tasks không cần full planning.

**Estimate:** 4-6 giờ

---

## 4. Low Priority — Nice to have

### L-01: Automated version badge sync

**Implementation:** `npm version` hook tự động update badge trong README.md.

**Estimate:** 1 giờ

---

### L-02: Gộp `gsd:next` vào `pd:what-next` với alias

**GSD có:** `/gsd:next` — tự động detect state và run next step.

**PD hiện tại:** `/pd:what-next` — chỉ suggest, không auto-run.

**Quyết định:** Gộp thành một command, rename thành `/pd:next` (ngắn gọn), giữ `/pd:what-next` làm alias.

**Behavior sau khi update:**
```bash
# /pd:next (tên chính thức mới)
/pd:next           # Suggest + hỏi "Run now? [Y/n]"
/pd:next --auto    # Auto-run luôn

# /pd:what-next (alias, backward compatible)
/pd:what-next      # Redirect sang /pd:next
```

**Research liên quan:**
- Phase 91: status-workflow-integration (`.planning/milestones/v11.2-phases/91-status-workflow-integration/`)
  - State machine integration với what-next suggestions
  - Auto-refresh pattern từ dashboard-renderer.js
- Phase 100: README Quick Start (`.planning/milestones/v11.2-phases/100/`)
  - what-next là 1 trong 16 skills được document
  - Categorized as Utility skill

**Implementation:**
1. Rename `commands/pd/what-next.md` → `commands/pd/next.md`
2. Update `commands/pd/what-next.md` → redirect alias sang `/pd:next`
3. Thêm `--auto` flag để auto-run

**Estimate:** 2-3 giờ (đơn giản vì đã có what-next, chỉ cần refactor + thêm auto-run)

---

### L-03: Thêm `pd:stats` command

**GSD có:** `/gsd:stats` — project statistics dashboard.

**Implementation:** Display phases, plans, requirements, git metrics, timeline.

**Estimate:** 3-4 giờ

---

### L-04: Thêm `pd:health` command

**GSD có:** `/gsd:health [--repair]` — validate `.planning/` directory integrity.

**Implementation:** Check STATE.md, ROADMAP.md consistency, auto-repair với `--repair`.

**Estimate:** 3-4 giờ

---

### L-05: MCP Tool Discovery

**Trạng thái:** ⏳ PENDING

**GSD có:** Subagents tự động discover và sử dụng MCP tools.

**PD hiện tại:** MCP tools được config thủ công trong `.claude/settings.json`.

**Implementation:**
1. Tạo `hooks/mcp-discovery.js`
2. Scan `.claude/settings.json` hoặc `.mcp/` directory
3. Auto-inject available tools vào agent prompts
4. Cache discovery results

**Benefit:** AI biết nên dùng tool nào mà không cần manual config.

**Estimate:** 4-6 giờ

---

### L-06: Discussion Audit Trail

**Trạng thái:** ⏳ PENDING

**GSD có:** Auto-generated `DISCUSSION-LOG.md` trong discuss-phase.

**PD hiện tại:** Không có audit trail cho discuss phase.

**Implementation:**
1. Auto-generate `DISCUSSION-LOG.md` khi chạy `/pd:plan --discuss`
2. Log các quyết định architecture, trade-offs
3. Link từ `PLAN.md` → `DISCUSSION-LOG.md`
4. Template: decision, rationale, alternatives, date

**Benefit:** Traceability cho decisions, easy to review later, onboarding context.

**Estimate:** 2-3 giờ

---

### L-07: Scope Reduction Detection

**Trạng thái:** ⏳ PENDING

**GSD có:** Planner bị block nếu silently drop requirements.

**PD hiện tại:** `plan-check` chỉ check task completeness, không check requirement coverage.

**Implementation:**
1. Parse REQUIREMENTS.md → extract requirement IDs
2. Parse PLAN.md → extract covered requirements
3. Cross-reference: REQUIREMENTS - COVERED = MISSING
4. Block planner nếu coverage < 100%
5. Warning nếu 90-99%, Pass nếu 100%

**Benefit:** Prevent silently dropping requirements, đảm bảo đầy đủ scope.

**Estimate:** 3-4 giờ

---

### L-08: Schema Drift Detection

**Trạng thái:** ⏳ PENDING

**GSD có:** Detect ORM schema changes missing migrations.

**PD hiện tại:** Không có detection cho database schema changes.

**Implementation:**
1. Support: Prisma, TypeORM, Sequelize, Drizzle
2. Compare: `schema.prisma` vs `migration` files
3. Detect: Entities added/removed/renamed without migrations
4. Warning trong `pd:test` nếu drift detected
5. Block verification cho DB-related tasks

**Benefit:** Prevent false-positive verification khi schema thay đổi nhưng chưa migration.

**Estimate:** 4-6 giờ

---

## 5. Future — Ý tưởng dài hạn

### F-01: Community Building

- Tạo Discord server
- Twitter/X account cho project
- Contribution guidelines rõ ràng
- Issue/PR templates

### F-02: Documentation Site

- Migration từ markdown docs sang documentation site (VitePress, Docusaurus)
- Interactive examples
- Video tutorials

### F-03: Plugin System

- Allow community-contributed commands
- Plugin marketplace
- Custom workflow definitions

### F-04: Multi-Agent Orchestration Enhancement

- Parallel researchers (4 agents như GSD)
- Agent skill injection
- Adaptive context enrichment cho 1M+ token models

### F-05: Workstreams

- Parallel milestone work với namespacing
- Switch giữa workstreams
- Merge workstreams khi complete

### F-06: UI Design Pipeline

- `pd:ui-phase` — generate UI-SPEC.md
- `pd:ui-review` — 6-pillar visual audit
- Figma integration

### F-07: Node Repair Operator

- Autonomous recovery khi task verification fails
- RETRY / DECOMPOSE / PRUNE strategies
- Configurable repair budget

### F-08: Response Language Config

- `response_language` setting cho cross-phase language consistency
- Support Vietnamese responses natively

---

## 6. Completed — Đã fix

| Mã | Vấn đề | Ngày fix | Notes |
|----|--------|----------|-------|
| **C-03** | Cleanup `.test-temp-*` directories | 2026-04-06 | Repo đã clean, không còn temp directories |
| **H-04** | Expand error-handling test scope | 2026-04-06 | Test đã bao gồm plan-check.js và utils.js |
| **H-05** | Vietnamese commit message contradiction | 2026-04-06 | workflows/write-code.md đã refactor, line 471 giờ nói về wave execution |

---

## Priority Matrix (Cập nhật 2026-04-06)

| Priority | Count | Total Estimate | Timeline |
|----------|-------|----------------|----------|
| **Critical** | 3 | ~5 giờ | Tuần 1 |
| **High** | 5 | ~10 giờ | Tuần 2-3 |
| **Medium** | 9 | ~75 giờ | Tháng 1-2 |
| **Low** | 8 | ~26 giờ | Tháng 2-3 |
| **Future** | 8 | TBD | Q2 2026+ |
| **Completed** | 3 | - | ✅ |

**Total estimated effort:** ~117 giờ cho Critical + High + Medium + Low

### Chi tiết các items mới/cập nhật:
| Item | Thay đổi | Estimate mới |
|------|----------|--------------|
| **H-07** | Nâng cấp thành Universal Cross-Runtime Support, thêm testing đa nền tảng | 4-6 giờ (từ 3-4 giờ) |
| **M-09** | Đã xóa — không làm CI/CD Pipeline | - |

---

## Unique advantages của please-done (giữ nguyên)

Những thứ please-done làm tốt hơn GSD — **không nên thay đổi**:

1. **OSINT Security Suite** — 13 parallel scanners (Google Dorks, CT logs, subdomain enumeration) — GSD không có
2. **Model-tier routing** — opus/sonnet/haiku per command — cost optimization
3. **Zero runtime dependencies** — simple install, small attack surface
4. **PDF Report Generation** — enterprise reporting capability
5. **Goal-backward reasoning** — Truth/Artifact/Key-Links verification system
6. **Bilingual docs (EN/VI)** — phục vụ developer Việt Nam

---

## Next Steps (Cập nhật)

1. **Tuần này:** Fix C-01 đến C-04 (giảm từ 4 xuống 3 issues)
2. **Tuần sau:** Fix H-01 (partial), H-02, H-03, H-06, H-07 (giảm từ 7 xuống 5 issues)
3. **Tháng sau:** Implement M-01 (Wave Execution) — impact cao nhất
4. **Q2 2026:** Expand runtime support (M-02), CI/CD (M-09), SDK (M-03)
