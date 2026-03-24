# Pitfalls Research

**Domain:** Chuyen doi don-agent fix-bug workflow (419 dong) sang da-agent Detective Orchestrator, tich hop 5 agent chuyen biet vao he thong co san voi 601 tests, 48 converter snapshots, va 5 platform targets
**Researched:** 2026-03-24
**Confidence:** HIGH (dua tren tai lieu chinh thuc Claude Code subagents, nghien cuu multi-agent failures, va phan tich sau ma nguon hien tai)

## Critical Pitfalls

### Pitfall 1: Context Window Bung No Khi Subagent Tra Ket Qua Ve Parent — "Evidence Flood"

**What goes wrong:**
Thiet ke hien tai co 5 agent (Janitor, Detective, DocSpec, Repro, Architect) deu ghi file `evidence_*.md` roi Architect doc tat ca. Nhung trong thuc te, khi subagent hoan thanh, ket qua tra ve main conversation. Theo tai lieu chinh thuc Claude Code: "Running many subagents that each return detailed results can consume significant context." Voi 5 agent, moi agent tra ve 500-2000 token ket qua, main conversation (dang chay Sonnet voi context window nho hon Opus) se bi:
- Token window day 50-70% chi tu evidence cua cac agent — con lai khong du cho buoc Fix + Commit
- Thong tin tu agent dau tien bi "quen" khi doc ket qua agent thu 5 (context rot)
- Orchestrator phai re-read evidence files vi context da bi compact — ton them token

Nghien cuu tu GitHub Blog xac nhan: "agents close issues others just opened or ship changes that fail downstream checks" khi state khong duoc quan ly chat.

**Why it happens:**
Subagents trong Claude Code tra ket qua ve parent session — day la behavior mac dinh, KHONG the tat. Khi spawn 5 subagent tuan tu, moi lan tra ve them ~1000 token vao main context. Fix-bug hien tai da chiem ~419 dong workflow + context7 refs + rules + SESSION file + BUG report = co the da o 40-50% context truoc khi bat ky agent nao chay.

**How to avoid:**
1. **Gioi han so luong subagent dong thoi: TOI DA 2.** Tai lieu thiet ke da ghi "Toi da 2 Sub-agents chay song song" — day la gia tri CUNG, khong duoc vuot.
2. **Moi subagent CHI tra ve summary ngan (< 200 token), ghi chi tiet vao file.** Dung pattern "Isolate high-volume operations" tu tai lieu Claude Code chinh thuc: verbose output o trong subagent context, chi summary ngan tra ve parent.
3. **Architect agent doc evidence files truc tiep, KHONG phu thuoc vao summary tra ve main.** Architect la foreground agent cuoi cung, doc tu `.planning/debug/evidence_*.md` — giong nhu da thiet ke.
4. **Dung `background: true` cho Janitor va DocSpec** de giam ap luc len main conversation. Theo tai lieu: background subagents chay dong thoi trong khi main tiep tuc.
5. **Dat `maxTurns` cho moi agent** de ngan agent chay qua lau va tieu hao qua nhieu token:
   - Janitor (scout): maxTurns 5
   - DocSpec (scout): maxTurns 5
   - Detective (builder): maxTurns 10
   - Repro (builder): maxTurns 8
   - Architect (architect): maxTurns 12

**Warning signs:**
- Main conversation bi auto-compact giua cac buoc workflow
- Agent cuoi cung (Architect) khong nho ket qua cua Agent dau tien (Janitor)
- Token usage tren 1 fix-bug session vuot 50K tokens (vs. ~15-20K hien tai)
- Subagent tra ve wall-of-text thay vi summary ngan

**Phase to address:**
Phase 1 (Dynamic Resource Orchestration) — dinh nghia maxTurns, background mode, va summary protocol TRUOC khi implement bat ky agent nao.

---

### Pitfall 2: Subagent Khong The Spawn Subagent — "No Nesting" Constraint Pha Vo Thiet Ke Orchestrator

**What goes wrong:**
Tai lieu Claude Code chinh thuc ghi RO: "Subagents cannot spawn other subagents." Thiet ke hien tai co Fix Architect la subagent (tier: architect) dieu phoi cac agent khac. Nhung neu Architect la subagent cua pd:fix-bug, no KHONG THE spawn Detective, Repro, DocSpec — vi day la nesting 2 cap.

Neu khong xu ly, se gap 1 trong 2 loi:
- Architect goi Agent tool → bi tu choi vi la subagent
- Workflow phai fallback ve single-agent → mat hoan toan loi the da-agent

**Why it happens:**
Claude Code thiet ke subagents nhu worker, KHONG phai nhu orchestrator. Pattern "hub-and-spoke" chi hoat dong khi HUB la main conversation (hoac agent chay voi `--agent` flag), KHONG phai subagent.

**How to avoid:**
1. **pd:fix-bug MAIN CONVERSATION la orchestrator, KHONG phai Architect agent.** Workflow `fix-bug.md` dieu khien luong spawning — no quyet dinh khi nao spawn Janitor, khi nao spawn Detective+DocSpec song song, khi nao spawn Architect. Architect chi la agent cuoi cung tong hop evidence va de xuat fix, KHONG phai dieu phoi vien.
2. **Dung `--agent` flag NEU muon agent lam orchestrator.** Tai lieu Claude Code ho tro: `claude --agent coordinator` de main thread chay nhu agent co system prompt rieng. Nhung cach nay thay doi hoan toan UX cua pd:fix-bug — can can nhac ky.
3. **Thay the nesting bang "chain subagents from main conversation."** Tai lieu chinh thuc khuyen: dung main conversation de chain, khong dung subagent de chain.
4. **Alternative: Giu workflow fix-bug.md lam orchestrator script, moi buoc spawn 1 subagent.** Day la pattern tu nhien nhat, khop voi cau truc hien tai:
   - Buoc 1: Spawn Janitor → nhan summary
   - Buoc 2: Spawn Detective + DocSpec song song → doi ket qua
   - Buoc 3: Spawn Repro → nhan test result
   - Buoc 4: Spawn Architect → nhan fix plan
   - Buoc 5: Main thuc hien fix theo plan

**Warning signs:**
- Architect agent co `tools: Agent(...)` trong frontmatter — day la dau hieu sai thiet ke vi subagent khong the spawn subagent
- Bat ky agent nao co nhu cau spawn agent khac → sai kien truc
- Test case cho Architect gia dinh no co the goi Agent tool

**Phase to address:**
Phase 1 (Dynamic Resource Orchestration) — quyet dinh kien truc orchestration TRUOC KHI viet bat ky code nao. Day la quyet dinh kien truc quan trong nhat cua v2.1.

---

### Pitfall 3: Race Condition Ghi File Evidence — Nhieu Agent Ghi Cung Luc Vao `.planning/debug/`

**What goes wrong:**
Thiet ke spawn Detective + DocSpec song song. Ca hai deu ghi file vao `.planning/debug/`:
- Detective ghi `evidence_code.md`
- DocSpec ghi `evidence_docs.md`

Tuy la file khac nhau, nhung con co cac truong hop nguy hiem:
- Ca hai doc SESSION file cung luc, 1 agent ghi truoc lam content cua agent kia bi stale
- Janitor chua ghi xong `evidence_janitor.md` khi Detective da bat dau doc — nhan file trong hoac chua day du
- Background agent hoan thanh SAU khi main da chuyen sang buoc tiep theo — file evidence chua co khi can

Nghien cuu DoltHub cho thay: "Without proper concurrency management, many agents would overwrite each other's changes causing unrecoverable chaos." Va bug tu OpenClaw: "Session memory markdown not flushed before commands execute."

**Why it happens:**
File-based persistence (markdown files) KHONG co locking mechanism. Node.js `fs.writeFileSync` ghi atomically tren 1 process, nhung 2 subagent la 2 process rieng biet. Them nua, Claude Code subagent chay trong "own context window" — khong co shared memory hay event bus giua chung.

**How to avoid:**
1. **MOI AGENT GHI FILE RIENG, KHONG BAO GIO 2 AGENT GHI CUNG 1 FILE.** Naming convention:
   - `evidence_janitor.md` — chi Janitor ghi
   - `evidence_code.md` — chi Detective ghi
   - `evidence_docs.md` — chi DocSpec ghi
   - `evidence_repro.md` — chi Repro ghi
   - `evidence_architect.md` — chi Architect ghi
   - `SESSION_*.md` — chi main workflow ghi/cap nhat, agent KHONG ghi
2. **Dam bao thu tu phu thuoc qua sequential spawning:**
   - TRUOC TIEN: Spawn Janitor → doi HOAN THANH → kiem tra `evidence_janitor.md` ton tai
   - SAU DO: Spawn Detective + DocSpec song song (ca hai doc `evidence_janitor.md` — file nay da dong, khong bi ghi nua)
   - SAU DO: Spawn Repro (doc `evidence_code.md` va `evidence_janitor.md`)
   - CUOI: Spawn Architect (doc tat ca evidence files)
3. **Them kiem tra file ton tai truoc khi doc.** Moi agent dau tien kiem tra file input co ton tai va khong rong:
   ```
   Glob .planning/debug/evidence_janitor.md → khong ton tai → ABORT voi message ro rang
   Read → content rong → ABORT voi message ro rang
   ```
4. **Main workflow DOI xac nhan tu foreground subagent TRUOC KHI spawn subagent tiep theo.** Khong spawn Repro khi Detective chua tra ve.

**Warning signs:**
- Agent bao "khong tim thay evidence file" du agent truoc da chay
- Evidence file co noi dung khong day du (ngat giua chung)
- Architect tong hop thieu 1-2 nguon evidence
- 2 agent ghi output vao cung 1 file (vi du ca 2 sua SESSION_*.md)

**Phase to address:**
Phase 2 (Detective Protocols) — dinh nghia Evidence Format va file ownership rules. Phase 1 dinh nghia spawning order.

---

### Pitfall 4: Backward Compatibility Pha Vo — v1.5 Pure Functions Bi Thay The Thay Vi Wrap

**What goes wrong:**
v1.5 da ship 5 pure function modules (repro-test-generator, regression-analyzer, debug-cleanup, logic-sync, truths-parser) voi 75 tests. v2.1 thiet ke lai workflow de spawn agents thay vi goi truc tiep cac module nay. Rui ro:
- Agent `pd-repro-engineer` tao test bang cach khac voi `generateReproTest()` — hai output format khac nhau
- Agent `pd-code-detective` dung FastCode khac cach voi `analyzeFromCallChain()` — regression analysis bi mat
- Logic sync (detectLogicChanges, updateReportDiagram, suggestClaudeRules) bi bo qua vi khong agent nao chiu trach nhiem
- 601 tests van pass nhung workflow thuc te KHONG dung cac module da test → code chet

Dac biet: Buoc 5b.1 (repro test), Buoc 8a (regression analysis), Buoc 9a (debug cleanup + security), Buoc 10a (logic sync) — 4 buoc nay la BLOCKING/NON-BLOCKING integrations da duoc verify. Neu v2.1 bypass chung, cac tinh nang nay mat tac dung.

**Why it happens:**
Khi chuyen sang multi-agent, dev co xu huong viet lai logic trong agent prompts thay vi wrap modules co san. Agent prompt noi "tim root cause" — nhung khong goi `analyzeFromCallChain()`. Agent prompt noi "tao repro test" — nhung khong goi `generateReproTest()`. Ket qua: logic bi duplicate, khong nhat quan, va module cu bi bo roi.

**How to avoid:**
1. **Agents PHAI goi v1.5 pure functions, KHONG duoc viet lai logic.** Cu the:
   - `pd-repro-engineer` PHAI goi `generateReproTest()` tu `bin/lib/repro-test-generator.js`
   - `pd-code-detective` PHAI goi `analyzeFromCallChain()` hoac `analyzeFromSourceFiles()` tu `bin/lib/regression-analyzer.js`
   - Main workflow (sau fix) PHAI goi `scanDebugMarkers()` + `matchSecurityWarnings()` tu `bin/lib/debug-cleanup.js`
   - Main workflow (sau confirm) PHAI goi `runLogicSync()` tu `bin/lib/logic-sync.js`
2. **Agent goi module qua Bash tool:**
   ```
   Bash: node -e "const m = require('./bin/lib/repro-test-generator.js'); console.log(JSON.stringify(m.generateReproTest({...})))"
   ```
   Hoac tao CLI wrapper nhu da lam voi `bin/plan-check.js`.
3. **Them integration test: "Khi chay qua orchestrator, module X PHAI duoc goi."** Kiem tra output file co chua dau hieu module da chay (vi du: `evidence_repro.md` phai co `testFileName` tu `generateReproTest()`).
4. **Giong nhu D-02 cua v1.5:** fix-bug.md da o gioi han 419/420 dong — van phai goi external module thay vi inline. v2.1 tiep tuc pattern nay.

**Warning signs:**
- Agent prompt co logic tuong tu module nhung KHONG import/goi module
- Output format cua agent khac voi output format cua module (vi du: repro test thieu `testFileName`)
- Module function trong `bin/lib/` khong duoc reference tu bat ky agent hoac workflow nao
- 601 tests van pass nhung fix-bug workflow thuc te khong goi bat ky module nao

**Phase to address:**
Phase 4 (Workflow Execution Loop) — khi wiring agents vao workflow, PHAI kiem tra tung module v1.5 van duoc goi.

---

### Pitfall 5: Tier/Model Routing Sai — Scout Dung Opus, Architect Dung Haiku

**What goes wrong:**
Thiet ke v2.1 co 3 tier: Scout (Haiku), Builder (Sonnet), Architect (Opus). Nhung:
- Neu agent file thieu field `model:` → mac dinh la `inherit` → kế thừa model cua main. Neu main la Sonnet, Architect cung la Sonnet thay vi Opus
- Neu user chay tren Gemini CLI, tier mapping khac hoan toan (Flash/Pro/Pro) — nhung agent files chi co 1 bo
- Neu Scout agent doc qua nhieu file (vi du Janitor scan `.planning/bugs/` lon) → Haiku het context truoc khi xong
- Chi phi tang 4-7x so voi single-agent (theo nghien cuu). Voi Opus cho Architect, moi session co the dat 3-5 USD thay vi 0.3-0.5 USD

Nghien cuu cho thay: "96% enterprises report AI costs exceeding initial estimates" va "A common mistake in routing design is mapping broad complexity tiers to models."

**Why it happens:**
Tier → Model mapping la y tuong tot tren giay, nhung thuc te:
- Claude Code agent file chi cho phep 1 gia tri `model:` — khong co logic "neu platform X thi model Y"
- Moi platform (Claude, Gemini, Codex) co model naming khac nhau — `model: haiku` chi hoat dong tren Claude
- User co the override model bang CLI flags — pha vo tier design

**How to avoid:**
1. **Dat `model:` RO RANG trong moi agent file.** KHONG dung `inherit`:
   - `pd-bug-janitor.md`: `model: haiku`
   - `pd-doc-specialist.md`: `model: haiku`
   - `pd-code-detective.md`: `model: sonnet`
   - `pd-repro-engineer.md`: `model: sonnet`
   - `pd-fix-architect.md`: `model: opus`
2. **Them `maxTurns` theo tier de gioi han chi phi:**
   - Scout: maxTurns 5 (toi da ~2K token output)
   - Builder: maxTurns 10
   - Architect: maxTurns 12
3. **Cross-platform: Tao agent files KHAC NHAU cho moi platform.** Converter transpile agent files tuong tu skill files — moi platform co model name rieng:
   - Claude: haiku/sonnet/opus
   - Gemini: flash/pro (KHONG co opus equivalent)
   - Codex: routing khac hoan toan
4. **Thiet ke "degradation path":** Neu Opus khong kha dung (Gemini khong co tuong duong), Architect chay tren model tot nhat co san. Workflow khong duoc FAIL vi thieu model.
5. **Budget alert: Tinh chi phi TRUOC khi deploy.** Voi 5 agent moi session: ~50K tokens input + ~10K output ≈ $0.50-3.00/session tuy model mix. So sanh voi hien tai ~$0.05-0.10/session.

**Warning signs:**
- Tat ca agents chay cung 1 model (inherit tu main)
- Architect chay tren Haiku — khong du kha nang tong hop evidence phuc tap
- Chi phi moi session tang >10x so voi v1.5
- Agent file co `model: opus` nhung platform khong ho tro Opus

**Phase to address:**
Phase 1 (Dynamic Resource Orchestration) — dinh nghia tier mapping, model defaults, va degradation path. Kiem tra cross-platform compatibility.

---

### Pitfall 6: Evidence Format Khong Nhat Quan — Agent Tra Ve Tu Do Thay Vi Theo Protocol

**What goes wrong:**
Thiet ke yeu cau 3 ket luan chuan: `## ROOT CAUSE FOUND`, `## CHECKPOINT REACHED`, `## INVESTIGATION INCONCLUSIVE`. Nhung LLM-based agents la non-deterministic — moi lan chay co the:
- Viet "## Ket luan: Da tim nguyen nhan" thay vi "## ROOT CAUSE FOUND"
- Bo qua Elimination Log khi INCONCLUSIVE (danh sach file da kiem tra va loai tru)
- Khong ghi evidence kem ROOT CAUSE — chi noi "loi o dong 42" ma khong ghi bang chung
- Mix tieng Viet va tieng Anh trong heading — Architect parse sai

Theo nghien cuu GitHub Blog: "Natural language is messy — agents exchange messy language or inconsistent JSON. Field names drift, data types mismatch."

**Why it happens:**
Agent prompt la huong dan, khong phai enforcement. LLM co xu huong "paraphrase" thay vi copy chinh xac format. Dac biet khi context dai, agent de quen format da duoc chi dinh o dau prompt.

**How to avoid:**
1. **Dung hooks `PostToolUse` de validate evidence format.** Tao script kiem tra file evidence sau khi agent ghi:
   ```bash
   # validate-evidence.sh
   # Kiem tra file co chua 1 trong 3 heading chuan
   grep -qE "^## (ROOT CAUSE FOUND|CHECKPOINT REACHED|INVESTIGATION INCONCLUSIVE)" "$1" || exit 2
   ```
2. **Them format example NGAY TRONG agent prompt, khong chi mo ta.** Hien tai agent prompts mo ta format nhung thieu vi du cu the. Them:
   ```markdown
   OUTPUT FORMAT (BAT BUOC):
   ## ROOT CAUSE FOUND
   **File:** [path:line]
   **Evidence:** [code snippet hoac log]
   **Explanation:** [tai sao day la nguyen nhan]
   ```
3. **Architect agent PHAI validate evidence truoc khi tong hop.** Neu evidence file thieu heading chuan → ghi warning va yeu cau spawn lai agent do.
4. **Tao pure function `validateEvidence(content)` trong JS module** — kiem tra heading, required fields, va tra ve {valid, errors}. Goi tu PostToolUse hook hoac tu main workflow.

**Warning signs:**
- Evidence file khong co bat ky heading chuan nao
- Architect bao "khong hieu ket qua cua Detective" vi format la
- Evidence file chi co mo ta tu do, khong co file:line cu the
- INCONCLUSIVE thieu Elimination Log — agent lap lai gia thuyet da sai

**Phase to address:**
Phase 2 (Detective Protocols) — dinh nghia Evidence Format, tao validation function, va wiring hooks.

---

### Pitfall 7: Platform Transpilation — Agent Files Khong Duoc Converter Xu Ly

**What goes wrong:**
He thong hien tai co 4 converter (codex, gemini, opencode, copilot) transpile skill files tu `commands/pd/*.md`. Agent files moi o `commands/pd/agents/*.md`. Nhung:
- Converter `base.js` chi scan `commands/pd/*.md` — KHONG scan `commands/pd/agents/`
- Glob pattern trong generate-snapshots.js co the khong bao gom subdirectory `agents/`
- Agent frontmatter (`tier`, `model: haiku/sonnet/opus`) khong co mapping cross-platform
- Codex, Gemini, OpenCode co the KHONG HO TRO subagent frontmatter format
- 48 converter snapshot tests khong bao gom agent files → khong phat hien regression

Ket qua: 5 agent files chi hoat dong tren Claude Code, 4 platform con lai khong co agents → fix-bug workflow tren Gemini/Codex bi loi.

**Why it happens:**
Agent concept la moi (v2.1). Converter pipeline (base.js) duoc thiet ke cho skill files (command files) — khong biet den agent files. Moi platform co cach xu ly agents khac nhau:
- Claude Code: `.claude/agents/*.md` voi YAML frontmatter
- Codex: khong co tuong duong chinh thuc
- Gemini CLI: format khac
- Agent Skills spec (agentskills.io) la cross-platform nhung chua bao gom subagent concept

**How to avoid:**
1. **Mo rong converter pipeline de xu ly agent files.** Them config option `agentsDir` ben canh `skillsDir` trong `base.js`.
2. **Tao agent file mapper cho moi platform:**
   - Claude: giu nguyen `.claude/agents/*.md`
   - Codex: chuyen thanh custom instructions hoac tool definitions
   - Gemini: chuyen thanh agent configuration format cua Gemini
   - Copilot: embed agent logic vao skill file (khong co agent concept)
   - OpenCode: tuong tu Copilot
3. **Them snapshot tests cho agent files.** 5 agent files x 4 platforms = 20 snapshot tests moi. Tong snapshot tang tu 48 len 68.
4. **Xem xet: NEU platform khong ho tro agents → fix-bug fallback ve single-agent mode.** Workflow kiem tra platform → co agents support → da-agent, khong → v1.5 single-agent. Day la backward-compatible nhat.
5. **Tier mapping phai la phan cua converter config:**
   ```javascript
   // codex.js config
   tierMap: { scout: 'gpt-4o-mini', builder: 'o3', architect: 'o3' }
   // gemini.js config
   tierMap: { scout: 'gemini-3-flash', builder: 'gemini-3.1-pro', architect: 'gemini-3.1-pro' }
   ```

**Warning signs:**
- `npm test` chay 48 snapshots thay vi 68 (agent snapshots thieu)
- Agent files khong xuat hien trong output cua bat ky converter nao
- fix-bug tren Gemini/Codex fail vi khong tim thay agent files
- Converter chi copy agent files ma khong transpile (giu nguyen `model: haiku` tren platform khong co Haiku)

**Phase to address:**
Phase 4 (Workflow Execution Loop) — khi tich hop agents vao workflow, PHAI dong thoi cap nhat converter pipeline. Hoac: Phase rieng cho Platform Transpilation.

---

## Technical Debt Patterns

| Shortcut | Loi ich truoc mat | Chi phi dai han | Khi nao chap nhan |
|----------|-------------------|-----------------|---------------------|
| Hardcode model names trong agent files | Nhanh, don gian | Moi platform can bo agent files rieng, khong dung chung | KHONG BAO GIO — dung converter tier mapping |
| Bo qua maxTurns cho agents | Agent chay tu do, linh hoat | 1 agent chay 50+ turns, tieu het token budget | Chi khi prototype/debug |
| Inline evidence validation trong workflow thay vi module rieng | Nhanh ship | Khong test duoc, khong reuse cho platform khac | KHONG BAO GIO — phai la pure function |
| Ghi agent state vao SESSION file tu ca agent va main | Don gian hon file rieng | Race condition, data corruption | KHONG BAO GIO — strict file ownership |
| Skip agent support cho 1-2 platform ("lam sau") | Ship nhanh tren Claude | Platform kia bi loi, user mat tin tuong | Chi cho MVP/prototype, phai fix truoc release |
| Dung Opus cho moi agent (de ket qua tot nhat) | Chat luong cao | Chi phi tang 10-20x, rate limit hit | KHONG BAO GIO trong production |

## Integration Gotchas

| Tich hop | Loi thuong gap | Cach dung |
|----------|---------------|-----------|
| v1.5 repro-test-generator + pd-repro-engineer | Agent viet test rieng, bo qua `generateReproTest()` | Agent PHAI goi module qua Bash, dung output cua module lam base |
| v1.5 regression-analyzer + pd-code-detective | Agent dung FastCode truc tiep ma khong chay `analyzeFromCallChain()` | Agent parse FastCode output roi goi `analyzeFromCallChain()` de co format chuan |
| v1.5 debug-cleanup + workflow Buoc 9a | Buoc 9a bi bo qua vi Architect agent "da clean up" | Buoc 9a van thuoc main workflow SAU khi agent hoan thanh, KHONG phai agent responsibility |
| v1.5 logic-sync + workflow Buoc 10a | Logic sync bi bo qua vi khong agent nao chiu trach nhiem | Buoc 10a van thuoc main workflow SAU user confirm, goi `runLogicSync()` nhu v1.5 |
| SESSION file + Evidence files | Agent ghi thang vao SESSION thay vi evidence file rieng | SESSION chi duoc main workflow ghi. Agents chi ghi evidence_*.md cua minh |
| BUG report + Architect evidence | Architect tao BUG report khac format voi Buoc 7 template | Architect chi de xuat root cause + fix plan. Main workflow tao BUG report theo template co san |
| Context7 pipeline + pd-doc-specialist | DocSpec goi Context7 truc tiep khong theo canonical pipeline | DocSpec PHAI tham chieu `@references/context7-pipeline.md` — resolve-library-id truoc, query-docs sau |
| Converter snapshots + Agent files | Them agent files ma khong update snapshot expectations | Chay `node bin/generate-snapshots.js` SAU moi thay doi agent files |

## Performance Traps

| Trap | Trieu chung | Phong tranh | Khi nao gap |
|------|-------------|-------------|-------------|
| 5 agents tuan tu = 5x latency | Fix-bug mat 5-10 phut thay vi 1-2 phut | Spawn Detective + DocSpec song song (giam 1 round trip) | Moi session |
| Haiku agent doc qua nhieu file | Janitor scan 50+ bug reports, het context | Gioi han: chi scan 10 bug reports gan nhat | Khi `.planning/bugs/` lon |
| Opus agent cho ngang buoc thuc hien | Architect "suy nghi" 3 phut cho tong hop | Dat maxTurns va timeout cho Architect | Khi evidence phuc tap |
| Background agent bi deny permission | Background agent can Write nhung khong co pre-approval | Pre-approve Write permission truoc khi spawn background agent | Khi dung background mode |
| Agent re-read context7 docs da co | DocSpec goi resolve-library-id cho lib da cached | Cache library IDs trong evidence file, DocSpec kiem tra truoc khi resolve | Moi session voi lib da biet |
| Token usage tang 4-7x | Hoa don API tang dot bien, rate limit hit | Monitor token usage per session, set budget cap | Khi dung thuong xuyen |

## Security Mistakes

| Loi | Rui ro | Phong tranh |
|-----|--------|-------------|
| Agent co `permissionMode: bypassPermissions` | Agent doc/ghi file nhay cam (.env, credentials) | Dung `permissionMode: default` hoac `dontAsk`. KHONG BAO GIO dung bypass |
| Agent Bash tool chay lenh nguy hiem | Agent chay `rm -rf` hoac `git push --force` | Gioi han Bash tools bang hooks PreToolUse. Detective va DocSpec KHONG can Bash |
| Evidence files chua thong tin nhay cam | Session file co credentials tu log output | Them pattern filter: loai bo dong chua password/token/secret tu evidence |
| Background agent chay khi user khong giam sat | Agent thuc hien hanh dong khong mong muon | Chi dung background cho read-only agents (Janitor, DocSpec) |

## UX Pitfalls

| Pitfall | Anh huong user | Cach tot hon |
|---------|---------------|--------------|
| Spawn 5 agent khong bao truoc | User khong biet dang xay ra gi, tuong bi treo | Hien thi: "Dang spawn [Agent Name] (tier: [X])..." truoc moi agent |
| Agent hoi user question tu background | Background agent bi tu choi AskUserQuestion — mat cau hoi | Chi foreground agent duoc hoi user. Janitor (hoi 5 cau vang) phai la foreground |
| Resume UI liet ke qua nhieu file | User thay 20+ files trong `.planning/debug/` | Chi hien SESSION files, khong hien evidence files. Danh so ID ro rang |
| CHECKPOINT khong ro rang | User khong biet tra loi gi | CHECKPOINT phai co cau hoi CU THE va goi y dap an |
| Agent chay lau khong feedback | User doi 3 phut khong thay gi | Progress indicator hoac periodic summary tu agent |

## "Looks Done But Isn't" Checklist

- [ ] **Agent spawning:** Agent files ton tai nhung chua duoc wire vao workflow `fix-bug.md` — kiem tra Buoc X co `spawn [agent-name]` instruction
- [ ] **Evidence validation:** Evidence format doc duoc boi nguoi nhung Architect khong parse duoc — kiem tra heading chuan co match regex
- [ ] **v1.5 module calls:** Agents hoat dong nhung KHONG goi pure functions — kiem tra `generateReproTest()`, `analyzeFromCallChain()`, `scanDebugMarkers()`, `runLogicSync()` co trong flow
- [ ] **Converter coverage:** Agent files ton tai nhung khong xuat hien trong platform output — chay `npm test` va kiem tra snapshot count tang
- [ ] **maxTurns enforcement:** Agent frontmatter co `maxTurns` nhung chay thuc te vuot gioi han — kiem tra transcript file co dung lai dung turns
- [ ] **Degradation path:** Agent mode hoat dong nhung fallback ve single-agent khi loi — kiem tra tren platform khong ho tro agents
- [ ] **Session continuity:** Resume UI hoat dong nhung khong resume DUNG agent context — kiem tra Architect resume voi evidence cu
- [ ] **48 + N snapshot tests:** Them agent snapshots nhung khong cap nhat test expectations — chay `node bin/generate-snapshots.js` va kiem tra diff
- [ ] **Elimination Log:** INCONCLUSIVE evidence co heading nhung thieu danh sach files da loai tru — kiem tra content co muc `### Da kiem tra va loai tru`

## Recovery Strategies

| Pitfall | Chi phi khoi phuc | Cach khoi phuc |
|---------|-------------------|----------------|
| Context window bung no | THAP | Giam maxTurns, them summary protocol, restart session |
| Subagent nesting vi pham | TRUNG BINH | Chuyen orchestration tu agent sang main workflow — refactor 1 file |
| Race condition ghi file | CAO | Kiem tra tat ca evidence files, xac dinh data bi corrupt, chay lai agents bi anh huong |
| v1.5 module bi bypass | CAO | Audit toan bo agent prompts, them explicit module calls, them integration tests |
| Tier routing sai | THAP | Cap nhat `model:` field trong agent frontmatter, chay lai |
| Evidence format sai | TRUNG BINH | Them validation hooks, re-train agent prompts voi vi du cu the |
| Converter thieu agent files | CAO | Mo rong converter pipeline, them snapshot tests, regenerate tat ca snapshots |
| Chi phi bung no | THAP | Ha model tier, giam maxTurns, hoac fallback ve single-agent |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Context window bung no | Phase 1 (Resource Orchestration) | Token usage per session < 50K, khong bi auto-compact giua workflow |
| Subagent nesting constraint | Phase 1 (Resource Orchestration) | Khong agent nao co `tools: Agent(...)`, main workflow la orchestrator |
| Race condition ghi file | Phase 2 (Detective Protocols) | Moi evidence file chi co 1 owner, run concurrent test khong bi corruption |
| v1.5 backward compatibility | Phase 4 (Execution Loop) | 601 tests van pass, moi v1.5 module duoc goi it nhat 1 lan trong workflow |
| Tier/Model routing sai | Phase 1 (Resource Orchestration) | Moi agent co `model:` explicit, khong co `inherit`. Cross-platform test pass |
| Evidence format khong nhat quan | Phase 2 (Detective Protocols) | validateEvidence() pure function pass cho moi evidence file |
| Platform transpilation thieu | Phase 4 (Execution Loop) | Snapshot count = 48 + (5 agents x 4 platforms) = 68. Tat ca pass |
| Chi phi bung no | Phase 1 (Resource Orchestration) | Budget cap per session, maxTurns enforcement, degradation path test |

## Sources

- [Claude Code: Create custom subagents](https://code.claude.com/docs/en/sub-agents) — tai lieu chinh thuc, HIGH confidence
- [GitHub Blog: Multi-agent workflows often fail](https://github.blog/ai-and-ml/generative-ai/multi-agent-workflows-often-fail-heres-how-to-engineer-ones-that-dont/) — engineering patterns, HIGH confidence
- [arxiv: Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/pdf/2503.13657) — nghien cuu hoc thuat, 42% specification failures, 37% coordination failures, MEDIUM confidence
- [DoltHub: Multi-Agent Persistence](https://www.dolthub.com/blog/2026-03-13-multi-agent-persistence/) — file-based persistence race conditions, MEDIUM confidence
- [DEV.to: Multi-Model Routing Pattern](https://dev.to/askpatrick/the-multi-model-routing-pattern-how-to-cut-ai-agent-costs-by-78-1631) — tier routing chi phi, MEDIUM confidence
- [Galileo: Why Multi-Agent AI Systems Fail](https://galileo.ai/blog/multi-agent-ai-failures-prevention) — failure taxonomy, MEDIUM confidence
- [OpenClaw: Session memory markdown not flushed](https://github.com/openclaw/openclaw/issues/21382) — race condition bug thuc te, HIGH confidence
- [RocketEdge: AI Agent Cost Control](https://rocketedge.com/2026/03/15/your-ai-agent-bill-is-30x-higher-than-it-needs-to-be-the-6-tier-fix/) — chi phi thuc te, MEDIUM confidence
- Ma nguon hien tai: `commands/pd/fix-bug.md`, `workflows/fix-bug.md`, `bin/lib/*.js`, `bin/lib/converters/base.js` — PRIMARY source, HIGH confidence

---
*Pitfalls research cho: v2.1 Detective Orchestrator — chuyen doi single-agent sang multi-agent debug orchestration*
*Researched: 2026-03-24*
