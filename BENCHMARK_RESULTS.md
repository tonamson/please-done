# Benchmark Results

**Ngay capture:** 2026-03-27
**Tool:** `scripts/count-tokens.js` (js-tiktoken, gpt-4o encoding)
**So sanh:** v1.0 baseline (2026-03-22) vs v5.0 post-optimization (2026-03-27)

## Before/After Summary

| Directory     | Before (v1.0) | After (v5.0) | Delta    | Change  |
|---------------|---------------|--------------|----------|---------|
| commands/pd   | 11,187        | 10,542       | -645     | -5.8%   |
| workflows     | 51,162        | 49,395       | -1,767   | -3.5%   |
| references    | 14,036        | 18,473       | +4,437   | +31.6%  |
| templates     | 8,514         | 7,895        | -619     | -7.3%   |
| **TOTAL**     | **84,899**    | **86,305**   | **+1,406** | **+1.7%** |

**Ghi chu:**
- commands/pd giam 645 tokens (-5.8%) nho toi uu noi dung cac lenh cu, du them 2 lenh moi (audit, research)
- workflows giam 1,767 tokens (-3.5%) nho reference dedup va DRY optimization (Phase 57)
- references tang 4,437 tokens (+31.6%) do gop verification-patterns.md + plan-checker.md thanh verification.md (5,538 tokens) va them context7-pipeline.md, mermaid-rules.md
- templates giam 619 tokens (-7.3%) nho toi uu noi dung va cau truc
- Files tang tu 39 len 48 (+9 files moi cho audit, research, security features)

## Per-Tier Budget Compliance

| Tier      | Budget  | Workflow dien hinh                              | Token cao nhat | Trang thai |
|-----------|---------|------------------------------------------------|----------------|------------|
| Scout     | 4,000   | scan.md (1,938), init.md (2,241)               | 2,241          | OK         |
| Builder   | 8,000   | fix-bug.md (6,273), test.md (3,503), write-code.md (6,970) | 6,970 | OK         |
| Architect | 12,000  | plan.md (7,305), new-milestone.md (4,296), write-code.md (6,970) | 7,305 | OK         |

**Phan tich:**
- **Scout (<=4,000):** Ca 2 workflow chinh (scan, init) deu duoi budget. Du room ~1,759 tokens.
- **Builder (<=8,000):** Workflow lon nhat (write-code.md 6,970) van duoi budget. Du room ~1,030 tokens. Luu y: fix-bug.md (6,273) + required_reading co the vuot khi cong references.
- **Architect (<=12,000):** Workflow lon nhat (plan.md 7,305) du room ~4,695 tokens. Ca khi cong verification.md (5,538) van trong budget cho cac session phuc tap.

## Token Distribution

| Directory     | Files | Tokens  | % Tong |
|---------------|-------|---------|--------|
| commands/pd   | 14    | 10,542  | 12.2%  |
| workflows     | 13    | 49,395  | 57.2%  |
| references    | 9     | 18,473  | 21.4%  |
| templates     | 12    | 7,895   | 9.1%   |
| **TOTAL**     | **48**| **86,305** | **100%** |

**Nhan xet:** Workflows chiem 57.2% token — la muc tieu chinh cho bat ky toi uu nao tiep theo.

## Top 5 Files theo Token

| File                          | Tokens | % Tong |
|-------------------------------|--------|--------|
| workflows/plan.md             | 7,305  | 8.5%   |
| workflows/write-code.md       | 6,970  | 8.1%   |
| workflows/fix-bug.md          | 6,273  | 7.3%   |
| workflows/fix-bug-v1.5.md     | 5,821  | 6.7%   |
| references/verification.md    | 5,538  | 6.4%   |

## Baseline History

| Version | Ngay       | Files | Tokens  | Ghi chu                          |
|---------|------------|-------|---------|----------------------------------|
| v1.0    | 2026-03-22 | 39    | 84,899  | Baseline goc truoc optimization  |
| v5.0    | 2026-03-27 | 48    | 86,305  | Post reference dedup + runtime DRY |

**Tang rong:** +1,406 tokens (+1.7%) voi 9 files moi — trung binh moi file cu giam ~580 tokens nho optimization.
