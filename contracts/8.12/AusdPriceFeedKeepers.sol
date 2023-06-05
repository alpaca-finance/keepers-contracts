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
import { KeeperCompatibleInterface } from "@chainlink/contracts/src/v0.8/automation/KeeperCompatible.sol";
import { IPriceFeedWithDelay } from "./interfaces/IPriceFeedWithDelay.sol";

/// @title AusdPriceFeedKeepers - A Chainlink's Keepers to calling set prices on
/// AUSD's the PriceFeed contract to make sure price is update consistently
/// @author spicysquid168
// solhint-disable not-rely-on-time
contract AusdPriceFeedKeepers is IntervalKeepers, KeeperCompatibleInterface {
  /// Errors
  error AusdPriceFeedKeepers_BadLength();
  error AusdPriceFeedKeepers_NotPassInterval();

  /// Configs
  IPriceFeedWithDelay[] public priceFeeders;
  bytes32[] public calldatas;

  /// Events
  event LogPerformUpkeep(uint256 _timestamp);
  event LogSetPriceFeedWithDelay(
    IPriceFeedWithDelay[] _prevPriceFeeders,
    IPriceFeedWithDelay[] _newPriceFeeders
  );
  event LogSetCalldatas(bytes32[] _prevCalldatas, bytes32[] _newCalldatas);

  constructor(
    string memory _name,
    IPriceFeedWithDelay[] memory _priceFeeders,
    bytes32[] memory _calldatas,
    uint256 _interval
  ) IntervalKeepers(_name, _interval) {
    // Check
    if (_priceFeeders.length != _calldatas.length)
      revert AusdPriceFeedKeepers_BadLength();

    // Effect
    priceFeeders = _priceFeeders;
    calldatas = _calldatas;
  }

  function checkUpkeep(
    bytes calldata _checkData
  ) external view override returns (bool, bytes memory) {
    return _checkUpkeep(_checkData);
  }

  function performUpkeep(
    bytes memory /* _performData */
  ) external onlyIntervalPassed {
    // Effect
    lastTimestamp = block.timestamp;
    uint256 len = priceFeeders.length;
    for (uint256 i; i < len; ) {
      if (calldatas[i] != "") priceFeeders[i].setPrice(calldatas[i]);
      else priceFeeders[i].setPrice();

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

  function setPriceFeeders(
    IPriceFeedWithDelay[] memory _newPriceFeeders,
    bytes32[] memory _newCalldatas
  ) external onlyOwner {
    // Check
    if (_newPriceFeeders.length != _newCalldatas.length)
      revert AusdPriceFeedKeepers_BadLength();

    // Effect
    IPriceFeedWithDelay[] memory _prevPriceFeeders = priceFeeders;
    bytes32[] memory _prevCalldatas = calldatas;

    priceFeeders = _newPriceFeeders;
    calldatas = _newCalldatas;

    // Logs
    emit LogSetPriceFeedWithDelay(_prevPriceFeeders, _newPriceFeeders);
    emit LogSetCalldatas(_prevCalldatas, _newCalldatas);
  }
}
