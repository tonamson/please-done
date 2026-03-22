# Quy tắc Solidity Smart Contract

> Chỉ chứa quy ước riêng + bảo mật critical. Kiến thức Solidity/OZ chuẩn → tra Context7.

## Phong cách code
- 4 spaces indent (KHÔNG 2 spaces)
- File: PascalCase `.sol` (VD: `MyContract.sol`)
- Giới hạn: mục tiêu 500 dòng, BẮT BUỘC tách >800

## Tiêu đề file
```solidity
// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.3.0
pragma solidity ^0.8.27;
```

## Import & OpenZeppelin
- BẮT BUỘC named import `{}` — CẤM wildcard
- BẮT BUỘC `using SafeERC20 for IERC20` cho mọi token operation
- Token approval: `forceApprove` (OZ v5) thay `safeApprove` (deprecated)
- Signature: `ECDSA` + `MessageHashUtils` từ OZ — KHÔNG tự implement

## Thứ tự cấu trúc contract
Constants → State variables → Structs → Events → Modifiers → Constructor → External/Public → Internal/Private → Admin functions

## Đặt tên
- Constants: `UPPER_SNAKE_CASE` (VD: `DECIMAL_18`, `MAX_SUPPLY`)
- State: `camelCase` | Params: `_camelCase` | Events: `PascalCase`
- Decimal: `uint256 private constant DECIMAL_18 = 1e18`

## NatSpec
- Dùng **tiếng Anh** (hiển thị trong wallets + Etherscan)
- `@title`, `@dev`, `@notice`, `@param` (kèm unit: wei/seconds), `@return`

## Modifier bảo mật
| Function type | `whenNotPaused` | `nonReentrant` |
|---|---|---|
| public + transfer token/ETH | bắt buộc | bắt buộc |
| public + lưu on-chain | bắt buộc | không cần |
| view/pure | không cần | không cần |
| admin không transfer | không cần | không cần |
| admin + transfer | không cần | bắt buộc |

## Sự kiện
- Emit SAU khi state thay đổi, không TRƯỚC

## Bảo mật (BẮT BUỘC)
- **Reentrancy**: Checks-Effects-Interactions — state update TRƯỚC transfer
- **Access**: `onlyOwner`/`onlyRole` cho admin. Check `address(0)` trong constructor + setter
- **Input**: `qty > 0`, `address != address(0)`, array `length > 0 && length <= 50`
- **Token**: `safeTransfer`/`safeTransferFrom`. Check `balanceOf >= amount`
- **Replay**: `transIds` mapping nếu function gọi từ backend
- **Rescue**: BẮT BUỘC `clearUnknownToken` + `rescueETH` (dùng `call{value:}`, KHÔNG `transfer`)
- **ETH**: Không cần nhận ETH → KHÔNG thêm `receive()`/`fallback()`
- **Flash Loan**: CẤM đọc balance trực tiếp làm price input. Dùng TWAP oracle
- **MEV**: Swap → BẮT BUỘC `_minAmountOut`. Auction → commit-reveal. Price-sensitive → deadline
- **Oracle**: Chainlink hoặc TWAP ≥30 phút. KHÔNG spot price AMM. Check staleness
- **CẤM**: `tx.origin` (auth), `selfdestruct` (deprecated), `delegatecall` (trừ proxy), `unchecked` (trừ có proof)
- **DoS**: Loop → giới hạn length. Batch → fail silently per item

## Xác thực chữ ký
- Hash BẮT BUỘC: `block.chainid + address(this) + msg.sender + deadline` + params ngữ cảnh
- `mapping(bytes32 => bool)` track hash — KHÔNG track raw signature
- `hashUsed[hash] = true` TRƯỚC transfer
- `deadline` và `signature` là 2 params CUỐI CÙNG
- EIP-712 khi user ký qua wallet, raw prefix khi backend ký

## Tối ưu Gas
- `immutable` cho vars set 1 lần constructor
- `uint256` thay `uint8/uint16`
- `calldata` thay `memory` external
- `mapping` thay `array` cho lookup
- Custom errors thay `require("string")`

## Build và lint
- Hardhat: `npx hardhat compile` + `npx hardhat test`
- Foundry: `forge build` + `forge test`
- Nhận diện: Glob `**/hardhat.config.*` hoặc `**/foundry.toml`

## Tham khảo chi tiết
Khi cần contract boilerplate hoặc audit → đọc `.planning/docs/solidity/`:
- `templates.md` — Base contract (Ownable + AccessControl), signature verification pattern
- `audit-checklist.md` — Full security audit checklist trước khi deploy
