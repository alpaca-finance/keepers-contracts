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
import { ISmartTreasury } from "./interfaces/ISmartTreasury.sol";
import { IMoneyMarket } from "./interfaces/IMoneyMarket.sol";

contract SmartTreasuryDistributeKeeper is IntervalKeepers {
  event LogPerformUpkeep(uint256 _timestamp);
  event LogSetDistributedTokens(address[] _distributedTokens);

  address[] public distributedTokens;

  IMoneyMarket public moneyMarket;
  ISmartTreasury public smartTreasury;

  constructor(
    string memory _name,
    uint256 _interval,
    address _moneyMarket,
    address _smartTreasury
  ) IntervalKeepers(_name, _interval) {
    smartTreasury = ISmartTreasury(_smartTreasury);
    moneyMarket = IMoneyMarket(_moneyMarket);
  }

  function checkUpkeep(
    bytes calldata _checkData
  ) external view returns (bool, bytes memory) {
    return _checkUpkeep(_checkData);
  }

  function performUpkeep(
    bytes calldata /* _performData */
  ) external onlyIntervalPassed {
    // Effect
    lastTimestamp = block.timestamp;

    // setup amount, withdraw tokens
    uint256 _distritbutedTokenLength = distributedTokens.length;
    IMoneyMarket.WithdrawProtocolReserveParam[]
      memory _withdrawParams = new IMoneyMarket.WithdrawProtocolReserveParam[](
        _distritbutedTokenLength
      );
    for (uint256 _i; _i < _distritbutedTokenLength; ) {
      address _token = distributedTokens[_i];
      _withdrawParams[_i] = IMoneyMarket.WithdrawProtocolReserveParam(
        _token,
        address(smartTreasury),
        moneyMarket.getProtocolReserve(_token)
      );
      unchecked {
        ++_i;
      }
    }
    // Interaction

    // 1. Withdraw from money market to smart treasury
    moneyMarket.withdrawProtocolReserves(_withdrawParams);
    // 2. Smart Treasury distrbute to other treasury
    smartTreasury.distribute(distributedTokens);

    emit LogPerformUpkeep(block.timestamp);
  }

  function setDistributedTokens(
    address[] calldata _distributedTokens
  ) external onlyOwner {
    distributedTokens = _distributedTokens;
    emit LogSetDistributedTokens(_distributedTokens);
  }
}
