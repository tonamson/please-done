# Solidity Audit Checklist

Full checklist khi review contract trước khi deploy production.

---

## 1. Reentrancy Attacks

- [ ] Mọi `public`/`external` function có lệnh **transfer token hoặc ETH** đều có `nonReentrant`?
  ```solidity
  // BẮT BUỘC — bất kỳ lệnh safeTransfer / safeTransferFrom / call{value:} nào
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
- [ ] Checks-Effects-Interactions pattern được tuân theo?
  ```solidity
  // ĐÚNG — state update TRƯỚC, transfer SAU
  balances[msg.sender] -= amount;        // effect trước
  token.safeTransfer(msg.sender, amount); // interaction sau

  // SAI — dễ bị reentrancy
  token.safeTransfer(msg.sender, amount); // interaction trước
  balances[msg.sender] -= amount;        // effect sau
  ```
- [ ] Function chỉ đọc (`view`/`pure`) không cần `nonReentrant` — chỉ apply cho functions write state + transfer

## 2. Access Control

- [ ] Mọi hàm thay đổi state có modifier phù hợp?
- [ ] Không có hàm admin nào public mà không có modifier?
- [ ] Không dùng `tx.origin` cho authentication? (dùng `msg.sender` — `tx.origin` dễ bị phishing attack)
- [ ] Constructor khởi tạo đúng owner: `Ownable(initialOwner)` (truyền param, KHÔNG hardcode `msg.sender`)?
- [ ] Role rotation secured? Ownable: `transferOwnership` chỉ owner. AccessControl: `grantRole`/`revokeRole` chỉ `DEFAULT_ADMIN_ROLE` holder?
- [ ] Address(0) check trên các role address quan trọng?

## 3. Integer Arithmetic

- [ ] Solidity ^0.8.x: overflow/underflow tự revert (OK)
- [ ] Nếu dùng `unchecked {}`: đã verify manually?
- [ ] Phép chia: kiểm tra chia cho 0?
- [ ] Precision loss: nhân trước chia sau?
  ```solidity
  // ĐÚNG: (a * b) / c
  // SAI:  a / c * b  — mất precision
  ```

## 4. Logic Errors

- [ ] Điều kiện require đúng (> vs >= vs ==)?
- [ ] Array index out of bounds?
- [ ] Mapping default value (0, false, address(0)) có gây lỗi logic không?
- [ ] Loop: có thể bị block gas nếu array quá dài?

## 5. Token Safety

- [ ] Import `SafeERC20` và khai báo `using SafeERC20 for IERC20`?
- [ ] Tất cả lệnh `transfer` → `safeTransfer`?
- [ ] Tất cả lệnh `transferFrom` → `safeTransferFrom`?
- [ ] Tất cả lệnh `approve` → `forceApprove`? (OZ v5 đã deprecate `safeApprove`)
  ```solidity
  // BẮT BUỘC — áp dụng cho mọi ERC20 kể cả token tự deploy
  import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
  import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

  contract Foo {
      using SafeERC20 for IERC20;

      // ĐÚNG
      token.safeTransfer(_to, _amount);
      token.safeTransferFrom(msg.sender, address(this), _amount);

      // SAI — một số token (USDT, BNB) không revert khi fail
      token.transfer(_to, _amount);
      token.transferFrom(msg.sender, address(this), _amount);
  }
  ```
- [ ] Contract có thể nhận ETH không? Cần `receive()` hay `fallback()`?

## 6. Signature Verification

Áp dụng khi contract dùng off-chain signature để authorize action (claim, withdraw...).

### 6a. Hash binding (BẮT BUỘC)
- [ ] Hash **BẮT BUỘC** include `block.chainid`? (chống cross-chain replay — cùng contract deploy multi-chain)
- [ ] Hash **BẮT BUỘC** include `address(this)`? (chống cross-contract replay — cùng operator ký nhiều contracts)
- [ ] Hash include `msg.sender`? (thiếu → bất kỳ ai submit được signature của người khác)
- [ ] Hash include `deadline`? (thiếu → signature valid mãi mãi)
- [ ] Hash include đủ params bind action theo ngữ cảnh? (token_address, amount, trans_id, ...)

### 6b. Verification logic
- [ ] `require(_account == msg.sender)` — không để user khác submit thay?
- [ ] Dùng `mapping(bytes32 => bool) hashUsed` track theo hash? (KHÔNG dùng `mapping(bytes => bool)` track raw signature — đắt gas + signature malleability risk)
- [ ] `hashUsed[hash] = true` set **trước** khi `safeTransfer` (checks-effects-interactions)?
- [ ] `require(deadline >= block.timestamp)` — chống dùng signature hết hạn?
- [ ] `operator != address(0)` được check trong verify function?
- [ ] `setOperator` chỉ admin mới gọi được?
- [ ] Dùng `ECDSA.recover` từ OZ, không tự implement?
  ```solidity
  // ĐÚNG — dùng OZ ECDSA + MessageHashUtils
  using ECDSA for bytes32;
  using MessageHashUtils for bytes32;
  bytes32 signedHash = _hash.toEthSignedMessageHash();
  return signedHash.recover(_signature) == operator;

  // SAI — tự implement ecrecover hoặc manual abi.encodePacked prefix
  ```
- [ ] `deadline` và `signature` là 2 tham số **cuối cùng** của function?
  ```solidity
  // ĐÚNG
  function claimBonus(..., uint256 deadline, bytes memory signature)

  // SAI — sai thứ tự convention
  function claimBonus(bytes memory signature, ..., uint256 deadline)
  ```

### 6c. EIP-712 check
- [ ] Nếu **user ký qua wallet** (MetaMask) → dùng OZ `EIP712.sol` (typed structured data)?
  - Raw `\x19Ethereum Signed Message:\n32` chỉ dùng khi backend ký
  - EIP-712 tự động xử lý domain separator (chainid + verifyingContract)

### 6d. Replay & Front-running
- [ ] Nếu backend gọi contract: có `trans_id` deduplication?
- [ ] Nếu dùng signature: có deadline?
- [ ] Các action nhạy cảm có bị front-run không?
- [ ] Swap/trade functions có slippage parameter (`_minAmountOut`)?
- [ ] Price-sensitive actions có deadline parameter?

### 6e. Flash Loan Protection
- [ ] Contract có logic phụ thuộc vào balance (price oracle, share calculation)?
- [ ] Nếu có → KHÔNG đọc balance trực tiếp làm input tính toán. Dùng TWAP oracle hoặc time-delayed mechanism
- [ ] Các function nhạy cảm (mint, swap, redeem) có `nonReentrant`?

### 6f. Oracle Safety
- [ ] Nếu dùng external price oracle → dùng Chainlink hoặc TWAP ≥30 phút?
- [ ] KHÔNG dùng spot price từ AMM pool (dễ bị flash loan manipulate)?
- [ ] Check staleness: `require(updatedAt > block.timestamp - MAX_DELAY)`?

## 7. Pause & Emergency

- [ ] Contract có `Pausable`?
- [ ] Mọi `public`/`external` function liên quan đến **action** đều có `whenNotPaused`?
  - Action = chuyển tiền, burn token, mint, stake, claim, lưu thông tin on-chain
  - Rule: nếu function thay đổi state hoặc động đến token → bắt buộc `whenNotPaused`
  ```solidity
  // BẮT BUỘC khi public + có action
  function stake(uint256 _amount) public whenNotPaused nonReentrant { ... }
  function burn(uint256 _amount) public whenNotPaused nonReentrant { ... }
  function saveRecord(...) public whenNotPaused { ... }

  // Không cần — chỉ đọc data
  function getPrice() public view returns (uint256) { ... }
  ```
- [ ] Admin functions (`onlyOwner`) **không** cần `whenNotPaused` — phải chạy được khi emergency để fix
- [ ] `pause()` / `unpause()` chỉ `onlyOwner` hoặc `onlyRole(PAUSER_ROLE)`?

## 8. Upgrade & Migration

- [ ] Contract có upgradeable không? (Proxy pattern)
- [ ] Nếu không: data migration plan nếu cần thay contract?
- [ ] Constructor có set đúng initial state?

## 9. Gas Limit & Array Validation

- [ ] Mọi function nhận array input đều có validate length **> 0 và <= 50**?
  ```solidity
  // BẮT BUỘC — 50 là default, tùy chỉnh theo gas limit nếu use case cần (VD: batch airdrop)
  require(_arr.length > 0 && _arr.length <= 50, "Array length must be between 1 and 50");
  ```
- [ ] Nếu có nhiều array cùng lúc: check length khớp nhau?
  ```solidity
  require(_ids.length == _prices.length && _ids.length == _status.length, "Array length mismatch");
  ```
- [ ] Loop nào khác có thể chạy unbounded? (DOS vector)

### 9a. Denial of Service (DoS)
- [ ] Mọi loop qua array có giới hạn length (> 0 && <= 50)?
- [ ] Không có loop qua unbounded storage array (VD: `for (i = 0; i < allUsers.length; ...)`)? Dùng pagination hoặc off-chain computation
- [ ] Batch operations (transfer/call tới nhiều recipients) — 1 recipient fail có chặn toàn bộ batch không?
  ```solidity
  // SAI — 1 recipient revert → chặn tất cả
  for (uint256 i = 0; i < recipients.length; ++i) {
      token.safeTransfer(recipients[i], amounts[i]);
  }

  // ĐÚNG — fail silently per item, emit event cho failed items
  for (uint256 i = 0; i < recipients.length; ++i) {
      (bool success, ) = recipients[i].call{value: amounts[i]}("");
      if (!success) emit TransferFailed(recipients[i], amounts[i]);
  }
  ```
- [ ] `call{value:}` tới untrusted address — receiver có thể revert cố ý? (VD: malicious fallback chặn withdrawal)
- [ ] Function có external call → đã tính trường hợp external contract consume hết gas chưa?

## 10. Events

- [ ] Tất cả state changes quan trọng đều emit event?
- [ ] Events emit **SAU** state changes, không trước? (state update trước, emit sau)
- [ ] Event params đủ để reconstruct history off-chain?
- [ ] `indexed` trên fields hay filter (address, id)?

## 11. Hardcoded Values

- [ ] Address token hardcode: có hàm thay đổi không? (nếu cần)
- [ ] Các thresholds/prices: có setter function không?
- [ ] Có magic numbers không giải thích? (dùng constant thay thế)

## 12. Must-have Functions Checklist

- [ ] `clearUnknownToken` — rescue token chuyển nhầm
- [ ] `rescueETH` — rescue ETH (nếu contract có `receive()` hoặc nhận ETH qua selfdestruct/coinbase). Dùng `call{value:}`, KHÔNG `transfer`
- [ ] `pause` / `unpause` — emergency stop
- [ ] Role rotation: `transferOwnership` (Ownable) hoặc `grantRole`/`revokeRole` (AccessControl)
- [ ] Setter cho config (price, status...) — không hardcode mãi

---

## Pre-deploy Checklist

- [ ] Test trên local (Hardhat/Foundry)?
- [ ] Test trên testnet (Sepolia/Amoy)?
- [ ] Verify source code trên Etherscan?
- [ ] Set đúng role address (không để msg.sender production)?
- [ ] Không dùng `selfdestruct`? (deprecated từ EIP-6780)
- [ ] Multisig cho owner nếu là protocol lớn?
- [ ] Audit bởi bên thứ 3 nếu TVL > $100k?
