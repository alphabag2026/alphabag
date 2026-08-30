// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ABPMarketEscrow
 * @notice Non-custodial order escrow that atomically exchanges ABP points for a configured USDT token.
 * @dev Assumes the ABP token has 18 decimals. Buyers must approve USDT before calling fillOrder.
 *      Deploy only after independent review, testnet validation, multisig role assignment, and legal approval.
 */
contract ABPMarketEscrow is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_FEE_BPS = 1_000;
    uint256 public constant POINT_SCALE = 1e18;

    enum OrderStatus { None, Open, Filled, Cancelled }

    struct Order {
        address seller;
        uint128 remainingPointAmount;
        uint128 minFillAmount;
        uint128 priceUsdtPerPoint;
        uint64 expiresAt;
        OrderStatus status;
    }

    IERC20 public immutable pointToken;
    IERC20 public immutable usdtToken;
    address public feeRecipient;
    uint16 public feeBps;
    uint256 public nextOrderId = 1;
    mapping(uint256 => Order) public orders;

    error InvalidAddress();
    error InvalidAmount();
    error InvalidExpiry();
    error InvalidFee();
    error NotSeller();
    error OrderUnavailable();
    error FillBelowMinimum();
    error FillExceedsRemaining();

    event OrderCreated(uint256 indexed orderId, address indexed seller, uint256 pointAmount, uint256 minFillAmount, uint256 priceUsdtPerPoint, uint64 expiresAt);
    event OrderFilled(uint256 indexed orderId, address indexed buyer, uint256 pointAmount, uint256 grossUsdtAmount, uint256 feeUsdtAmount);
    event OrderCancelled(uint256 indexed orderId, address indexed seller, uint256 returnedPointAmount);
    event FeeConfigurationUpdated(address indexed feeRecipient, uint16 feeBps);

    constructor(address pointToken_, address usdtToken_, address feeRecipient_, uint16 feeBps_, address admin_, address pauser_, address feeManager_) {
        if (pointToken_ == address(0) || usdtToken_ == address(0) || feeRecipient_ == address(0) || admin_ == address(0) || pauser_ == address(0) || feeManager_ == address(0)) revert InvalidAddress();
        if (feeBps_ > MAX_FEE_BPS) revert InvalidFee();
        pointToken = IERC20(pointToken_);
        usdtToken = IERC20(usdtToken_);
        feeRecipient = feeRecipient_;
        feeBps = feeBps_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(PAUSER_ROLE, pauser_);
        _grantRole(FEE_MANAGER_ROLE, feeManager_);
    }

    function createOrder(uint256 pointAmount, uint256 minFillAmount, uint256 priceUsdtPerPoint, uint64 expiresAt) external nonReentrant whenNotPaused returns (uint256 orderId) {
        if (pointAmount == 0 || minFillAmount == 0 || priceUsdtPerPoint == 0) revert InvalidAmount();
        if (minFillAmount > pointAmount) revert InvalidAmount();
        if (expiresAt <= block.timestamp || expiresAt > block.timestamp + 30 days) revert InvalidExpiry();
        if (pointAmount > type(uint128).max || minFillAmount > type(uint128).max || priceUsdtPerPoint > type(uint128).max) revert InvalidAmount();
        orderId = nextOrderId++;
        orders[orderId] = Order({
            seller: msg.sender,
            remainingPointAmount: uint128(pointAmount),
            minFillAmount: uint128(minFillAmount),
            priceUsdtPerPoint: uint128(priceUsdtPerPoint),
            expiresAt: expiresAt,
            status: OrderStatus.Open
        });
        pointToken.safeTransferFrom(msg.sender, address(this), pointAmount);
        emit OrderCreated(orderId, msg.sender, pointAmount, minFillAmount, priceUsdtPerPoint, expiresAt);
    }

    function fillOrder(uint256 orderId, uint256 pointAmount) external nonReentrant whenNotPaused {
        Order storage order = orders[orderId];
        if (order.status != OrderStatus.Open || order.expiresAt <= block.timestamp) revert OrderUnavailable();
        if (pointAmount < order.minFillAmount) revert FillBelowMinimum();
        if (pointAmount > order.remainingPointAmount) revert FillExceedsRemaining();

        uint256 grossUsdtAmount = (pointAmount * uint256(order.priceUsdtPerPoint)) / POINT_SCALE;
        if (grossUsdtAmount == 0) revert InvalidAmount();
        uint256 feeUsdtAmount = (grossUsdtAmount * feeBps) / BPS_DENOMINATOR;
        uint256 sellerNetUsdtAmount = grossUsdtAmount - feeUsdtAmount;

        // Effects before external token calls; SafeERC20 handles non-standard USDT return behavior.
        order.remainingPointAmount -= uint128(pointAmount);
        if (order.remainingPointAmount == 0) order.status = OrderStatus.Filled;

        usdtToken.safeTransferFrom(msg.sender, order.seller, sellerNetUsdtAmount);
        if (feeUsdtAmount > 0) usdtToken.safeTransferFrom(msg.sender, feeRecipient, feeUsdtAmount);
        pointToken.safeTransfer(msg.sender, pointAmount);
        emit OrderFilled(orderId, msg.sender, pointAmount, grossUsdtAmount, feeUsdtAmount);
    }

    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        if (order.seller != msg.sender) revert NotSeller();
        if (order.status != OrderStatus.Open) revert OrderUnavailable();
        uint256 returnedPointAmount = order.remainingPointAmount;
        order.remainingPointAmount = 0;
        order.status = OrderStatus.Cancelled;
        pointToken.safeTransfer(order.seller, returnedPointAmount);
        emit OrderCancelled(orderId, order.seller, returnedPointAmount);
    }

    function setFeeConfiguration(address feeRecipient_, uint16 feeBps_) external onlyRole(FEE_MANAGER_ROLE) {
        if (feeRecipient_ == address(0)) revert InvalidAddress();
        if (feeBps_ > MAX_FEE_BPS) revert InvalidFee();
        feeRecipient = feeRecipient_;
        feeBps = feeBps_;
        emit FeeConfigurationUpdated(feeRecipient_, feeBps_);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function rescueUnsupportedToken(address token, address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(pointToken) || token == address(usdtToken)) revert InvalidAddress();
        if (to == address(0)) revert InvalidAddress();
        IERC20(token).safeTransfer(to, amount);
    }
}
