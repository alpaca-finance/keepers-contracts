// SPDX-License-Identifier: MIT
/**
  ∩~~~~∩ 
  ξ ･×･ ξ 
  ξ　~　ξ 
  ξ　　 ξ 
  ξ　　 “~～~～〇 
  ξ　　　　　　 ξ 
  ξ ξ ξ~～~ξ ξ ξ 
　 ξ_ξξ_ξ　ξ_ξξ_ξ
Alpaca Fin Corporation
*/

pragma solidity 0.8.12;

import { Ownable } from "./libs/Ownable.sol";
import { BasicKeepers } from "./libs/BasicKeepers.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { KeeperCompatibleInterface } from "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import { IRevenueTreasury } from "./interfaces/IRevenueTreasury.sol";

/// @title Revenue Treasury Keepers - A Chainlink's Keepers compatible contract
/// for up keep ALPACA to be distributed or settle for bad debts.
/// @author spicysquid168
// solhint-disable not-rely-on-time
contract RevenueTreasuryKeepers is
  Ownable,
  ReentrancyGuard,
  BasicKeepers,
  KeeperCompatibleInterface
{
  /// Errors
  error RevenueTreasuryKeepers_NotPassTriggerWei();

  /// Configs
  IRevenueTreasury public revenueTreasury;
  uint256 public triggerWei;

  /// Events
  event LogPerformUpkeep(uint256 _timestamp);
  event LogSetTriggerWei(uint256 _prevTriggerWei, uint256 _triggerWei);

  constructor(
    string memory _name,
    IRevenueTreasury _revenueTreausry,
    uint256 _triggerWei
  ) BasicKeepers(_name) {
    // Effect
    revenueTreasury = _revenueTreausry;
    triggerWei = _triggerWei;
  }

  function checkUpkeep(
    bytes calldata /* _checkData */
  ) external view override returns (bool, bytes memory) {
    // SLOAD
    uint256 _balanceOfRevenueTreasury = IERC20(revenueTreasury.token())
      .balanceOf(address(revenueTreasury));
    return (_balanceOfRevenueTreasury >= triggerWei ? true : false, "");
  }

  function performUpkeep(
    bytes calldata /* _performData */
  ) external nonReentrant {
    // Check
    // SLOAD
    uint256 _balanceOfRevenueTreasury = IERC20(revenueTreasury.token())
      .balanceOf(address(revenueTreasury));
    if (_balanceOfRevenueTreasury < triggerWei)
      revert RevenueTreasuryKeepers_NotPassTriggerWei();

    // Interaction
    revenueTreasury.feedGrassHouse();

    emit LogPerformUpkeep(block.timestamp);
  }

  function setTriggerWei(uint256 _triggerWei) external onlyOwner {
    // Effect
    uint256 _prevTriggerWei = _triggerWei;
    triggerWei = _triggerWei;

    emit LogSetTriggerWei(_prevTriggerWei, _triggerWei);
  }
}
