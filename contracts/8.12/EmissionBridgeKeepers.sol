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
import { KeeperCompatibleInterface } from "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import { IEmissionForwarder } from "./interfaces/IEmissionForwarder.sol";

/// @title Emission Bridge Keeper - A Chainlink's Keepers compatible contract
/// for forwarding ALPACA emission to the target chain.
/// @dev The downstream contract must implement the IEmissionForwarder interface.
/// @author spicysquid168
// solhint-disable not-rely-on-time
contract EmissionBridgeKeepers is Ownable, KeeperCompatibleInterface {
  /// Errors
  error EmissionBridgeKeeper_NotPassInterval();

  /// Configs
  string public name;
  IEmissionForwarder public forwarder;
  uint256 public interval;

  /// States
  uint256 public lastTimestamp;

  event LogEmissionBridgeKeeper(uint256 _timestamp);
  event LogSetInterval(uint256 _prevInterval, uint256 _newInterval);

  constructor(
    string memory _name,
    IEmissionForwarder _forwarder,
    uint256 _interval
  ) {
    // Effect
    name = _name;
    forwarder = _forwarder;
    interval = _interval;
    lastTimestamp = block.timestamp;
    _transferOwnership(msg.sender);
  }

  function checkUpkeep(
    bytes calldata /* checkData */
  ) external view override returns (bool, bytes memory) {
    return (block.timestamp > lastTimestamp + interval, "");
  }

  function performUpkeep(
    bytes calldata /* performData */
  ) external {
    // Check
    if (block.timestamp <= lastTimestamp + interval)
      revert EmissionBridgeKeeper_NotPassInterval();

    // Effect
    lastTimestamp = block.timestamp;
    forwarder.forwardToken();

    emit LogEmissionBridgeKeeper(lastTimestamp);
  }

  function setInterval(uint256 _interval) external onlyOwner {
    uint256 _prevInterval = interval;
    interval = _interval;
    emit LogSetInterval(_prevInterval, _interval);
  }
}
