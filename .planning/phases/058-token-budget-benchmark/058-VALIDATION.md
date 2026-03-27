---
phase: 58
slug: token-budget-benchmark
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-27
---

# Phase 58 — Chiến lược Kiểm chứng

> Hợp đồng kiểm chứng cho từng phase — lấy mẫu phản hồi trong quá trình thực thi.

---

## Hạ tầng Test

| Thuộc tính | Giá trị |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node --test`) + custom scripts |
| **Config file** | Không cần — dùng `node --test` trực tiếp |
| **Lệnh chạy nhanh** | `npm test` |
| **Lệnh chạy đầy đủ** | `npm test && node scripts/count-tokens.js --compare` |
| **Thời gian ước tính** | ~30 giây |

---

## Tần suất lấy mẫu

- **Sau mỗi task commit:** Chạy `npm test`
- **Sau mỗi plan wave:** Chạy `npm test && node scripts/count-tokens.js --compare`
- **Trước `/gsd:verify-work`:** Toàn bộ test suite phải xanh
- **Độ trễ phản hồi tối đa:** 30 giây

---

## Bản đồ Kiểm chứng theo Task

| Task ID | Plan | Wave | Requirement | Loại test | Lệnh tự động | File tồn tại | Trạng thái |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 058-01-01 | 01 | 1 | TOKN-01 | unit | `node --test test/smoke-resource-config.test.js` | ✅ | ⬜ chờ |
| 058-01-02 | 01 | 1 | TOKN-02 | script | `node scripts/count-tokens.js --compare` | ✅ | ⬜ chờ |
| 058-02-01 | 02 | 2 | TOKN-03 | snapshot | `npm test` | ✅ | ⬜ chờ |
| 058-02-02 | 02 | 2 | TOKN-04 | script | `node -e "require('js-yaml').load(require('fs').readFileSync('promptfooconfig.yaml','utf8'));console.log('YAML valid')" && test -d evals/benchmarks` | ✅ | ⬜ chờ |

*Trạng thái: ⬜ chờ · ✅ xanh · ❌ đỏ · ⚠️ không ổn định*

---

## Yêu cầu Wave 0

*Hạ tầng hiện có đã đáp ứng toàn bộ yêu cầu của phase.*

---

## Kiểm chứng Thủ công

| Hành vi | Requirement | Lý do thủ công | Hướng dẫn test |
|----------|-------------|------------|-------------------|
| BENCHMARK_RESULTS.md dễ đọc | TOKN-02 | Chất lượng tài liệu | Xem xét format markdown và độ chính xác dữ liệu |
| Eval pipeline hoạt động | TOKN-04 | Cần ANTHROPIC_API_KEY | Nếu có API key: chạy `npm run eval:full`. Nếu không: verify YAML config và thư mục benchmarks |

---

## Ký xác nhận Kiểm chứng

- [x] Tất cả task có lệnh kiểm chứng tự động hoặc phụ thuộc Wave 0
- [x] Tính liên tục lấy mẫu: không có 3 task liên tiếp thiếu kiểm chứng tự động
- [x] Wave 0 đã phủ tất cả reference thiếu
- [x] Không dùng flag watch-mode
- [x] Độ trễ phản hồi < 30 giây
- [x] `nyquist_compliant: true` đã đặt trong frontmatter

**Phê duyệt:** chờ
