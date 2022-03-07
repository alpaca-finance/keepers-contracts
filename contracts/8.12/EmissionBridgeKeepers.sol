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
import { IntervalKeepers } from "./libs/IntervalKeepers.sol";
import { KeeperCompatibleInterface } from "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import { IEmissionForwarder } from "./interfaces/IEmissionForwarder.sol";

/// @title Emission Bridge Keeper - A Chainlink's Keepers compatible contract
/// for forwarding ALPACA emission to the target chain.
/// @dev The downstream contract must implement the IEmissionForwarder interface.
/// @author spicysquid168
// solhint-disable not-rely-on-time
contract EmissionBridgeKeepers is
  Ownable,
  IntervalKeepers,
  KeeperCompatibleInterface
{
  /// Errors
  error EmissionBridgeKeeper_NotPassInterval();

  /// Configs
  IEmissionForwarder public forwarder;

  /// Events
  event LogPerformUpkeep(uint256 _timestamp);

  constructor(
    string memory _name,
    IEmissionForwarder _forwarder,
    uint256 _interval
  ) IntervalKeepers(_name, _interval) {
    // Effect
    forwarder = _forwarder;
  }

  function checkUpkeep(bytes calldata _checkData)
    external
    view
    override
    returns (bool, bytes memory)
  {
    return _checkUpkeep(_checkData);
  }

  function performUpkeep(
    bytes calldata /* _performData */
  ) external onlyIntervalPassed {
    // Effect
    lastTimestamp = block.timestamp;
    forwarder.forwardToken();

    emit LogPerformUpkeep(lastTimestamp);
  }
}
