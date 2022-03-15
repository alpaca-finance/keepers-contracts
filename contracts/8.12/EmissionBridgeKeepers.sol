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
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { KeeperCompatibleInterface } from "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import { IFairLaunch } from "./interfaces/IFairLaunch.sol";
import { IEmissionForwarder } from "./interfaces/IEmissionForwarder.sol";

/// @title Emission Bridge Keeper - A Chainlink's Keepers compatible contract
/// for forwarding ALPACA emission to the target chain.
/// @dev The downstream contract must implement the IEmissionForwarder interface.
/// @author spicysquid168
// solhint-disable not-rely-on-time
contract EmissionBridgeKeepers is
  Ownable,
  ReentrancyGuard,
  BasicKeepers,
  KeeperCompatibleInterface
{
  /// Errors
  error EmissionBridgeKeeper_NotPassTriggerWei();

  /// Configs
  IFairLaunch public fairLaunch;
  uint256 public pId;
  uint256 public triggerWei;
  IEmissionForwarder public forwarder;

  /// Events
  event LogPerformUpkeep(uint256 _timestamp);
  event LogSetTriggerWei(uint256 _prevTriggerWei, uint256 _triggerWei);

  constructor(
    string memory _name,
    IEmissionForwarder _forwarder,
    uint256 _triggerWei
  ) BasicKeepers(_name) {
    // Effect
    forwarder = _forwarder;
    fairLaunch = _forwarder.fairLaunch();
    pId = _forwarder.fairLaunchPoolId();
    triggerWei = _triggerWei;
  }

  function checkUpkeep(
    bytes calldata /* _checkData */
  ) external view override returns (bool, bytes memory) {
    return (
      fairLaunch.pendingAlpaca(pId, address(forwarder)) >= triggerWei
        ? true
        : false,
      ""
    );
  }

  function performUpkeep(
    bytes calldata /* _performData */
  ) external nonReentrant {
    // Check
    if (fairLaunch.pendingAlpaca(pId, address(forwarder)) < triggerWei)
      revert EmissionBridgeKeeper_NotPassTriggerWei();

    // Interaction
    forwarder.forwardToken();

    emit LogPerformUpkeep(block.timestamp);
  }

  function setTriggerWei(uint256 _triggerWei) external onlyOwner {
    // Effect
    uint256 _prevTriggerWei = _triggerWei;
    triggerWei = _triggerWei;

    emit LogSetTriggerWei(_prevTriggerWei, _triggerWei);
  }
}
