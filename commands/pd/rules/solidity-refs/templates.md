# Contract Templates

Standard templates following the coding style. Copy and customize as needed.

> **Upgrade roadmap (not yet available):** Staking contract, NFT Mint + whitelist, Vesting contract
> When user requests a new template → add to this file using the same format.

---

## Template 1a: Base Contract — Ownable

Use when the contract needs only a single owner managing everything.

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
        // OZ v5 Ownable auto-reverts if initialOwner == address(0)
        // require not necessary but kept for consistency with Template 1b
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
    // CUSTOMIZE: Add access control if backend calls:
    //   Ownable:       onlyOwner
    //   AccessControl: onlyRole(OPERATOR_ROLE)
    // Remove if user calls directly (user-facing action)
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
     *      OPTIONAL SAFETY: add `require(_tokenAddress != address(token))` to prevent withdrawing protocol tokens.
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

    // --- Token Approval (when contract needs to approve tokens for third parties) ---
    // MUST use forceApprove (OZ v5) instead of safeApprove (deprecated)
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

Use when the contract needs multiple different roles (admin, operator, pauser...).

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
    // CUSTOMIZE: Add access control if backend calls:
    //   onlyRole(OPERATOR_ROLE)
    // Remove if user calls directly (user-facing action)
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
     *      OPTIONAL SAFETY: add `require(_tokenAddress != address(token))` to prevent withdrawing protocol tokens.
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

    // --- Token Approval (when contract needs to approve tokens for third parties) ---
    // MUST use forceApprove (OZ v5) instead of safeApprove (deprecated)
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


<!-- UPGRADE ZONE: add new templates here when user requests -->
<!-- Format: ## Template N: <Contract Name> -->

## Template 2: Signature Verification Pattern

Use when backend needs to authorize an on-chain action without having the contract validate the logic itself —
backend signs off-chain, contract verifies signature before executing.

This pattern is derived from `claimBonus` in `Omet_Dapp_Ver2`.

### How it works

```
Backend (off-chain)                     Contract (on-chain)
─────────────────────────────────────   ──────────────────────────────────
1. Build hash from params:              3. Rebuild same hash from params
   keccak256(token, amount, trans_id,      keccak256(token, amount, trans_id,
     deadline, userAddr,                     deadline, msg.sender,
     chainId, contractAddr)                  block.chainid, address(this))

2. Sign hash with operator key          4. Check hash not yet used (cheap gas)
   → bytes signature                    5. Check deadline not expired
                                        6. Recover signer from signature
                                           → must == operator address
                                        7. Mark hash as used (BEFORE transfer)
                                        8. Execute action (transfer/state change)
```

> **Why include `block.chainid` + `address(this)` in hash?**
> - Missing `chainid`: signature on Ethereum can be replayed on BSC/Polygon (same contract address)
> - Missing `address(this)`: signature for contract A can be replayed on contract B (same operator)
> - Both are real attack vectors that have been exploited (Wintermute/Optimism, Wormhole)

> **When to use EIP-712 instead of this raw pattern?**
> - **Backend signs** (operator key, server-side) → this raw pattern is OK
> - **User signs via wallet** (MetaMask popup) → MUST use OZ `EIP712.sol` — user sees typed data instead of hex hash

### Dependencies

```solidity
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
```

### State variables to add

```solidity
using ECDSA for bytes32;
using MessageHashUtils for bytes32;

/// @notice Address of the backend signer. Must be set before any signed action can execute.
address public operator;

/// @dev Tracks used hashes to prevent replay attacks.
///      Maps keccak256(message hash) => bool (true = already used).
///      Uses hash instead of raw signature bytes: cheaper gas + immune to signature malleability.
mapping(bytes32 => bool) public hashUsed;

/// @dev Emitted when a signed action is successfully executed.
event SignedActionEvent(address indexed account, uint256 indexed transId, uint256 amount);

/// @dev Emitted when the operator address is updated (used by setOperator below).
///      If using Template 1b (AccessControl) → DELETE this line as Template 1b already declares this event.
event OperatorUpdated(address indexed oldOperator, address indexed newOperator);

/// @dev Optional: blacklist mapping. Uncomment if contract needs to block specific wallets.
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

### Function template using signature

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
    // Optional: uncomment if using blacklist (declare mapping in state variables)
    // require(!blacklistWallet[_account], "Wallet is blacklist");

    // --- Checks: signature ---
    // REQUIRED: hash includes block.chainid + address(this) to prevent cross-chain/cross-contract replay
    // Other params (tokenAddress, amount, transId...) depend on contract context — ensure enough to bind action
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
    // REQUIRED: emit event after state change — event declared in "State variables to add" section
    emit SignedActionEvent(_account, _transId, _amount);
}
```

### Admin setter (required companion)

> **Access control note:** Example below uses `onlyRole(ADMIN_ROLE)` (AccessControl — Template 1b). If contract uses **Ownable** (Template 1a) → change to `onlyOwner`.

```solidity
/**
 * @dev Sets the backend operator address used for signature verification.
 *      Changing this immediately invalidates all previously issued signatures
 *      (because hash includes address(this) + chainid, but operator change → different recovery).
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

### Checklist when using signature pattern

- [ ] Hash **MUST** include `block.chainid` + `address(this)` (prevents cross-chain + cross-contract replay)
- [ ] Hash includes enough params to bind action (context-dependent: token, amount, deadline, msg.sender, ...)
- [ ] `_account == msg.sender` — prevents other users from submitting on behalf
- [ ] Uses `mapping(bytes32 => bool) hashUsed` to track by hash (DO NOT track raw `bytes` signature — expensive gas + malleability risk)
- [ ] `hashUsed[hash] = true` set **before** transfer (checks-effects-interactions)
- [ ] `deadline >= block.timestamp` — signature has a TTL, backend controls expiry
- [ ] `operator != address(0)` checked in `_checkValidateSignature`
- [ ] `setOperator` callable only by `ADMIN_ROLE` / `onlyOwner`
- [ ] When rotating operator key: all unused old signatures become invalid immediately
- [ ] If user signs via wallet (MetaMask) → use OZ `EIP712.sol` instead of this raw pattern
