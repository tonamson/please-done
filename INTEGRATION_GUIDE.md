# Integration Guide

This guide explains how to customize Please Done for your workflow — forking, adding stacks, editing rules, and understanding skill architecture.

## Fork Workflow

To customize Please Done for your own conventions:

1. **Fork the repository**
   ```bash
   gh repo fork tonamson/please-done --clone
   cd please-done
   ```

2. **Edit files** in `commands/pd/rules/` to match your coding conventions

3. **Install from your fork**
   ```bash
   npm install
   node bin/install.js --target claude  # or codex, gemini, opencode, copilot
   ```

4. **Update anytime** — re-run install after editing rules

Every time `/pd:init` runs, your customized rules are automatically copied to `.planning/rules/`.

## Adding a New Stack Rule

To add support for a new framework:

1. **Create a rule file** in `commands/pd/rules/[stack].md`:
   ```markdown
   # [Stack Name] Conventions
   
   ## Code Style
   - [Specific conventions for this stack]
   
   ## Architecture
   - [Project structure patterns]
   
   ## Do / Don't
   - [Stack-specific recommendations]
   ```

2. **Add detection pattern** in `workflows/init.md` Step 4:
   - Find the stack detection section
   - Add a new condition checking for stack-specific files (e.g., `pubspec.yaml` for Flutter, `next.config.*` for NextJS)
   - Set the appropriate rule file to copy

3. **Test detection** — run `/pd:init` in a project using your new stack

## Editing Existing Rules

Rules live in `commands/pd/rules/`:

| Rule File | Detected By | Conventions |
|-----------|-------------|-------------|
| `flutter.md` | `pubspec.yaml` + flutter | Dart, GetX, Dio |
| `nestjs.md` | NestJS modules | TypeScript decorators, DI |
| `nextjs.md` | `next.config.*` | App Router, Server Components |
| `solidity.md` | `.sol` files | OpenZeppelin v5, gas optimization |
| `wordpress.md` | `wp-config.php` | WP standards, sanitization |
| `general.md` | Fallback | Generic conventions |

To customize:
1. Edit the rule file directly
2. Reinstall skills: `node bin/install.js --target [platform]`
3. Rules auto-copy to `.planning/rules/` on next `/pd:init`

## Anchor Patterns

Skills reference rules using anchor patterns:

```markdown
@commands/pd/rules/nextjs.md
```

This syntax tells the AI to load the specified file as context. Anchors work for:
- `@commands/pd/rules/` — Framework-specific conventions
- `@workflows/` — Workflow definitions
- `@references/` — Reference documents (guards, templates)
- `@templates/` — File templates

Resolution: Anchors resolve relative to the Please Done installation directory.

## Cross-References Between Skills

Skills (`commands/pd/*.md`) call workflows (`workflows/*.md`) via the `<execution_context>` block:

```markdown
<execution_context>
@workflows/plan.md (required)
@references/conventions.md (required)
</execution_context>
```

**Architecture:**
- **Skills** = Entry points invoked by users (`/pd:init`, `/pd:plan`)
- **Workflows** = Step-by-step execution logic
- **References** = Guards, checklists, templates
- **Rules** = Framework-specific conventions

**Example flow:**
```
/pd:plan (skill)
  → @workflows/plan.md (workflow)
    → @references/guard-context.md (guard)
    → @commands/pd/rules/nextjs.md (rule)
```

Skills define WHAT to do. Workflows define HOW to do it. Rules define WHAT CONVENTIONS to follow.

## Error Logging System

Please Done includes comprehensive error logging for debugging and monitoring.

### Log Files

- Location: `.planning/logs/agent-errors.jsonl`
- Format: JSONL (JSON Lines)
- Contains: Timestamp, level, phase, step, agent, error message, and context

### Viewing Logs

```bash
# View recent errors
tail -f .planning/logs/agent-errors.jsonl

# Pretty print with jq
tail -n 20 .planning/logs/agent-errors.jsonl | jq '.'

# Filter errors by skill
grep '"agent":"pd:fix-bug"' .planning/logs/agent-errors.jsonl | jq '.'
```

### Log Management

Logs are automatically managed:
- **Rotation**: Files rotate at 10MB, keeping last 10 rotations
- **Directory**: Auto-created on first run
- **Cleanup**: Old entries deleted by age (configurable)
- **Git**: Log files are git-ignored automatically

See `docs/logging.md` for full API documentation and examples.

### Integration with skills

Skills automatically log errors to the system. Error context helps diagnose issues:
- **Critical skills** (fix-bug, plan, write-code, test, audit) log rich context
- **Other skills** log basic error information
- Errors appear in `/pd:what-next` dashboard

### Disabling logging

Logging is on by default and gracefully degrades if the log directory is unavailable. To fully disable, remove write permissions from `.planning/logs/` or set the directory to read-only.

***

See [README.md](README.md) for installation and usage. See [docs/commands/](docs/commands/) for individual command documentation.
