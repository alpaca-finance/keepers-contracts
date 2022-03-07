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

import { IntervalKeepers } from "./libs/IntervalKeepers.sol";
import { KeeperCompatibleInterface } from "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import { IPriceFeedWithDelay } from "./interfaces/IPriceFeedWithDelay.sol";

/// @title AusdPriceFeedKeepers - A Chainlink's Keepers to calling set prices on
/// AUSD's the PriceFeed contract to make sure price is update consistently
/// @author spicysquid168
// solhint-disable not-rely-on-time
contract AusdPriceFeedKeepers is IntervalKeepers, KeeperCompatibleInterface {
  /// Errors
  error AusdPriceFeedKeepers_NotPassInterval();

  /// Configs
  IPriceFeedWithDelay[] public priceFeeders;

  /// Events
  event LogPerformUpkeep(uint256 _timestamp);
  event LogSetPriceFeedWithDelay(
    IPriceFeedWithDelay[] _prevPriceFeeders,
    IPriceFeedWithDelay[] _newPriceFeeders
  );

  constructor(
    string memory _name,
    IPriceFeedWithDelay[] memory _priceFeeders,
    uint256 _interval
  ) IntervalKeepers(_name, _interval) {
    priceFeeders = _priceFeeders;
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
    bytes memory /* _performData */
  ) external onlyIntervalPassed {
    // Effect
    lastTimestamp = block.timestamp;
    uint256 len = priceFeeders.length;
    for (uint256 i; i < len; ) {
      priceFeeders[i].setPrice();
      unchecked {
        i++;
      }
    }

    // Logs
    emit LogPerformUpkeep(block.timestamp);
  }

  function priceFeedersLength() external view returns (uint256) {
    return priceFeeders.length;
  }

  function setPriceFeeders(IPriceFeedWithDelay[] memory _priceFeeders)
    external
    onlyOwner
  {
    // Effect
    IPriceFeedWithDelay[] memory _prevPriceFeeders = priceFeeders;
    priceFeeders = _priceFeeders;

    // Logs
    emit LogSetPriceFeedWithDelay(_prevPriceFeeders, _priceFeeders);
  }
}
