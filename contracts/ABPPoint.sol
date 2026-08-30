// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ABPPoint
 * @notice Capped, role-controlled ERC-20 point token for the AlphaBag point economy.
 * @dev This source is an implementation candidate, not an audited production deployment.
 */
contract ABPPoint is ERC20, ERC20Permit, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public immutable cap;

    error CapExceeded(uint256 attemptedSupply, uint256 cap);
    error ZeroAddress();

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 cap_,
        address admin_,
        address minter_,
        address pauser_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        if (cap_ == 0 || admin_ == address(0) || minter_ == address(0) || pauser_ == address(0)) revert ZeroAddress();
        cap = cap_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(MINTER_ROLE, minter_);
        _grantRole(PAUSER_ROLE, pauser_);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        uint256 attemptedSupply = totalSupply() + amount;
        if (attemptedSupply > cap) revert CapExceeded(attemptedSupply, cap);
        _mint(to, amount);
    }

    function burn(uint256 amount) external whenNotPaused {
        _burn(msg.sender, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
