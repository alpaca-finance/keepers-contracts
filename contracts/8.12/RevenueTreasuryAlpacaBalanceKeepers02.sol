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
import { KeeperCompatibleInterface } from "@chainlink/contracts/src/v0.8/automation/KeeperCompatible.sol";
import { IRevenueTreasury02 } from "./interfaces/IRevenueTreasury02.sol";
import { ITreasuryBuybackStrategy } from "./interfaces/ITreasuryBuybackStrategy.sol";

/// @title Revenue Treasury Keepers - A Chainlink's Keepers compatible contract
/// for up keep ALPACA to be distributed
// solhint-disable not-rely-on-time
contract RevenueTreasuryAlpacaBalanceKeepers02 is
  Ownable,
  ReentrancyGuard,
  BasicKeepers,
  KeeperCompatibleInterface
{
  /// Configs
  IRevenueTreasury02 public revenueTreasury02;
  IERC20 public alpaca;
  uint256 public triggerWei;

  /// Events
  event LogPerformUpkeep(uint256 _timestamp);
  event LogSetTriggerWei(uint256 _prevTriggerWei, uint256 _triggerWei);

  constructor(
    string memory _name,
    IRevenueTreasury02 _revenueTreausury02,
    IERC20 _alpaca,
    uint256 _triggerWei
  ) BasicKeepers(_name) {
    // Effect
    revenueTreasury02 = _revenueTreausury02;
    triggerWei = _triggerWei;
    alpaca = _alpaca;
  }

  function checkUpkeep(
    bytes calldata /* _checkData */
  ) external view override returns (bool, bytes memory) {
    // initiate distribution when balance more than threshold
    if (alpaca.balanceOf(address(revenueTreasury02)) >= triggerWei) {
      return (true, abi.encode());
    }

    return (false, "");
  }

  function performUpkeep(
    bytes calldata /*_performData*/
  ) external nonReentrant {
    // feed to revenueDistributor
    revenueTreasury02.feedRevenueDistributor();

    emit LogPerformUpkeep(block.timestamp);
  }

  function setTriggerWei(uint256 _triggerWei) external onlyOwner {
    // Effect
    uint256 _prevTriggerWei = _triggerWei;
    triggerWei = _triggerWei;

    emit LogSetTriggerWei(_prevTriggerWei, _triggerWei);
  }
}
