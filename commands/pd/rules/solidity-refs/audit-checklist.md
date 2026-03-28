# Solidity Audit Checklist

Full checklist for reviewing contracts before production deployment.

---

## 1. Reentrancy Attacks

- [ ] Do all `public`/`external` functions with **token or ETH transfers** have `nonReentrant`?
  ```solidity
  // REQUIRED — for any safeTransfer / safeTransferFrom / call{value:} statement
  function withdraw(uint256 _amount) public whenNotPaused nonReentrant {
      token.safeTransfer(msg.sender, _amount);
  }

  function burnAndReward(...) public whenNotPaused nonReentrant {
      token.burn(_amount);
      rewardToken.safeTransfer(msg.sender, reward);
  }

  function rescueETH(address payable _target, uint256 _amount) public onlyOwner nonReentrant {
      (bool success, ) = _target.call{value: _amount}("");
      require(success, "ETH transfer failed");
  }
  ```
- [ ] Is the Checks-Effects-Interactions pattern followed?
  ```solidity
  // CORRECT — state update BEFORE, transfer AFTER
  balances[msg.sender] -= amount;        // effect first
  token.safeTransfer(msg.sender, amount); // interaction after

  // WRONG — vulnerable to reentrancy
  token.safeTransfer(msg.sender, amount); // interaction first
  balances[msg.sender] -= amount;        // effect after
  ```
- [ ] Read-only functions (`view`/`pure`) do not need `nonReentrant` — only apply to functions that write state + transfer

## 2. Access Control

- [ ] Do all state-changing functions have appropriate modifiers?
- [ ] Are there any admin functions that are public without a modifier?
- [ ] Is `tx.origin` not used for authentication? (use `msg.sender` — `tx.origin` is vulnerable to phishing attacks)
- [ ] Does the constructor correctly initialize the owner: `Ownable(initialOwner)` (pass parameter, DO NOT hardcode `msg.sender`)?
- [ ] Is role rotation secured? Ownable: `transferOwnership` owner-only. AccessControl: `grantRole`/`revokeRole` `DEFAULT_ADMIN_ROLE` holder only?
- [ ] Are there address(0) checks on critical role addresses?

## 3. Integer Arithmetic

- [ ] Solidity ^0.8.x: overflow/underflow auto-reverts (OK)
- [ ] If using `unchecked {}`: manually verified?
- [ ] Division: checked for divide by zero?
- [ ] Precision loss: multiply before dividing?
  ```solidity
  // CORRECT: (a * b) / c
  // WRONG:  a / c * b  — loses precision
  ```

## 4. Logic Errors

- [ ] Are require conditions correct (> vs >= vs ==)?
- [ ] Array index out of bounds?
- [ ] Does mapping default value (0, false, address(0)) cause logic errors?
- [ ] Loop: can it be blocked by gas if array is too long?

## 5. Token Safety

- [ ] Is `SafeERC20` imported and `using SafeERC20 for IERC20` declared?
- [ ] All `transfer` calls → `safeTransfer`?
- [ ] All `transferFrom` calls → `safeTransferFrom`?
- [ ] All `approve` calls → `forceApprove`? (OZ v5 deprecated `safeApprove`)
  ```solidity
  // REQUIRED — applies to all ERC20 including self-deployed tokens
  import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
  import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

  contract Foo {
      using SafeERC20 for IERC20;

      // CORRECT
      token.safeTransfer(_to, _amount);
      token.safeTransferFrom(msg.sender, address(this), _amount);

      // WRONG — some tokens (USDT, BNB) do not revert on failure
      token.transfer(_to, _amount);
      token.transferFrom(msg.sender, address(this), _amount);
  }
  ```
- [ ] Can the contract receive ETH? Does it need `receive()` or `fallback()`?

## 6. Signature Verification

Applies when the contract uses off-chain signatures to authorize actions (claim, withdraw...).

### 6a. Hash binding (REQUIRED)
- [ ] Does the hash **MUST** include `block.chainid`? (prevents cross-chain replay — same contract deployed multi-chain)
- [ ] Does the hash **MUST** include `address(this)`? (prevents cross-contract replay — same operator signs multiple contracts)
- [ ] Does the hash include `msg.sender`? (missing → anyone can submit someone else's signature)
- [ ] Does the hash include `deadline`? (missing → signature valid forever)
- [ ] Does the hash include enough params to bind action to context? (token_address, amount, trans_id, ...)

### 6b. Verification logic
- [ ] `require(_account == msg.sender)` — prevents other users from submitting on behalf?
- [ ] Uses `mapping(bytes32 => bool) hashUsed` to track by hash? (DO NOT use `mapping(bytes => bool)` tracking raw signature — expensive gas + signature malleability risk)
- [ ] `hashUsed[hash] = true` set **before** `safeTransfer` (checks-effects-interactions)?
- [ ] `require(deadline >= block.timestamp)` — prevents using expired signatures?
- [ ] `operator != address(0)` checked in verify function?
- [ ] `setOperator` callable only by admin?
- [ ] Uses `ECDSA.recover` from OZ, not self-implemented?
  ```solidity
  // CORRECT — uses OZ ECDSA + MessageHashUtils
  using ECDSA for bytes32;
  using MessageHashUtils for bytes32;
  bytes32 signedHash = _hash.toEthSignedMessageHash();
  return signedHash.recover(_signature) == operator;

  // WRONG — self-implemented ecrecover or manual abi.encodePacked prefix
  ```
- [ ] `deadline` and `signature` are the **last two** function parameters?
  ```solidity
  // CORRECT
  function claimBonus(..., uint256 deadline, bytes memory signature)

  // WRONG — violates parameter order convention
  function claimBonus(bytes memory signature, ..., uint256 deadline)
  ```

### 6c. EIP-712 check
- [ ] If **user signs via wallet** (MetaMask) → uses OZ `EIP712.sol` (typed structured data)?
  - Raw `\x19Ethereum Signed Message:\n32` only when backend signs
  - EIP-712 automatically handles domain separator (chainid + verifyingContract)

### 6d. Replay & Front-running
- [ ] If backend calls contract: has `trans_id` deduplication?
- [ ] If using signature: has deadline?
- [ ] Can sensitive actions be front-run?
- [ ] Do swap/trade functions have slippage parameter (`_minAmountOut`)?
- [ ] Do price-sensitive actions have deadline parameter?
- [ ] Do auction/bid functions use commit-reveal pattern? (prevents frontrunning bid values)

### 6e. Flash Loan Protection
- [ ] Does the contract have logic depending on balance (price oracle, share calculation)?
- [ ] If yes → DO NOT read balance directly as calculation input. Use TWAP oracle or time-delayed mechanism
- [ ] Do sensitive functions (mint, swap, redeem) have `nonReentrant`?

### 6f. Oracle Safety
- [ ] If using external price oracle → uses Chainlink or TWAP ≥30 min?
- [ ] NOT using spot price from AMM pool (vulnerable to flash loan manipulation)?
- [ ] Staleness check: `require(updatedAt > block.timestamp - MAX_DELAY)`?

## 7. Pause & Emergency

- [ ] Does the contract have `Pausable`?
- [ ] Do all `public`/`external` functions related to **actions** have `whenNotPaused`?
  - Action = transfer funds, burn tokens, mint, stake, claim, store data on-chain
  - Rule: if function changes state or touches tokens → `whenNotPaused` required
  ```solidity
  // REQUIRED when public + has action
  function stake(uint256 _amount) public whenNotPaused nonReentrant { ... }
  function burn(uint256 _amount) public whenNotPaused nonReentrant { ... }
  function saveRecord(...) public whenNotPaused { ... }

  // Not needed — read-only
  function getPrice() public view returns (uint256) { ... }
  ```
- [ ] Admin functions (`onlyOwner`) **do NOT** need `whenNotPaused` — must remain callable during emergency for fixes
- [ ] `pause()` / `unpause()` restricted to `onlyOwner` or `onlyRole(PAUSER_ROLE)`?

## 8. Upgrade & Migration

- [ ] Is the contract upgradeable? (Proxy pattern)
- [ ] If not: data migration plan if contract replacement needed?
- [ ] Does the constructor set correct initial state?

## 9. Gas Limit & Array Validation

- [ ] Do all functions accepting array input validate length **> 0 and <= 50**?
  ```solidity
  // REQUIRED — 50 is default, adjust per gas limit if use case requires (e.g.: batch airdrop)
  require(_arr.length > 0 && _arr.length <= 50, "Array length must be between 1 and 50");
  ```
- [ ] If multiple arrays at once: check lengths match?
  ```solidity
  require(_ids.length == _prices.length && _ids.length == _status.length, "Array length mismatch");
  ```
- [ ] Any other loops that could run unbounded? (DoS vector)

### 9a. Denial of Service (DoS)
- [ ] Do all loops over arrays have length limits (> 0 && <= 50)?
- [ ] No loops over unbounded storage arrays (e.g.: `for (i = 0; i < allUsers.length; ...)`)? Use pagination or off-chain computation
- [ ] Batch operations (transfer/call to multiple recipients) — does 1 recipient failure block the entire batch?
  ```solidity
  // WRONG — 1 recipient revert → blocks all
  for (uint256 i = 0; i < recipients.length; ++i) {
      token.safeTransfer(recipients[i], amounts[i]);
  }

  // CORRECT — fail silently per item, emit event for failed items
  for (uint256 i = 0; i < recipients.length; ++i) {
      (bool success, ) = recipients[i].call{value: amounts[i]}("");
      if (!success) emit TransferFailed(recipients[i], amounts[i]);
  }
  ```
- [ ] `call{value:}` to untrusted address — can receiver intentionally revert? (e.g.: malicious fallback blocking withdrawal)
- [ ] Function has external call → accounted for external contract consuming all gas?

## 10. Events

- [ ] Do all important state changes emit events?
- [ ] Are events emitted **AFTER** state changes, not before? (state update first, emit after)
- [ ] Are event params sufficient to reconstruct history off-chain?
- [ ] `indexed` on fields commonly filtered (address, id)?

## 11. Hardcoded Values

- [ ] Hardcoded token address: is there a setter function? (if needed)
- [ ] Thresholds/prices: are there setter functions?
- [ ] Any unexplained magic numbers? (use constants instead)

## 12. Must-have Functions Checklist

- [ ] `clearUnknownToken` — rescue mistakenly-sent tokens
- [ ] `rescueETH` — rescue ETH (if contract has `receive()` or receives ETH via selfdestruct/coinbase). Use `call{value:}`, NOT `transfer`
- [ ] `pause` / `unpause` — emergency stop
- [ ] Role rotation: `transferOwnership` (Ownable) or `grantRole`/`revokeRole` (AccessControl)
- [ ] Setter for config (price, status...) — do not hardcode permanently

---

## 13. Dangerous Patterns

- [ ] Not using `delegatecall` except for proxy pattern (UUPS/Transparent)?
- [ ] Not using `unchecked {}` unless comment verifies overflow is impossible?
- [ ] Not using `selfdestruct`? (deprecated EIP-6780)
- [ ] Not using `tx.origin` for authentication?

## 14. Gas Optimization Review

- [ ] Variables set only once in constructor → `immutable`?
- [ ] Using `uint256` instead of `uint8/uint16` (EVM pads 32 bytes)?
- [ ] Struct fields packed (same types adjacent)?
- [ ] External function array params use `calldata` instead of `memory`?
- [ ] Loops: cache array length, `++i` instead of `i++`?
- [ ] Consider custom errors instead of `require(cond, "string")`?

## Pre-deploy Checklist

- [ ] Tested locally (Hardhat/Foundry)?
- [ ] Tested on testnet (Sepolia/Amoy)?
- [ ] Source code verified on Etherscan?
- [ ] Correct role addresses set (not using msg.sender in production)?
- [ ] Multisig for owner if large protocol?
- [ ] Third-party audit if TVL > $100k?
