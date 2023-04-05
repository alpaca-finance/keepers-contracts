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
import { IntervalKeepers } from "./libs/IntervalKeepers.sol";
import { KeeperCompatibleInterface } from "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import { IRevenueTreasury1 } from "./interfaces/IRevenueTreasury1.sol";

/// @title Time-based Revenue Treasury Keeper - A Chainlink's Keepers compatible contract
/// for up keep ALPACA to be distributed and settle for bad debts time-based.
/// @author spicysquid168
// solhint-disable not-rely-on-time
contract TimeBasedRevenueTreasuryKeeper is
  Ownable,
  ReentrancyGuard,
  IntervalKeepers
{
  /// Configs
  IRevenueTreasury1 public revenueTreasury;

  /// Events
  event LogPerformUpkeep(uint256 _timestamp);

  constructor(
    string memory _name,
    IRevenueTreasury1 _revenueTreausry,
    uint256 _interval
  ) IntervalKeepers(_name, _interval) {
    // Effect
    revenueTreasury = _revenueTreausry;
  }

  function checkUpkeep(bytes calldata _checkData)
    external
    view
    returns (bool, bytes memory)
  {
    return _checkUpkeep(_checkData);
  }

  function performUpkeep(
    bytes calldata /* _performData */
  ) external onlyIntervalPassed {
    // Effect
    lastTimestamp = block.timestamp;

    // Interaction
    revenueTreasury.feedGrassHouse();

    emit LogPerformUpkeep(block.timestamp);
  }
}
