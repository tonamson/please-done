<!-- Translated from docs/skills/audit.md -->
<!-- Source version: 5.0.0 -->
<!-- Translation date: 2026-04-06 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](audit.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](audit.vi.md)

# Skill: audit

_Subtitle: OWASP Top 10 và audit bảo mật tuân thủ PTES._

## Mục đích

Thực hiện audit bảo mật và chất lượng code sử dụng các hướng dẫn OWASP, tùy chọn PTES (Penetration Testing Execution Standard) reconnaissance, và best practices để xác định các lỗ hổng, anti-patterns, và vấn đề về khả năng bảo trì.

## Khi nào dùng

- **Security review:** Đánh giá bảo mật trước khi release trước khi ship
- **Code quality:** Đánh giá chất lượng code và khả năng bảo trì
- **Compliance:** Đáp ứng các yêu cầu compliance về bảo mật
- **Regular maintenance:** Các chu kỳ audit định kỳ cho các dự án đang chạy
- **Post-incident:** Sau các sự cố bảo mật để xác định các lỗ hổng
- **PTES / Red Team:** Khi bạn cần reconnaissance theo tiers trước hoặc cùng với SAST

## Điều kiện tiên quyết

- [ ] Codebase được truy cập với quyền đọc
- [ ] Thư mục `.planning/` đã được khởi tạo
- [ ] Hiểu về phạm vi audit
- [ ] Optional: Các khu vực cụ thể cần tập trung

## Lệnh cơ bản

```
/pd:audit
```

Mặc định: Quick SAST (workflow Steps 2–10) — tương thích ngược với behavior trước PTES.

## PTES Workflow Support

Audit skill hỗ trợ PTES-aligned workflows với optional **Step 0** reconnaissance phase trước standard scanner pipeline.

### Command Flags

| Flag | Tier | Token budget | Description |
|------|------|----------------|-------------|
| _(none)_ | Quick SAST | 0 | Default audit (Steps 2–10, no Step 0) |
| `--recon-light` | FREE | 0 | Code-only reconnaissance |
| `--recon` | STANDARD | ~2000 | Reconnaissance + AI analysis |
| `--recon-full` | DEEP | ~6000 | Deep recon + taint-style analysis |
| `--redteam` | RED TEAM | ~8000 | Full Red Team TTPs |
| `--poc` | — | — | DAST / POC sections in evidence (combinable with recon) |

**Priority:** `--redteam` > `--recon-full` > `--recon` > `--recon-light`.

### PTES Phases (conceptual)

- **Phase 1:** Pre-engagement (scope, rules of engagement) — manual / project policy
- **Phase 2:** Intelligence gathering — **workflow Step 0** when recon/PTES flags apply
- **Phase 3:** Vulnerability analysis — SAST (scanner waves)
- **Phase 4:** Exploitation / verification — DAST when `--poc` or `--redteam` drives POC content

### Token Optimization

Reconnaissance results được cached với key derived from **git commit + tracked file list** (see `bin/lib/recon-cache.js`):

- Cache directory: `.planning/recon-cache/{md5 key}.json`
- Invalidation khi repo state thay đổi (new commit or file set)
- LRU eviction (max 50 JSON entries)
- On hit: `[Token Save] Reusing cached recon (0 AI tokens)`

## OSINT Support

Audit skill hỗ trợ optional OSINT (Open Source Intelligence) gathering cho external reconnaissance.

### OSINT Flags

| Flag | Description |
|------|-------------|
| `--osint` | Quick OSINT scan (passive reconnaissance) |
| `--osint-full` | Comprehensive OSINT với all available sources |
| `--osint-output` | Output format: `json`, `table`, hoặc `markdown` |
| `--osint-timeout` | Timeout per source in seconds (default: 10) |

### OSINT Examples

```bash
# Quick OSINT scan
/pd:audit --osint

# Comprehensive OSINT với JSON output
/pd:audit --osint-full --osint-output json

# OSINT với custom timeout
/pd:audit --osint --osint-timeout 30
```

## What It Does

1. Tùy chọn chạy PTES Step 0 (recon) khi flags yêu cầu
2. Quét code cho security vulnerabilities (13 OWASP-aligned categories)
3. Kiểm tra theo OWASP Top 10 categories
4. Consolidates evidence và produces **SECURITY_REPORT.md** (not AUDIT_REPORT.md) per workflow
5. Ưu tiên findings theo severity
6. Đề xuất remediation paths (và fix routing in integrated mode)

## Common Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--full` | All 13 categories | `/pd:audit --full` |
| `--only` | Subset of categories | `/pd:audit --only sql-injection,xss` |
| `--recon-light` | Code-only reconnaissance (free tier) | `/pd:audit --recon-light` |
| `--recon` | Standard recon + SAST | `/pd:audit --recon` |
| `--recon-full` | Deep recon + taint analysis | `/pd:audit --recon-full` |
| `--redteam` | Full red-team style run | `/pd:audit --redteam` |
| `--poc` | POC sections in evidence | `/pd:audit --poc` |
| `--osint` | Quick OSINT scan | `/pd:audit --osint` |
| `--osint-full` | Comprehensive OSINT | `/pd:audit --osint-full` |

## PTES Examples

```bash
# Standard reconnaissance + SAST
/pd:audit --recon

# Code-only recon (0 AI tokens for recon cache miss path — tier free)
/pd:audit --recon-light

# Deep reconnaissance với taint-style analysis
/pd:audit --recon-full

# Full Red Team assessment
/pd:audit --redteam

# Reconnaissance + DAST-style POC sections
/pd:audit --recon --poc

# Quick OSINT scan
/pd:audit --osint

# Comprehensive OSINT với JSON output
/pd:audit --osint-full --osint-output json
```

## Xem thêm

- [fix-bug](fix-bug.md) — Sửa các phát hiện từ audit
- [test](test.md) — Xác minh fixes pass tests
- [research](research.md) — Nghiên cứu các security patterns
