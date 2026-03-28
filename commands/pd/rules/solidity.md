# Solidity Smart Contract Rules

> Contains project-specific conventions + critical security only. Standard Solidity/OZ knowledge → look up via Context7.

## Code style
- 4 spaces indent (NOT 2 spaces)
- File: PascalCase `.sol` (e.g.: `MyContract.sol`)
- Limits: target 500 lines, MUST split >800

## File header
```solidity
// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.3.0
pragma solidity ^0.8.27;
```

## Import & OpenZeppelin
- MUST use named import `{}` — FORBIDDEN wildcard
- MUST use `using SafeERC20 for IERC20` for all token operations
- Token approval: `forceApprove` (OZ v5) replaces `safeApprove` (deprecated)
- Signature: `ECDSA` + `MessageHashUtils` from OZ — DO NOT self-implement

## Contract structure order
Constants → State variables → Structs → Events → Modifiers → Constructor → External/Public → Internal/Private → Admin functions

## Naming
- Constants: `UPPER_SNAKE_CASE` (e.g.: `DECIMAL_18`, `MAX_SUPPLY`)
- State: `camelCase` | Params: `_camelCase` | Events: `PascalCase`
- Decimal: `uint256 private constant DECIMAL_18 = 1e18`

## NatSpec
- Use **English** (displayed in wallets + Etherscan)
- `@title`, `@dev`, `@notice`, `@param` (include unit: wei/seconds), `@return`

## Security modifiers
| Function type | `whenNotPaused` | `nonReentrant` |
|---|---|---|
| public + transfer token/ETH | required | required |
| public + store on-chain | required | not needed |
| view/pure | not needed | not needed |
| admin without transfer | not needed | not needed |
| admin + transfer | not needed | required |

## Events
- Emit AFTER state changes, not BEFORE

## Security (REQUIRED)
- **Reentrancy**: Checks-Effects-Interactions — state update BEFORE transfer
- **Access**: `onlyOwner`/`onlyRole` for admin. Check `address(0)` in constructor + setter
- **Input**: `qty > 0`, `address != address(0)`, array `length > 0 && length <= 50`
- **Token**: `safeTransfer`/`safeTransferFrom`. Check `balanceOf >= amount`
- **Replay**: `transIds` mapping if function is called from backend
- **Rescue**: MUST have `clearUnknownToken` + `rescueETH` (use `call{value:}`, NOT `transfer`)
- **ETH**: If no need to receive ETH → DO NOT add `receive()`/`fallback()`
- **Flash Loan**: FORBIDDEN reading balance directly as price input. Use TWAP oracle
- **MEV**: Swap → MUST have `_minAmountOut`. Auction → commit-reveal. Price-sensitive → deadline
- **Oracle**: Chainlink or TWAP ≥30 min. NOT spot price AMM. Check staleness
- **FORBIDDEN**: `tx.origin` (auth), `selfdestruct` (deprecated), `delegatecall` (except proxy), `unchecked` (except with proof)
- **DoS**: Loop → limit length. Batch → fail silently per item

## Signature verification
- Hash MUST include: `block.chainid + address(this) + msg.sender + deadline` + context-specific params
- `mapping(bytes32 => bool)` to track hash — DO NOT track raw signature
- `hashUsed[hash] = true` BEFORE transfer
- `deadline` and `signature` are the LAST two parameters
- EIP-712 when user signs via wallet, raw prefix when backend signs

## Gas optimization
- `immutable` for vars set once in constructor
- `uint256` instead of `uint8/uint16`
- `calldata` instead of `memory` for external
- `mapping` instead of `array` for lookup
- Custom errors instead of `require("string")`

## Build and lint
- Hardhat: `npx hardhat compile` + `npx hardhat test`
- Foundry: `forge build` + `forge test`
- Detection: Glob `**/hardhat.config.*` or `**/foundry.toml`

## Detailed references
When contract boilerplate or audit is needed → read `.planning/docs/solidity/`:
- `templates.md` — Base contract (Ownable + AccessControl), signature verification pattern
- `audit-checklist.md` — Full security audit checklist before deployment
