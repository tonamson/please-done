# Contract Templates

Các template chuẩn theo coding style. Copy và customize theo nhu cầu.

> **Roadmap nâng cấp (chưa có):** Staking contract, NFT Mint + whitelist, Vesting contract
> Khi user yêu cầu thêm template mới → thêm vào file này theo cùng format.

---

## Template 1a: Base Contract — Ownable

Dùng khi contract chỉ cần 1 owner duy nhất quản lý toàn bộ.

```solidity
// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.3.0
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MyContract
 * @dev Brief description of what this contract does.
 *
 * Key behaviors:
 * - ...
 *
 * Role model:
 * - Owner: pause/unpause, admin config, rescue tokens
 */
contract MyContract is Pausable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =========================================================
    // Constants
    // =========================================================

    uint256 private constant DECIMAL_18 = 1e18;

    // =========================================================
    // State Variables
    // =========================================================

    /// @notice Total amount of tokens processed by this contract.
    uint256 public totalProcessed;

    /// @dev Maps transaction ID to internal record ID. Used to prevent replay attacks.
    mapping(uint256 => uint256) public transIds;

    // =========================================================
    // Structs
    // =========================================================

    /**
     * @dev Stores per-record information.
     * @param user   Address of the user who initiated the action
     * @param amount Token amount involved (in wei, 18 decimals)
     */
    struct RecordInfo {
        address user;
        uint256 amount;
    }

    /// @dev Maps record ID => RecordInfo. Record IDs start at 1; index 0 is always empty.
    mapping(uint256 => RecordInfo) public records;

    /// @notice Auto-incrementing record counter. Incremented before each write.
    uint256 public currentRecordId;

    // =========================================================
    // Events
    // =========================================================

    /**
     * @dev Emitted when a core action is successfully executed.
     * @param user    Address of the user who triggered the action
     * @param amount  Token amount involved (in wei)
     * @param transId Unique transaction ID from the caller (for off-chain correlation)
     */
    event ActionEvent(address indexed user, uint256 amount, uint256 indexed transId);

    /// @dev Emitted when an unknown ERC20 token is rescued from the contract.
    event TokenRescued(address indexed token, address indexed target, uint256 amount);

    /// @dev Emitted when ETH is rescued from the contract.
    event EthRescued(address indexed target, uint256 amount);

    // =========================================================
    // Constructor
    // =========================================================

    /**
     * @dev Grants ownership to `initialOwner`.
     * @param initialOwner Address that will own the contract. Must not be address(0).
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        // OZ v5 Ownable tự revert nếu initialOwner == address(0)
        // require không cần thiết nhưng giữ cho nhất quán với Template 1b
    }

    // =========================================================
    // Core Functions
    // =========================================================

    /**
     * @notice Execute the main action for a given user.
     * @dev Only callable when not paused. Guards against reentrancy.
     *      Follows checks-effects-interactions:
     *        1. Validate inputs
     *        2. Update state
     *        3. Interact with external contracts
     *        4. Emit event
     *
     * @param _user    Address of the beneficiary. Must not be address(0).
     * @param _amount  Token amount (in token units, NOT wei — contract applies DECIMAL_18)
     * @param _transId Unique backend ID. Must be > 0 and unused.
     */
    // CUSTOMIZE: Thêm access control nếu backend gọi:
    //   Ownable:       onlyOwner
    //   AccessControl: onlyRole(OPERATOR_ROLE)
    // Bỏ nếu user gọi trực tiếp (user-facing action)
    function doAction(
        address _user,
        uint256 _amount,
        uint256 _transId
    ) public whenNotPaused nonReentrant {
        // --- Checks ---
        require(_user != address(0), "Invalid user address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_transId > 0, "Transaction ID must be greater than 0");
        require(transIds[_transId] == 0, "Transaction ID already exists");

        uint256 totalAmount = _amount * DECIMAL_18;

        // --- Effects ---
        currentRecordId++;
        records[currentRecordId] = RecordInfo({user: _user, amount: totalAmount});
        totalProcessed += totalAmount;
        transIds[_transId] = currentRecordId;

        // --- Interactions ---
        // e.g. token.safeTransfer(_user, totalAmount);
        // e.g. token.safeTransferFrom(msg.sender, address(this), totalAmount);

        // --- Event ---
        emit ActionEvent(_user, totalAmount, _transId);
    }

    // =========================================================
    // Admin Functions
    // =========================================================

    /**
     * @notice Rescue any ERC20 tokens mistakenly sent to this contract.
     * @dev Safety net for accidental transfers. Caller must verify `_amount`
     *      does not affect tokens intentionally held by the protocol.
     *      OPTIONAL SAFETY: thêm `require(_tokenAddress != address(token))` để chặn rút token protocol.
     * @param _tokenAddress Contract address of the ERC20 token to rescue
     * @param _target       Recipient address for the rescued tokens
     * @param _amount       Amount to transfer (in wei)
     */
    function clearUnknownToken(
        address _tokenAddress,
        address _target,
        uint256 _amount
    ) public onlyOwner nonReentrant {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_target != address(0), "Invalid target address");
        require(_amount > 0, "Amount must be greater than 0");
        uint256 contractBalance = IERC20(_tokenAddress).balanceOf(address(this));
        require(_amount <= contractBalance, "Contract not enough balance");
        IERC20(_tokenAddress).safeTransfer(_target, _amount);
        emit TokenRescued(_tokenAddress, _target, _amount);
    }

    /**
     * @notice Rescue ETH mistakenly sent to this contract.
     * @dev Uses low-level call instead of transfer (avoids 2300 gas limit).
     * @param _target Recipient address for the rescued ETH
     * @param _amount Amount of ETH to rescue (in wei)
     */
    function rescueETH(
        address payable _target,
        uint256 _amount
    ) public onlyOwner nonReentrant {
        require(_target != address(0), "Invalid target address");
        require(_amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= _amount, "Insufficient ETH balance");
        (bool success, ) = _target.call{value: _amount}("");
        require(success, "ETH transfer failed");
        emit EthRescued(_target, _amount);
    }

    // --- Token Approval (khi contract cần approve token cho bên thứ 3) ---
    // BẮT BUỘC dùng forceApprove (OZ v5) thay vì safeApprove (deprecated)
    // token.forceApprove(spender, amount);

    /**
     * @notice Pause all user-facing functions.
     * @dev Emits a {Paused} event. Admin functions remain callable while paused.
     */
    function pause() public onlyOwner { _pause(); }

    /**
     * @notice Resume all user-facing functions.
     * @dev Emits an {Unpaused} event.
     */
    function unpause() public onlyOwner { _unpause(); }
}
```

---

## Template 1b: Base Contract — AccessControl (multi-role)

Dùng khi contract cần phân chia nhiều role khác nhau (admin, operator, pauser...).

```solidity
// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.3.0
pragma solidity ^0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MyContract
 * @dev Brief description of what this contract does.
 *
 * Key behaviors:
 * - ...
 *
 * Role model:
 * - DEFAULT_ADMIN_ROLE: grant/revoke all roles
 * - ADMIN_ROLE:         config, rescue tokens
 * - PAUSER_ROLE:        pause/unpause
 * - OPERATOR_ROLE:      backend-triggered actions (e.g. claim, burn)
 */
contract MyContract is Pausable, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =========================================================
    // Roles
    // =========================================================

    /// @dev Can grant/revoke all other roles. Assigned to deployer or multisig.
    bytes32 public constant ADMIN_ROLE    = keccak256("ADMIN_ROLE");

    /// @dev Can pause and unpause the contract.
    bytes32 public constant PAUSER_ROLE   = keccak256("PAUSER_ROLE");

    /// @dev Can trigger backend-authorized actions (claim, burn, etc.).
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // =========================================================
    // Constants
    // =========================================================

    uint256 private constant DECIMAL_18 = 1e18;

    // =========================================================
    // State Variables
    // =========================================================

    /// @notice Total amount of tokens processed by this contract.
    uint256 public totalProcessed;

    /// @dev Maps transaction ID to internal record ID. Used to prevent replay attacks.
    mapping(uint256 => uint256) public transIds;

    // =========================================================
    // Structs
    // =========================================================

    /**
     * @dev Stores per-record information.
     * @param user   Address of the user who initiated the action
     * @param amount Token amount involved (in wei, 18 decimals)
     */
    struct RecordInfo {
        address user;
        uint256 amount;
    }

    /// @dev Maps record ID => RecordInfo. Record IDs start at 1; index 0 is always empty.
    mapping(uint256 => RecordInfo) public records;

    /// @notice Auto-incrementing record counter. Incremented before each write.
    uint256 public currentRecordId;

    // =========================================================
    // Events
    // =========================================================

    /**
     * @dev Emitted when a core action is successfully executed.
     * @param user    Address of the user who triggered the action
     * @param amount  Token amount involved (in wei)
     * @param transId Unique transaction ID from the caller (for off-chain correlation)
     */
    event ActionEvent(address indexed user, uint256 amount, uint256 indexed transId);

    /// @dev Emitted when an unknown ERC20 token is rescued from the contract.
    event TokenRescued(address indexed token, address indexed target, uint256 amount);

    /// @dev Emitted when ETH is rescued from the contract.
    event EthRescued(address indexed target, uint256 amount);

    /// @dev Emitted when the operator address is updated.
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);

    // =========================================================
    // Constructor
    // =========================================================

    /**
     * @dev Grants DEFAULT_ADMIN_ROLE and ADMIN_ROLE to `defaultAdmin`,
     *      and PAUSER_ROLE to `pauser`.
     *      DEFAULT_ADMIN_ROLE holder can grant/revoke any role afterward.
     * @param defaultAdmin Address receiving full admin control. Must not be address(0).
     * @param pauser       Address allowed to pause/unpause. Can equal defaultAdmin.
     */
    constructor(address defaultAdmin, address pauser) {
        require(defaultAdmin != address(0), "Invalid admin");
        require(pauser != address(0), "Invalid pauser");
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, pauser);
    }

    // =========================================================
    // Core Functions
    // =========================================================

    /**
     * @notice Execute the main action for a given user.
     * @dev Only callable when not paused. Guards against reentrancy.
     *      Follows checks-effects-interactions:
     *        1. Validate inputs
     *        2. Update state
     *        3. Interact with external contracts
     *        4. Emit event
     *
     * @param _user    Address of the beneficiary. Must not be address(0).
     * @param _amount  Token amount (in token units, NOT wei — contract applies DECIMAL_18)
     * @param _transId Unique backend ID. Must be > 0 and unused.
     */
    // CUSTOMIZE: Thêm access control nếu backend gọi:
    //   onlyRole(OPERATOR_ROLE)
    // Bỏ nếu user gọi trực tiếp (user-facing action)
    function doAction(
        address _user,
        uint256 _amount,
        uint256 _transId
    ) public whenNotPaused nonReentrant {
        // --- Checks ---
        require(_user != address(0), "Invalid user address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_transId > 0, "Transaction ID must be greater than 0");
        require(transIds[_transId] == 0, "Transaction ID already exists");

        uint256 totalAmount = _amount * DECIMAL_18;

        // --- Effects ---
        currentRecordId++;
        records[currentRecordId] = RecordInfo({user: _user, amount: totalAmount});
        totalProcessed += totalAmount;
        transIds[_transId] = currentRecordId;

        // --- Interactions ---
        // e.g. token.safeTransfer(_user, totalAmount);
        // e.g. token.safeTransferFrom(msg.sender, address(this), totalAmount);

        // --- Event ---
        emit ActionEvent(_user, totalAmount, _transId);
    }

    // =========================================================
    // Admin Functions
    // =========================================================

    /**
     * @notice Rescue any ERC20 tokens mistakenly sent to this contract.
     * @dev Safety net for accidental transfers. Caller must verify `_amount`
     *      does not affect tokens intentionally held by the protocol.
     *      OPTIONAL SAFETY: thêm `require(_tokenAddress != address(token))` để chặn rút token protocol.
     * @param _tokenAddress Contract address of the ERC20 token to rescue
     * @param _target       Recipient address for the rescued tokens
     * @param _amount       Amount to transfer (in wei)
     */
    function clearUnknownToken(
        address _tokenAddress,
        address _target,
        uint256 _amount
    ) public onlyRole(ADMIN_ROLE) nonReentrant {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_target != address(0), "Invalid target address");
        require(_amount > 0, "Amount must be greater than 0");
        uint256 contractBalance = IERC20(_tokenAddress).balanceOf(address(this));
        require(_amount <= contractBalance, "Contract not enough balance");
        IERC20(_tokenAddress).safeTransfer(_target, _amount);
        emit TokenRescued(_tokenAddress, _target, _amount);
    }

    /**
     * @notice Rescue ETH mistakenly sent to this contract.
     * @dev Uses low-level call instead of transfer (avoids 2300 gas limit).
     * @param _target Recipient address for the rescued ETH
     * @param _amount Amount of ETH to rescue (in wei)
     */
    function rescueETH(
        address payable _target,
        uint256 _amount
    ) public onlyRole(ADMIN_ROLE) nonReentrant {
        require(_target != address(0), "Invalid target address");
        require(_amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= _amount, "Insufficient ETH balance");
        (bool success, ) = _target.call{value: _amount}("");
        require(success, "ETH transfer failed");
        emit EthRescued(_target, _amount);
    }

    // --- Token Approval (khi contract cần approve token cho bên thứ 3) ---
    // BẮT BUỘC dùng forceApprove (OZ v5) thay vì safeApprove (deprecated)
    // token.forceApprove(spender, amount);

    /**
     * @notice Pause all user-facing functions.
     * @dev Emits a {Paused} event. Admin functions remain callable while paused.
     */
    function pause() public onlyRole(PAUSER_ROLE) { _pause(); }

    /**
     * @notice Resume all user-facing functions.
     * @dev Emits an {Unpaused} event.
     */
    function unpause() public onlyRole(PAUSER_ROLE) { _unpause(); }
}
```

---


<!-- UPGRADE ZONE: thêm template mới vào đây khi user yêu cầu -->
<!-- Format: ## Template N: <Tên Contract> -->

## Template 2: Signature Verification Pattern

Dùng khi backend cần authorize một action on-chain mà không muốn để contract tự validate logic —
backend ký off-chain, contract verify chữ ký trước khi execute.

Pattern này lấy từ `claimBonus` trong `Omet_Dapp_Ver2`.

### Cách hoạt động

```
Backend (off-chain)                     Contract (on-chain)
─────────────────────────────────────   ──────────────────────────────────
1. Build hash từ các params:            3. Rebuild cùng hash từ params
   keccak256(token, amount, trans_id,      keccak256(token, amount, trans_id,
     deadline, userAddr,                     deadline, msg.sender,
     chainId, contractAddr)                  block.chainid, address(this))

2. Sign hash bằng operator key          4. Check hash chưa dùng (rẻ gas)
   → bytes signature                    5. Check deadline chưa expired
                                        6. Recover signer từ signature
                                           → must == operator address
                                        7. Mark hash as used (TRƯỚC transfer)
                                        8. Execute action (transfer/state change)
```

> **Tại sao cần `block.chainid` + `address(this)` trong hash?**
> - Thiếu `chainid`: signature trên Ethereum replay được trên BSC/Polygon (cùng contract address)
> - Thiếu `address(this)`: signature cho contract A replay được trên contract B (cùng operator)
> - Cả hai đều là attack vector thực tế đã bị exploit (Wintermute/Optimism, Wormhole)

> **Khi nào dùng EIP-712 thay vì raw pattern này?**
> - **Backend ký** (operator key, server-side) → raw pattern này OK
> - **User ký qua wallet** (MetaMask popup) → BẮT BUỘC dùng OZ `EIP712.sol` — user thấy typed data thay vì hex hash

### Dependencies

```solidity
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
```

### State variables cần thêm

```solidity
using ECDSA for bytes32;
using MessageHashUtils for bytes32;

/// @notice Address of the backend signer. Must be set before any signed action can execute.
address public operator;

/// @dev Tracks used hashes to prevent replay attacks.
///      Maps keccak256(message hash) => bool (true = already used).
///      Dùng hash thay vì raw signature bytes: rẻ gas hơn + immune to signature malleability.
mapping(bytes32 => bool) public hashUsed;

/// @dev Emitted when a signed action is successfully executed.
event SignedActionEvent(address indexed account, uint256 indexed transId, uint256 amount);

/// @dev Emitted when the operator address is updated (used by setOperator below).
///      Nếu dùng Template 1b (AccessControl) → XÓA dòng dưới vì Template 1b đã khai báo event này.
event OperatorUpdated(address indexed oldOperator, address indexed newOperator);

/// @dev Optional: blacklist mapping. Uncomment nếu contract cần chặn wallet cụ thể.
// mapping(address => bool) public blacklistWallet;
```

### Helper: signature validator (private)

```solidity
/**
 * @dev Verifies that `signature` was produced by operator over `_hash`.
 *      Uses OZ MessageHashUtils to prepend EIP-191 prefix before recovering.
 * @param _hash      keccak256 hash of the action params (NOT prefixed)
 * @param _signature Signature bytes produced by the backend
 * @return True if signature is valid and signer == operator
 */
function _checkValidateSignature(
    bytes32 _hash,
    bytes memory _signature
) private view returns (bool) {
    require(operator != address(0), "Operator not set");
    bytes32 signedHash = _hash.toEthSignedMessageHash();
    return signedHash.recover(_signature) == operator;
}
```

### Function template dùng signature

```solidity
/**
 * @notice Execute a signed action authorized by the backend operator.
 * @dev Signature must be produced by operator over:
 *      keccak256(abi.encodePacked(token_address, amount, trans_id, deadline, msg.sender, block.chainid, address(this)))
 *
 *      Replay protection: each message hash can only be used once (hashUsed mapping).
 *      Expiry protection: deadline must be >= block.timestamp at time of execution.
 *      Cross-chain protection: block.chainid binds signature to specific chain.
 *      Cross-contract protection: address(this) binds signature to specific contract.
 *
 *      Convention: `deadline` and `signature` are ALWAYS the last two parameters
 *      of any function that requires backend authorization. Never reorder them.
 *
 * @param _tokenAddress  Token address included in the signed payload (binds action to specific token)
 * @param _account       Must equal msg.sender — prevents one user submitting another's signature
 * @param _transId       Off-chain transaction ID — MUST be included in hash for deduplication
 * @param _amount        Amount authorized by backend (in wei, 18 decimals)
 * @param _deadline      Unix timestamp after which the signature expires. Backend controls TTL.
 * @param _signature     ECDSA signature bytes produced by operator. Always the last parameter.
 */
function signedAction(
    address _tokenAddress,
    address _account,
    uint256 _transId,
    uint256 _amount,
    uint256 _deadline,       // always second-to-last
    bytes memory _signature  // always last
) public whenNotPaused nonReentrant {
    // --- Checks: identity ---
    require(_account == msg.sender, "User not valid");
    // Optional: uncomment nếu dùng blacklist (khai báo mapping ở state variables)
    // require(!blacklistWallet[_account], "Wallet is blacklist");

    // --- Checks: signature ---
    // BẮT BUỘC: hash include block.chainid + address(this) chống replay cross-chain/cross-contract
    // Các params khác (tokenAddress, amount, transId...) tuỳ ngữ cảnh contract — đảm bảo đủ để bind action
    bytes32 hash = keccak256(
        abi.encodePacked(_tokenAddress, _amount, _transId, _deadline, msg.sender, block.chainid, address(this))
    );
    require(!hashUsed[hash], "Hash already used");
    require(_deadline >= block.timestamp, "Signature expired");
    require(_checkValidateSignature(hash, _signature), "Invalid signature");

    // --- Checks: business logic ---
    require(_amount >= DECIMAL_18, "Amount must be >= 1");
    // e.g. require(getUserClaimable(msg.sender) >= _amount, "Exceeds claimable");

    // --- Effects ---
    // update state before any transfer
    // e.g. userInfo[_account].claimed += _amount;
    hashUsed[hash] = true; // always mark used BEFORE transfer

    // --- Interactions ---
    // e.g. token.safeTransfer(_account, _amount);

    // --- Event ---
    // BẮT BUỘC: emit event sau state change — event đã khai báo ở section "State variables cần thêm"
    emit SignedActionEvent(_account, _transId, _amount);
}
```

### Admin setter (bắt buộc kèm theo)

> **Lưu ý access control:** Ví dụ dưới dùng `onlyRole(ADMIN_ROLE)` (AccessControl — Template 1b). Nếu contract dùng **Ownable** (Template 1a) → đổi thành `onlyOwner`.

```solidity
/**
 * @dev Sets the backend operator address used for signature verification.
 *      Changing this immediately invalidates all previously issued signatures
 *      (vì hash include address(this) + chainid, nhưng operator thay đổi → recover khác).
 * @param _newOperator New operator address. Must not be address(0).
 */
// Ownable: function setOperator(address _newOperator) public onlyOwner {
function setOperator(address _newOperator) public onlyRole(ADMIN_ROLE) {
    require(_newOperator != address(0), "Invalid operator address");
    address oldOperator = operator;
    operator = _newOperator;
    emit OperatorUpdated(oldOperator, _newOperator);
}
```

### Checklist khi dùng signature pattern

- [ ] Hash **BẮT BUỘC** include `block.chainid` + `address(this)` (chống cross-chain + cross-contract replay)
- [ ] Hash include đủ params bind action (tuỳ ngữ cảnh: token, amount, deadline, msg.sender, ...)
- [ ] `_account == msg.sender` — không để user khác submit thay
- [ ] Dùng `mapping(bytes32 => bool) hashUsed` track theo hash (KHÔNG track raw `bytes` signature — đắt gas + malleability risk)
- [ ] `hashUsed[hash] = true` được set **trước** khi transfer (checks-effects-interactions)
- [ ] `deadline >= block.timestamp` — signature có thời hạn, backend control TTL
- [ ] `operator != address(0)` check trong `_checkValidateSignature`
- [ ] `setOperator` chỉ `ADMIN_ROLE` / `onlyOwner` mới gọi được
- [ ] Khi rotate operator key: các signature cũ chưa dùng sẽ invalid ngay lập tức
- [ ] Nếu user ký qua wallet (MetaMask) → dùng OZ `EIP712.sol` thay vì raw pattern này
