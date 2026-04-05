# Phase 50: POC & Fix Phases - Research

**Researched:** 2026-03-26
**Domain:** Security audit POC pipeline, gadget chain analysis, fix phase automation
**Confidence:** HIGH

## Summary

Phase 50 triển khai 3 component lớn: (1) POC pipeline trong scanner khi --poc flag active, (2) Gadget Chain cross-category analysis trong Reporter B6, và (3) agent pd-sec-fixer thay thế stub B8 để tự động tạo fix phases decimal. Tất cả đều xây trên nền tảng vững chắc của Phase 46-49 — security-rules.yaml (1167 dòng, 13 categories đầy đủ fixes[]), session-delta.js (classifyDelta cho SEC-VERIFY), evidence-protocol.js (parseEvidence), và parallel-dispatch.js (mergeScannerResults).

Codebase tuân thủ pattern pure function module nhất quán (không I/O, không side effects). Mọi agent đăng ký trong AGENT_REGISTRY với tier/tools mapping. Test dùng Node.js built-in test runner (`node --test`). Workflow audit.md là markdown prose thực thi bởi AI agent — không phải code.

**Primary recommendation:** Chia thành 2 plans: Plan 01 tạo gadget-chain.js pure function module (TDD) + gadget-chain-templates.yaml; Plan 02 tạo pd-sec-fixer agent + security-fix-phase template + wire POC vào scanner + wire B6 gadget chain + wire B8 fixer dispatch.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** POC được tạo BÊN TRONG scanner (pd-sec-scanner). Khi --poc flag active và scanner phát hiện FLAG/FAIL, scanner tự viết POC section ngay trong evidence file. Không cần agent riêng cho POC
- **D-02:** POC output nằm trong evidence file — thêm section `## POC` vào evidence_sec_{cat}.md ngay sau findings. Mọi thứ 1 file, dễ truy vết
- **D-03:** POC CHỈ được tạo khi user truyền --poc flag. Default audit không tạo POC — tiết kiệm token
- **D-04:** Mức độ chi tiết POC: mô tả khai thác bằng text — input vector, payload mẫu, bước tái hiện, kết quả dự kiến. KHÔNG tạo script chạy thật
- **D-05:** Gadget Chain phát hiện trong Reporter B6. Reporter đã đọc tất cả evidence — thêm logic cross-reference tìm chain tại đây. Không cần agent/bước riêng
- **D-06:** Logic phát hiện chain: rule-based patterns. Dựng sẵn các chain templates phổ biến trong YAML. Match findings vào template. Dự đoán, nhanh, ít token
- **D-07:** Severity escalation: khi phát hiện gadget chain, severity tổng hợp = max(individual) + 1 bậc. VD: 2 HIGH → chain CRITICAL. Cap tại CRITICAL
- **D-08:** Fix phases trigger: KHI USER APPROVE. Sau audit xong, hiển thị danh sách findings + gợi ý fix phases. User chọn "tạo fix phases" thì mới tạo vào ROADMAP
- **D-09:** Priority order: gadget chain ngược. Fix từ gốc chain trước. Khi gốc được vá, các mắt xích sau có thể tự hết
- **D-10:** Fix phases dùng numbering decimal: N.1, N.2... trong đó N = phase audit hiện tại
- **D-11:** Template security-fix-phase.md: trích dẫn evidence gốc, hướng sửa cụ thể (từ security-rules.yaml fixes), tiêu chí hoàn thành rõ ràng
- **D-12:** SEC-VERIFY = re-audit chỉ files đã fix. Dùng session-delta (Phase 49) để chỉ scan lại files đã sửa
- **D-13:** SEC-VERIFY là fix phase cuối cùng trong chuỗi decimal
- **D-14:** B8 dùng agent riêng pd-sec-fixer. Spawn agent sau khi có SECURITY_REPORT.md để phân tích findings và tạo fix phases proposal
- **D-15:** pd-sec-fixer nhận input: SECURITY_REPORT.md + evidence files + gadget chains. Output: danh sách fix phases đề xuất với priority order. Chế độ tích hợp: hỏi user approve rồi insert vào ROADMAP. Chế độ độc lập: chỉ in gợi ý trong report

### Claude's Discretion
- Chi tiết gadget chain templates trong YAML — researcher quyết định patterns phổ biến nào cần cover
- Cách pd-sec-fixer tương tác với ROADMAP.md API (gsd-tools insert-phase hoặc manual)
- Format chính xác của section ## POC trong evidence
- Cách SEC-VERIFY so sánh kết quả trước/sau fix

### Deferred Ideas (OUT OF SCOPE)
- `--auto-fix`: tự sửa code trực tiếp — đã reject (AUTOFIX-01), giữ stub
- Interactive fix mode: user chọn từng finding để fix — có thể thêm sau
- CI/CD integration: chạy audit trong pipeline — thuộc Phase 51
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POC-01 | POC đơn lẻ khi --poc: input vector, payload mẫu, bước tái hiện, kết quả dự kiến | Scanner template mở rộng thêm section ## POC khi --poc active. Format POC per finding: 4 trường bắt buộc. security-rules.yaml fixes[] cung cấp context cho payload mẫu |
| POC-02 | Gadget Chain POC liên kết FAIL/FLAG từ mọi category thành chuỗi tấn công + severity đánh lại | gadget-chain.js pure function + gadget-chain-templates.yaml. Reporter B6 gọi detectChains(). Severity escalation max+1, cap CRITICAL |
| FIX-01 | Tự động tạo fix phases decimal (N.1, N.2...) sắp theo ngược gadget chain (P0→P1→P2) | pd-sec-fixer agent phân tích SECURITY_REPORT + gadget chains, sắp theo reverse chain order, output fix phases proposal |
| FIX-02 | Template security-fix-phase.md với evidence trích dẫn, hướng sửa, tiêu chí hoàn thành | Template mới trong templates/ với 4 sections: Evidence, Hướng sửa (từ security-rules.yaml fixes[]), Tiêu chí, Files cần sửa |
| FIX-03 | Phase cuối [SEC-VERIFY] chạy lại audit trên files đã fix | SEC-VERIFY = fix phase cuối cùng (N.K), dùng classifyDelta() với danh sách files đã sửa từ các fix phases trước |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Dùng tiếng Việt toàn bộ, có dấu chuẩn — áp dụng cho mọi file output (agent template, workflow prose, YAML comments, evidence sections)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `node:test` | >=16.7.0 | Test framework | Dự án dùng nhất quán `node --test`, không thêm dependency |
| Node.js built-in `node:assert/strict` | >=16.7.0 | Assertions | Đi cùng node:test |
| YAML (plain text) | — | Config format | security-rules.yaml pattern đã có sẵn |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `bin/lib/session-delta.js` | current | classifyDelta, appendAuditHistory | SEC-VERIFY re-audit |
| `bin/lib/evidence-protocol.js` | current | parseEvidence, validateEvidence | Parse evidence cho gadget chain input |
| `bin/lib/resource-config.js` | current | AGENT_REGISTRY, getAgentConfig | Đăng ký pd-sec-fixer |
| `bin/lib/parallel-dispatch.js` | current | mergeScannerResults | Input cho gadget chain analysis |
| `bin/lib/utils.js` | current | parseFrontmatter, buildFrontmatter | Parse evidence YAML frontmatter |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| YAML cho gadget chain templates | JSON | YAML nhất quán với security-rules.yaml, dễ đọc hơn cho patterns |
| Rule-based chain detection | AI-based analysis | Rule-based nhanh, ít token, dự đoán được (D-06 locked) |
| Agent riêng cho POC | POC trong scanner | Scanner đã có context (D-01 locked) |

## Architecture Patterns

### Tổng quan Component mới

```
references/
├── security-rules.yaml          # Có sẵn — 13 categories, mỗi cái có fixes[]
├── gadget-chain-templates.yaml  # MỚI — chain patterns
bin/lib/
├── gadget-chain.js              # MỚI — pure function: detectChains, escalateSeverity
├── session-delta.js             # Có sẵn — classifyDelta cho SEC-VERIFY
├── resource-config.js           # SỬA — thêm pd-sec-fixer vào AGENT_REGISTRY
commands/pd/agents/
├── pd-sec-scanner.md            # SỬA — thêm logic POC khi --poc
├── pd-sec-reporter.md           # SỬA — thêm gadget chain detection vào B6
├── pd-sec-fixer.md              # MỚI — agent tạo fix phases proposal
templates/
├── security-fix-phase.md        # MỚI — template cho fix phases
workflows/
├── audit.md                     # SỬA — B3 bỏ stub --poc, B8 thay stub bằng fixer dispatch
test/
├── smoke-gadget-chain.test.js   # MỚI — test detectChains + escalateSeverity
```

### Pattern 1: Pure Function Module (gadget-chain.js)
**What:** Module pure function không I/O, nhận findings array + chain templates, trả về detected chains + escalated severities
**When to use:** Khi cần logic testable cho gadget chain detection
**Example:**
```javascript
// gadget-chain.js — follows session-delta.js pattern
'use strict';

const SEVERITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * Phát hiện gadget chains từ findings cross-category.
 * @param {Array<{category, file, verdict, severity}>} findings
 * @param {Array<{id, name, links: [{from_cat, to_cat, condition}], escalation}>} templates
 * @returns {{ chains: Array<{id, name, findings, originalSeverity, escalatedSeverity}>, unlinked: Array }>}
 */
function detectChains(findings, templates) { /* ... */ }

/**
 * Tính severity escalation: max(individual) + 1, cap CRITICAL.
 * @param {string[]} severities - Mảng severity strings
 * @returns {string} Escalated severity
 */
function escalateSeverity(severities) { /* ... */ }

module.exports = { detectChains, escalateSeverity, SEVERITY_ORDER };
```

### Pattern 2: Agent Template (pd-sec-fixer.md)
**What:** Agent markdown template theo chuẩn dự án — frontmatter YAML flat + objective + process + rules
**When to use:** pd-sec-fixer.md agent mới cho B8
**Example:**
```markdown
---
name: pd-sec-fixer
description: Phan tich findings bao mat va tao de xuat fix phases decimal theo thu tu uu tien.
tier: architect
allowed-tools:
  - Read
  - Write
  - Glob
---
```

### Pattern 3: YAML Config (gadget-chain-templates.yaml)
**What:** File YAML định nghĩa các chain patterns phổ biến
**When to use:** Input cho detectChains() trong gadget-chain.js
**Example:**
```yaml
# gadget-chain-templates.yaml — Chain patterns phổ biến
chains:
  - id: sqli-data-leak
    name: "SQL Injection → Data Leak"
    description: "SQLi cho phép trích xuất dữ liệu nhạy cảm từ DB"
    links:
      - from_cat: sql-injection
        to_cat: secrets
        condition: "SQLi FAIL + secrets trong cùng DB schema"
    root: sql-injection
    escalation: "+1"

  - id: idor-privesc
    name: "IDOR → Privilege Escalation"
    description: "Thiếu kiểm tra ownership cho phép truy cập tài nguyên người khác"
    links:
      - from_cat: auth
        to_cat: auth
        condition: "IDOR FAIL + admin endpoint không kiểm tra role"
    root: auth
    escalation: "+1"

  - id: xss-session-hijack
    name: "XSS → Session Hijacking"
    description: "XSS cho phép đánh cắp cookie/token phiên"
    links:
      - from_cat: xss
        to_cat: auth
        condition: "XSS FAIL + cookie không HttpOnly"
    root: xss
    escalation: "+1"

  - id: cmd-injection-rce
    name: "Command Injection → RCE"
    description: "Injection command OS dẫn đến thực thi mã từ xa"
    links:
      - from_cat: cmd-injection
        to_cat: misconfig
        condition: "cmd-injection FAIL + process chạy root/admin"
    root: cmd-injection
    escalation: "+1"

  - id: deserialization-rce
    name: "Deserialization → RCE"
    description: "Deserialization không an toàn dẫn đến thực thi mã tùy ý"
    links:
      - from_cat: deserialization
        to_cat: cmd-injection
        condition: "Deserialization FAIL + có exec/spawn trong codebase"
    root: deserialization
    escalation: "+1"

  - id: path-traversal-data-leak
    name: "Path Traversal → Sensitive Data Exposure"
    description: "Đọc file tùy ý dẫn đến lộ secrets/config"
    links:
      - from_cat: path-traversal
        to_cat: secrets
        condition: "Path traversal FAIL + secrets trong file system"
    root: path-traversal
    escalation: "+1"

  - id: prototype-pollution-rce
    name: "Prototype Pollution → RCE"
    description: "Pollution prototype dẫn đến code execution qua gadget"
    links:
      - from_cat: prototype-pollution
        to_cat: cmd-injection
        condition: "Prototype pollution FAIL + child_process trong deps chain"
    root: prototype-pollution
    escalation: "+1"
```

### Pattern 4: POC Section Format trong Evidence
**What:** Section ## POC thêm vào evidence file khi --poc active
**Format đề xuất:**
```markdown
## POC

### POC-1: {tên finding}
**Input vector:** {mô tả điểm vào — endpoint, parameter, header}
**Payload mẫu:** `{payload cụ thể}`
**Bước tái hiện:**
1. {bước 1}
2. {bước 2}
3. {bước 3}
**Kết quả dự kiến:** {mô tả hành vi nguy hiểm xảy ra}
**Severity:** {CRITICAL/HIGH/MEDIUM/LOW}

### POC-2: {tên finding tiếp}
...
```

### Pattern 5: security-fix-phase.md Template
**What:** Template cho mỗi fix phase decimal
**Format đề xuất:**
```markdown
# Fix Phase {N.X}: {tên lỗ hổng}

## Evidence gốc

| Finding | File | Dòng | Severity | Category |
|---------|------|------|----------|----------|
| {mô tả} | {file} | {line} | {severity} | {category} |

> Trích dẫn từ: `{evidence_file}` section "{section_name}"

## Gadget Chain (nếu có)

Chain: {chain_name}
Vị trí trong chain: {root / link N}
Fix finding này sẽ: {mô tả tác động lên chain}

## Hướng sửa

{Hướng sửa cụ thể từ security-rules.yaml fixes[]}

### Code pattern trước (nguy hiểm)
```
{code snippet từ evidence}
```

### Code pattern sau (an toàn)
```
{code pattern an toàn}
```

## Files cần sửa

| # | File | Hàm | Dòng | Hành động |
|---|------|-----|------|-----------|
| 1 | {file} | {function} | {line} | {mô tả thay đổi} |

## Tiêu chí hoàn thành

- [ ] {tiêu chí 1 — cụ thể, kiểm chứng được}
- [ ] {tiêu chí 2}
- [ ] Chạy scanner category {cat} trên files đã sửa → verdict PASS
```

### Anti-Patterns to Avoid
- **Tạo POC script chạy thật:** D-04 locked — chỉ mô tả text, KHÔNG tạo exploit script
- **POC khi không có --poc flag:** D-03 locked — default audit không tạo POC
- **Tự động sửa ROADMAP:** D-08 locked — phải có user approve trước khi insert fix phases
- **Gadget chain dùng AI:** D-06 locked — rule-based patterns, không gọi AI

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parse evidence frontmatter | Custom YAML parser | `parseFrontmatter()` từ utils.js | Đã tested, dùng xuyên suốt project |
| Validate evidence format | Custom validator | `validateEvidence()` từ evidence-protocol.js | Non-blocking warnings pattern |
| Parse Function Checklist | Custom table parser | `parseFunctionChecklist()` internal trong session-delta.js | Đã extract exact same format |
| Delta classification cho SEC-VERIFY | Custom diff logic | `classifyDelta()` từ session-delta.js | Đã tested với 4 trạng thái |
| Severity ordering | Hardcode if/else | `SEVERITY_ORDER` array trong gadget-chain.js | Reusable, testable |
| Agent config lookup | Hardcode tier/model | `getAgentConfig()` từ resource-config.js | Destructuring + spread pattern |

**Key insight:** Hầu hết infrastructure đã có sẵn từ Phase 46-49. Phase 50 chủ yếu thêm logic mới (gadget chain detection, POC generation) và wire vào workflow existing.

## Common Pitfalls

### Pitfall 1: parseFunctionChecklist không export
**What goes wrong:** `parseFunctionChecklist()` trong session-delta.js là helper nội bộ (không export). Gadget chain cần parse Function Checklist từ evidence.
**Why it happens:** Phase 49 thiết kế cho classifyDelta dùng nội bộ.
**How to avoid:** Hoặc export thêm parseFunctionChecklist, hoặc dùng regex đơn giản trong gadget-chain.js để parse. Khuyến nghị: export thêm vì DRY.
**Warning signs:** `parseFunctionChecklist is not a function` khi require từ module khác.

### Pitfall 2: --poc flag không truyền tới scanner
**What goes wrong:** audit.md B3 hiện parse --poc nhưng báo "Chưa hỗ trợ" rồi tiếp tục. Flag không được truyền xuống B5 dispatch.
**Why it happens:** Stub design từ Phase 47.
**How to avoid:** B3 cần lưu poc_enabled=true vào session context. B5 dispatch truyền `--poc` qua prompt cho scanner.
**Warning signs:** Scanner không nhận được --poc flag, không tạo POC section.

### Pitfall 3: Severity escalation vượt CRITICAL
**What goes wrong:** Logic max+1 có thể tạo severity không hợp lệ nếu không cap.
**Why it happens:** SEVERITY_ORDER chỉ có 4 cấp.
**How to avoid:** `Math.min(maxIndex + 1, SEVERITY_ORDER.length - 1)` — cap tại CRITICAL.
**Warning signs:** Test case 2 CRITICAL findings trong chain phải trả về CRITICAL (không phải undefined).

### Pitfall 4: Fix phase numbering collision
**What goes wrong:** Decimal numbering N.1, N.2 có thể collide nếu audit chạy nhiều lần trên cùng phase.
**Why it happens:** Không kiểm tra existing fix phases trước khi numbering.
**How to avoid:** pd-sec-fixer đọc ROADMAP.md để tìm existing N.X phases trước khi assign số mới.
**Warning signs:** 2 fix phases cùng số N.1 trong ROADMAP.

### Pitfall 5: Reporter B6 không có gadget chain data khi --poc không active
**What goes wrong:** Gadget chain detection hoạt động LUÔN (D-05) — không phụ thuộc --poc flag. Nhầm lẫn giữa POC (cần --poc) và gadget chain (luôn chạy).
**Why it happens:** D-05 nói "phát hiện trong Reporter B6" — không liên quan đến --poc.
**How to avoid:** Tách rõ: POC = scanner, cần --poc flag. Gadget chain = reporter B6, luôn chạy.
**Warning signs:** Gadget chain chỉ xuất hiện khi --poc active.

### Pitfall 6: pd-sec-fixer spawn khi mode="doc-lap"
**What goes wrong:** Mode doc-lập không có .planning/ → không có ROADMAP.md → không thể insert fix phases.
**Why it happens:** D-08 chỉ nói mode tích hợp. D-15 xử lý bằng 2 chế độ: tích hợp (insert ROADMAP) vs độc lập (chỉ in gợi ý).
**How to avoid:** pd-sec-fixer kiểm tra mode trước, đổi behavior tương ứng.
**Warning signs:** Error khi đọc ROADMAP.md trong mode doc-lập.

## Code Examples

### detectChains() — Logic core
```javascript
// gadget-chain.js
function detectChains(findings, templates) {
  // findings = [{category: 'sql-injection', file: '...', verdict: 'FAIL', severity: 'CRITICAL'}, ...]
  // templates = parsed YAML chains array

  const chains = [];
  const linkedFindings = new Set();

  // Group findings by category
  const byCat = new Map();
  for (const f of findings) {
    if (f.verdict !== 'FAIL' && f.verdict !== 'FLAG') continue;
    if (!byCat.has(f.category)) byCat.set(f.category, []);
    byCat.get(f.category).push(f);
  }

  for (const tmpl of templates) {
    // Check if ALL link categories present in findings
    const allPresent = tmpl.links.every(link =>
      byCat.has(link.from_cat) && byCat.has(link.to_cat)
    );
    if (!allPresent) continue;

    // Collect involved findings
    const involved = [];
    for (const link of tmpl.links) {
      involved.push(...(byCat.get(link.from_cat) || []));
      involved.push(...(byCat.get(link.to_cat) || []));
    }
    // De-dup by file::function key
    const unique = [...new Map(involved.map(f => [`${f.file}::${f.name}`, f])).values()];

    const severities = unique.map(f => f.severity);
    const escalated = escalateSeverity(severities);

    chains.push({
      id: tmpl.id,
      name: tmpl.name,
      root: tmpl.root,
      findings: unique,
      originalSeverities: severities,
      escalatedSeverity: escalated,
    });

    unique.forEach(f => linkedFindings.add(`${f.file}::${f.name}`));
  }

  return { chains, linkedFindingKeys: [...linkedFindings] };
}
```

### escalateSeverity() — Tính severity tổng hợp
```javascript
const SEVERITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function escalateSeverity(severities) {
  if (!severities || severities.length === 0) return 'LOW';
  const maxIdx = Math.max(...severities.map(s =>
    SEVERITY_ORDER.indexOf(s.toUpperCase())
  ));
  const escalated = Math.min(maxIdx + 1, SEVERITY_ORDER.length - 1);
  return SEVERITY_ORDER[escalated];
}
```

### pd-sec-fixer output format — Fix phases proposal
```markdown
## Đề xuất Fix Phases

### Gadget Chains phát hiện

| # | Chain | Severity | Root | Findings |
|---|-------|----------|------|----------|
| 1 | SQLi → Data Leak | CRITICAL | sql-injection | 3 findings |

### Fix Phases đề xuất

| Phase | Tên | Priority | Findings | Chain |
|-------|-----|----------|----------|-------|
| 50.1 | Fix SQL Injection | P0 | 3 FAIL | Root of SQLi→DataLeak |
| 50.2 | Fix Secrets Exposure | P1 | 2 FAIL | Link in SQLi→DataLeak |
| 50.3 | SEC-VERIFY | — | Re-audit | Verification |

Tạo fix phases? [y/N]
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `node:assert/strict` |
| Config file | package.json `"test": "node --test 'test/*.test.js'"` |
| Quick run command | `node --test test/smoke-gadget-chain.test.js` |
| Full suite command | `node --test 'test/*.test.js'` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POC-01 | POC section format (4 trường bắt buộc) | manual-only | — (prose template change, scanner agent) | N/A |
| POC-02 | detectChains() phát hiện chain từ cross-category findings | unit | `node --test test/smoke-gadget-chain.test.js` | Wave 0 |
| POC-02 | escalateSeverity() max+1 cap CRITICAL | unit | `node --test test/smoke-gadget-chain.test.js` | Wave 0 |
| FIX-01 | Fix phases ordering theo reverse gadget chain | unit | `node --test test/smoke-gadget-chain.test.js` | Wave 0 |
| FIX-02 | security-fix-phase.md template có 4 sections bắt buộc | smoke | `node --test test/smoke-agent-files.test.js` (nếu extend) | Có (cần extend) |
| FIX-03 | SEC-VERIFY sử dụng classifyDelta đúng | unit | `node --test test/smoke-session-delta.test.js` (existing) | Có |

### Sampling Rate
- **Per task commit:** `node --test test/smoke-gadget-chain.test.js`
- **Per wave merge:** `node --test 'test/*.test.js'`
- **Phase gate:** Full suite green trước `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/smoke-gadget-chain.test.js` — covers POC-02, FIX-01
- [ ] Extend `test/smoke-resource-config.test.js` — cover pd-sec-fixer registration
- [ ] Extend `test/smoke-agent-files.test.js` — cover pd-sec-fixer.md + security-fix-phase.md existence

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| B3 --poc stub "Chưa hỗ trợ" | POC trong scanner khi --poc active | Phase 50 | Scanner tạo ## POC section |
| B8 stub "Extension point" | pd-sec-fixer agent dispatch | Phase 50 | Tự động gợi ý fix phases |
| Reporter chỉ tổng hợp | Reporter + gadget chain detection | Phase 50 | Cross-category analysis |
| Findings riêng lẻ | Gadget chain liên kết | Phase 50 | Severity escalation |

## Open Questions

1. **parseFunctionChecklist export hay duplicate?**
   - What we know: Hàm này internal trong session-delta.js, gadget-chain.js cần parse cùng format
   - What's unclear: Export thêm (break SRP?) hay duplicate logic (break DRY?)
   - Recommendation: Export thêm — đã dùng nhất quán cùng format, DRY quan trọng hơn

2. **pd-sec-fixer tương tác ROADMAP.md bằng cách nào?**
   - What we know: Không có gsd-tools insert-phase API. ROADMAP.md là markdown text.
   - What's unclear: Agent tự Write vào ROADMAP.md? Hay chỉ output proposal, user tự copy?
   - Recommendation: Agent dùng Write tool để append fix phases vào ROADMAP.md khi user approve (mode tích hợp). Mode độc lập chỉ in gợi ý trong session dir.

3. **SEC-VERIFY so sánh trước/sau fix thế nào?**
   - What we know: classifyDelta có sẵn. SEC-VERIFY scan lại files đã fix.
   - What's unclear: Output format so sánh cụ thể
   - Recommendation: SEC-VERIFY chạy audit --only {affected_categories} trên files đã fix. So sánh: đếm FAIL trước vs FAIL sau. Thành công = 0 FAIL mới + FAIL cũ → PASS.

## Sources

### Primary (HIGH confidence)
- `workflows/audit.md` — Workflow 9 bước hiện tại, B3 --poc stub, B8 fix routing stub
- `bin/lib/session-delta.js` — classifyDelta, parseFunctionChecklist (internal), appendAuditHistory
- `bin/lib/evidence-protocol.js` — parseEvidence, validateEvidence API
- `bin/lib/resource-config.js` — AGENT_REGISTRY pattern, getAgentConfig destructuring
- `bin/lib/parallel-dispatch.js` — buildScannerPlan, mergeScannerResults
- `references/security-rules.yaml` — 1167 dòng, 13 categories, mỗi cái có fixes[]
- `commands/pd/agents/pd-sec-scanner.md` — Scanner template hiện tại
- `commands/pd/agents/pd-sec-reporter.md` — Reporter template, Attack Chains section đã có

### Secondary (MEDIUM confidence)
- OWASP Testing Guide v4 — Common gadget chain patterns (SQLi→data leak, XSS→session hijack)
- OWASP Top 10 2021 — Severity mapping và attack chain relationships

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tất cả đều dùng modules có sẵn trong project
- Architecture: HIGH — tuân theo established patterns (pure function module, agent template, YAML config)
- Pitfalls: HIGH — phân tích trực tiếp từ source code hiện tại
- Gadget chain templates: MEDIUM — patterns dựa trên OWASP common chains, cần validate thực tế

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable — project-internal patterns)
