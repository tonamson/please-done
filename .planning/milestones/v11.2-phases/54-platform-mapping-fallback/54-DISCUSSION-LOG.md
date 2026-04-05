# Phase 54: Platform Mapping & Fallback - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 54-platform-mapping-fallback
**Areas discussed:** Platform model mapping, Vị trí code mới, Fallback API design, Test coverage

---

## Platform Model Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| 5 platforms hiện có | claude, codex, gemini, opencode, copilot — bỏ qua Cursor/Windsurf | |
| 4 platforms theo ROADMAP | Claude Code, Gemini CLI, Cursor/Windsurf, Copilot | |
| Toàn bộ | Tất cả platforms hiện có + Cursor/Windsurf | ✓ |

**User's choice:** Toàn bộ luôn — tất cả platforms đều cần mapping, kể cả Cursor/Windsurf
**Notes:** User muốn coverage đầy đủ

---

| Option | Description | Selected |
|--------|-------------|----------|
| Model names thực tế | Map cụ thể per platform | |
| Generic + runtime resolve | Giữ haiku/sonnet/opus, mỗi platform tự map | ✓ |

**User's choice:** Generic + runtime resolve
**Notes:** Linh hoạt hơn, platform tự biết model names

---

| Option | Description | Selected |
|--------|-------------|----------|
| Bạn quyết định | Claude tự research model names | ✓ |
| Tôi sẽ chỉ định | User cung cấp danh sách | |

**User's choice:** Claude quyết định model names trong giai đoạn research

---

| Option | Description | Selected |
|--------|-------------|----------|
| Thêm vào platforms.js | Full platform entries mới | ✓ |
| Chỉ thêm model map | Chỉ PLATFORM_MODEL_MAP | |

**User's choice:** Thêm Cursor/Windsurf vào platforms.js như full platform entries

---

## Vị trí Code Mới

| Option | Description | Selected |
|--------|-------------|----------|
| resource-config.js | Gần TIER_MAP, getModelForTier() | ✓ |
| platforms.js | Gần platform definitions | |
| File mới riêng | platform-models.js | |

**User's choice:** resource-config.js
**Notes:** Gần TIER_MAP, mở rộng resolve logic tại chỗ

---

## Fallback API Design

| Option | Description | Selected |
|--------|-------------|----------|
| Mở rộng getModelForTier | Thêm param platform? | ✓ |
| Hàm mới resolveModelForPlatform | Hàm riêng | |

**User's choice:** Mở rộng getModelForTier(tier, platform?)
**Notes:** Backward compatible — không truyền platform = generic

---

| Option | Description | Selected |
|--------|-------------|----------|
| Silent downgrade | Tự động hạ tier, trả fallback=true | ✓ |
| Warning + downgrade | console.warn() + hạ tier | |
| Throw error | Bắt caller xử lý | |

**User's choice:** Silent downgrade
**Notes:** Workflow không bao giờ đứt gãy

---

## Test Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Mở rộng resource-config.test.js | Thêm cases vào file hiện có | |
| File test riêng platform-models.test.js | Tách biệt | ✓ |

**User's choice:** File test riêng platform-models.test.js

---

| Option | Description | Selected |
|--------|-------------|----------|
| Có, bắt buộc | Test backward compat | ✓ |
| Không cần | Existing tests đã cover | |

**User's choice:** Backward compatibility test bắt buộc

---

## Claude's Discretion

- Model names cụ thể cho từng platform
- Cursor/Windsurf platform config details
- Return object structure khi có fallback

## Deferred Ideas

None
