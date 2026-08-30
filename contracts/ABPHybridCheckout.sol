// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ABPHybridCheckout
 * @notice Enforces a versioned policy where an investment is paid as 70–95% USDT
 *         plus 5–30% ABP points. Values are calculated on-chain, not trusted from the UI.
 * @dev ABP is assumed to have 18 decimals. `pointRateUsdt` is USDT base units per whole ABP.
 */
contract ABPHybridCheckout is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant POLICY_MANAGER_ROLE = keccak256("POLICY_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MIN_USDT_SHARE_BPS = 7_000;
    uint256 public constant MAX_USDT_SHARE_BPS = 9_500;
    uint256 public constant POINT_SCALE = 1e18;

    struct PaymentPolicy {
        uint16 usdtShareBps;
        uint16 pointShareBps;
        uint128 pointRateUsdt;
        bool active;
    }

    IERC20 public immutable pointToken;
    IERC20 public immutable usdtToken;
    address public treasury;
    mapping(uint256 => mapping(uint256 => PaymentPolicy)) public policies;
    mapping(uint256 => bool) public paymentReferenceUsed;

    error InvalidAddress();
    error InvalidPolicy();
    error PolicyUnavailable();
    error PaymentReferenceAlreadyUsed();
    error InvalidAmount();

    event PolicyConfigured(uint256 indexed planId, uint256 indexed version, uint16 usdtShareBps, uint16 pointShareBps, uint128 pointRateUsdt, bool active);
    event HybridCheckoutCompleted(uint256 indexed paymentReference, uint256 indexed planId, uint256 indexed policyVersion, address payer, uint256 usdtAmount, uint256 pointAmount);
    event TreasuryUpdated(address indexed treasury);

    constructor(address pointToken_, address usdtToken_, address treasury_, address admin_, address policyManager_, address pauser_) {
        if (pointToken_ == address(0) || usdtToken_ == address(0) || treasury_ == address(0) || admin_ == address(0) || policyManager_ == address(0) || pauser_ == address(0)) revert InvalidAddress();
        pointToken = IERC20(pointToken_);
        usdtToken = IERC20(usdtToken_);
        treasury = treasury_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(POLICY_MANAGER_ROLE, policyManager_);
        _grantRole(PAUSER_ROLE, pauser_);
    }

    function setPolicy(uint256 planId, uint256 version, uint16 usdtShareBps, uint16 pointShareBps, uint128 pointRateUsdt, bool active) external onlyRole(POLICY_MANAGER_ROLE) {
        if (planId == 0 || version == 0 || pointRateUsdt == 0) revert InvalidPolicy();
        if (usdtShareBps < MIN_USDT_SHARE_BPS || usdtShareBps > MAX_USDT_SHARE_BPS || pointShareBps < 500 || pointShareBps > 3_000 || uint256(usdtShareBps) + uint256(pointShareBps) != BPS_DENOMINATOR) revert InvalidPolicy();
        policies[planId][version] = PaymentPolicy({ usdtShareBps: usdtShareBps, pointShareBps: pointShareBps, pointRateUsdt: pointRateUsdt, active: active });
        emit PolicyConfigured(planId, version, usdtShareBps, pointShareBps, pointRateUsdt, active);
    }

    function checkout(uint256 paymentReference, uint256 planId, uint256 policyVersion, uint256 nominalUsdtAmount) external nonReentrant whenNotPaused {
        if (paymentReference == 0 || paymentReferenceUsed[paymentReference]) revert PaymentReferenceAlreadyUsed();
        if (nominalUsdtAmount == 0) revert InvalidAmount();
        PaymentPolicy memory policy = policies[planId][policyVersion];
        if (!policy.active) revert PolicyUnavailable();

        uint256 usdtAmount = (nominalUsdtAmount * policy.usdtShareBps) / BPS_DENOMINATOR;
        uint256 pointValueUsdt = nominalUsdtAmount - usdtAmount;
        uint256 pointAmount = (pointValueUsdt * POINT_SCALE) / policy.pointRateUsdt;
        if (usdtAmount == 0 || pointAmount == 0) revert InvalidAmount();

        paymentReferenceUsed[paymentReference] = true;
        usdtToken.safeTransferFrom(msg.sender, treasury, usdtAmount);
        pointToken.safeTransferFrom(msg.sender, treasury, pointAmount);
        emit HybridCheckoutCompleted(paymentReference, planId, policyVersion, msg.sender, usdtAmount, pointAmount);
    }

    function setTreasury(address treasury_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (treasury_ == address(0)) revert InvalidAddress();
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }
}
