# Quy tắc Solidity Smart Contract

## Code style
- 4 spaces indent (KHÔNG 2 spaces — Solidity convention khác TS/JS)
- File naming: PascalCase cho `.sol` files (VD: `MyContract.sol`, `StakingPool.sol`) — KHÔNG kebab-case
- Giới hạn file: mục tiêu 500 dòng, BẮT BUỘC tách >800 dòng (dùng inheritance hoặc library — ngoại lệ cho general.md 300/500 vì Solidity contracts cần NatSpec + security modifiers + mandatory functions)

## Cấu trúc dự án
- Hardhat: `contracts/`, `scripts/`, `test/`, `hardhat.config.ts`
- Foundry: `src/`, `script/`, `test/`, `foundry.toml`
- Mỗi file `.sol` BẮT BUỘC có SPDX-License-Identifier + pragma solidity

## File header chuẩn
```solidity
// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.3.0
pragma solidity ^0.8.27;
```

## Import — luôn dùng OpenZeppelin, KHÔNG tự viết lại
- **BẮT BUỘC dùng named import `{}`** — CẤM wildcard import
```solidity
// ĐÚNG — named import
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// SAI — wildcard import
import "@openzeppelin/contracts/access/Ownable.sol";
```
- Access control: `Ownable`, `Pausable`, `AccessControl`
- Security: `ReentrancyGuard`
- Token: `IERC20`, `IERC721`, `ERC20Burnable`
- SafeERC20: `using SafeERC20 for IERC20` — BẮT BUỘC cho mọi lệnh transfer/approve token
- Signature: `ECDSA` + `MessageHashUtils` từ OZ — KHÔNG tự implement ecrecover hay manual prefix
- Không import những gì không dùng

## Chọn base contract: Ownable vs AccessControl

| Tiêu chí | Ownable | AccessControl |
|---|---|---|
| Số role cần quản lý | 1 (owner) | 2+ role khác nhau |
| Ví dụ | Simple burn, simple pool | DApp phức tạp: admin + operator + pauser |
| Constructor | `Ownable(initialOwner)` | `_grantRole(DEFAULT_ADMIN_ROLE, ...)` |
| Guard function | `onlyOwner` | `onlyRole(ROLE_NAME)` |

Xem full template tại `.planning/docs/solidity/templates.md → Template 1a / 1b`.

## Contract structure order
1. Constants (`private`, `UPPER_SNAKE_CASE`)
2. State variables + Mappings (public trước, private sau)
3. Structs
4. Events
5. Modifiers (nếu có custom)
7. Constructor
8. External/Public functions
9. Internal/Private functions
10. Admin functions (owner-only cuối cùng)

## Naming conventions
- Constants: `DECIMAL_18`, `MAX_SUPPLY` (UPPER_SNAKE_CASE)
- State variables: `camelCase`, public nếu cần đọc từ ngoài
- Function params: `_camelCase` với underscore prefix
- Events: `PascalCaseEvent`
- Số thập phân: `uint256 private constant DECIMAL_18 = 1e18;` — dùng `50 * DECIMAL_18` thay vì `50000000000000000000`

## SafeERC20 — BẮT BUỘC
```solidity
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
using SafeERC20 for IERC20;
// ĐÚNG: token.safeTransfer / token.safeTransferFrom
// SAI: token.transfer / token.transferFrom (USDT, BNB không revert khi fail)
```

## Security modifiers pattern
| Function type | `whenNotPaused` | `nonReentrant` |
|---|---|---|
| public/external + transfer token/ETH | bắt buộc | bắt buộc |
| public/external + lưu thông tin on-chain | bắt buộc | không cần |
| `view` / `pure` | không cần | không cần |
| admin functions — không transfer (`onlyOwner`/`onlyRole`) | không cần | không cần |
| admin functions + transfer token (`onlyOwner`/`onlyRole`) | không cần | bắt buộc |

## Events: emit SAU khi state thay đổi (không trước)
```solidity
state = newValue;
emit StateChangedEvent(newValue); // SAU — không TRƯỚC
```

## NatSpec comments (required for all contracts)
- NatSpec dùng **tiếng Anh** (ngoại lệ cho rule "JSDoc tiếng Việt" trong general.md — vì NatSpec hiển thị trong wallets + Etherscan, cần quốc tế)
- `@title` — contract level, one line
- `@dev` — developer-facing, technical detail, edge cases
- `@notice` — user-facing, plain English, shown in wallets
- `@param` — one per parameter, always include unit (wei / token units / seconds)
- `@return` — required if function returns a value
- `///` — shorthand cho single-line variable/event docs

## Bảo mật (BẮT BUỘC)
- **Reentrancy**: `nonReentrant` cho mọi function có transfer. Checks-Effects-Interactions (state update TRƯỚC transfer)
- **Access Control**: `onlyOwner` hoặc `onlyRole(ROLE_NAME)` cho mọi hàm admin. Address(0) check cho role address trong constructor + setter. Address(0) check cho `_target`, `_tokenAddress` trong rescue functions
- **Input Validation**: `qty > 0`, `amount > 0`, `address != address(0)`. Array: `length > 0 && length <= 50` (50 là default — tùy chỉnh theo gas limit của chain target nếu cần)
- **Token Approval**: Dùng `forceApprove` (OZ v5) thay vì `safeApprove` (deprecated). `safeTransfer`/`safeTransferFrom` cho transfer
- **Token Balance**: Check `balanceOf(address(this)) >= amount` trước transfer/burn
- **Transaction Replay**: Dùng `transIds` mapping nếu function gọi từ backend
- **Rescue**: BẮT BUỘC có hàm `clearUnknownToken` — rescue token chuyển nhầm vào contract. Nếu contract có `receive()` hoặc có thể nhận ETH → BẮT BUỘC có hàm `rescueETH` dùng `call{value:}` (KHÔNG dùng `transfer` — gas limit 2300 có thể fail)
- **Pause/Unpause**: `pause()` / `unpause()` chỉ `onlyOwner` hoặc `onlyRole(PAUSER_ROLE)`
- **ETH Handling**: Nếu contract KHÔNG cần nhận ETH → KHÔNG thêm `receive()` / `fallback()` (ETH gửi nhầm sẽ revert). Nếu CẦN nhận ETH → thêm `receive() external payable {}` + BẮT BUỘC có hàm rút ETH (dùng `call{value: ...}`, KHÔNG dùng `transfer` — gas limit 2300 có thể fail)
- **Flash Loan Protection**: Nếu contract có logic phụ thuộc vào balance (VD: price oracle từ pool, share calculation) → CẤM đọc balance trực tiếp làm input tính toán mà không có safeguard. Dùng TWAP oracle hoặc check balance trước/sau trong cùng tx. Các function nhạy cảm (mint, swap, redeem) nên có `nonReentrant` chống flash loan callback
- **Frontrunning/MEV**: Cho swap/trade functions → BẮT BUỘC có slippage parameter (`_minAmountOut`). Cho auction/bid → cân nhắc commit-reveal pattern. Cho price-sensitive actions → dùng deadline parameter
- **Oracle**: Nếu dùng external price oracle → dùng Chainlink (hoặc TWAP ≥30 phút). KHÔNG dùng spot price từ AMM pool (dễ bị flash loan manipulate). Check staleness: `require(updatedAt > block.timestamp - MAX_DELAY)`
- **CẤM `tx.origin`**: KHÔNG dùng `tx.origin` cho authentication — dùng `msg.sender`. `tx.origin` dễ bị phishing attack (user gọi contract A, contract A gọi contract B → `tx.origin` = user nhưng `msg.sender` = contract A)
- **Denial of Service (DoS)**: Mọi loop qua array → BẮT BUỘC giới hạn length (xem Input Validation). KHÔNG loop qua unbounded storage array. Khi batch transfer/call → dùng pattern "fail silently per item" thay vì revert toàn bộ (1 recipient fail không chặn cả batch). Lưu ý `call{value:}` tới untrusted address → receiver có thể revert cố ý để chặn execution
- **CẤM `selfdestruct`**: Đã deprecated từ EIP-6780 (Cancun upgrade). Không còn xóa code/storage trừ khi gọi trong cùng transaction tạo contract
- **CẤM `delegatecall`**: Không dùng `delegatecall` trừ khi implement proxy pattern rõ ràng (UUPS/Transparent). `delegatecall` cho phép execute code trong context contract gọi — cực kỳ nguy hiểm nếu target không tin cậy
- **CẤM `unchecked`**: Không dùng `unchecked {}` blocks trừ khi có comment giải thích lý do + manual verification overflow/underflow không thể xảy ra. Solidity ^0.8 auto-protect, `unchecked` bypass protection này

## Signature Verification (off-chain authorization)
- Hash **BẮT BUỘC** include `block.chainid + address(this) + msg.sender + deadline` — các params còn lại (token, amount, trans_id...) tuỳ ngữ cảnh contract
  - `block.chainid` chống cross-chain replay (cùng contract deploy multi-chain)
  - `address(this)` chống cross-contract replay (cùng operator ký nhiều contracts)
  - `msg.sender` chống submit signature của người khác
  - `deadline` chống dùng signature hết hạn
- `_account == msg.sender` — không để user khác submit thay
- Dùng `mapping(bytes32 => bool)` track theo hash (KHÔNG dùng `mapping(bytes => bool)` track theo raw signature — đắt gas + malleability risk)
- `hashUsed[hash] = true` set TRƯỚC khi transfer
- `deadline >= block.timestamp` — signature có thời hạn
- `deadline` và `signature` luôn là 2 params CUỐI CÙNG của function
- Dùng OZ `ECDSA.recover`, KHÔNG tự implement
- **EIP-712**: Khi user ký qua wallet (MetaMask) → BẮT BUỘC dùng OZ `EIP712.sol` (typed structured data, domain separator tự động). Pattern raw `\x19Ethereum Signed Message:\n32` chỉ dùng khi backend ký
- Chi tiết pattern → đọc `.planning/docs/solidity/templates.md → Template 2`

## Gas Optimization
- `immutable` cho variables chỉ set 1 lần trong constructor (VD: token address, operator initial) — rẻ hơn regular state variable
- `uint256` thay vì `uint8/uint16` (EVM pad về 32 bytes)
- Pack struct: đặt variables cùng type cạnh nhau
- `private` rẻ hơn `public` (không gen getter)
- `calldata` thay `memory` cho array params trong external functions
- Cache array length: `uint256 len = arr.length`
- `++i` thay `i++`
- `mapping` rẻ hơn `array` khi cần lookup by key
- Custom errors rẻ gas hơn `require(condition, "string")` (~50%). Cân nhắc dùng `error InsufficientBalance(uint256 requested, uint256 available)` cho contracts production

## Build & Lint
- Hardhat: `npx hardhat compile` + `npx hardhat test`
- Foundry: `forge build` + `forge test`
- Solhint (nếu có): `npx solhint 'contracts/**/*.sol'`
- Detect thư mục: Glob `**/hardhat.config.*` hoặc `**/foundry.toml` → Solidity project root

## Tham khảo chi tiết
Khi cần patterns phức tạp → đọc `.planning/docs/solidity/`:
- `templates.md` — Base contract boilerplate (Ownable + AccessControl), signature verification pattern
- `audit-checklist.md` — Full security audit checklist trước khi deploy production
