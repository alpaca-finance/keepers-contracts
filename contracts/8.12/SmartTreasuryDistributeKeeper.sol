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

import { Ownable } from "contracts/8.12/libs/Ownable.sol";
import { IntervalKeepers } from "contracts/8.12/libs/IntervalKeepers.sol";
import { ISmartTreasury } from "./interfaces/ISmartTreasury.sol";
import { IAdminFacet } from "./interfaces/IAdminFacet.sol";

contract SmartTreasuryDistributeKeeper is IntervalKeepers {
  event LogPerformUpkeep(uint256 _timestamp);
  event LogSetWithdrawProtocolReserveParams(
    IAdminFacet.WithdrawProtocolReserveParam[] _withdrawProtocolReserveParams
  );
  event LogSetDistributedTokens(address[] _distributedTokens);

  address[] public distributedTokens;
  IAdminFacet.WithdrawProtocolReserveParam[]
    public withdrawProtocolReserveParams;

  IAdminFacet public moneyMarket;
  ISmartTreasury public smartTreasury;

  constructor(
    string memory _name,
    uint256 _interval,
    address _moneyMarket,
    address _smartTreasury
  ) IntervalKeepers(_name, _interval) {
    smartTreasury = ISmartTreasury(_smartTreasury);
    moneyMarket = IAdminFacet(_moneyMarket);
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

    // Interaction

    // 1. Withdraw from money market to smart treasury
    moneyMarket.withdrawProtocolReserves(withdrawProtocolReserveParams);
    // 2. Smart Treasury distrbute to other treasury
    smartTreasury.distribute(distributedTokens);

    emit LogPerformUpkeep(block.timestamp);
  }

  function resetWithdrawProtocolReserveParams() public onlyOwner {
    while (withdrawProtocolReserveParams.length != 0) {
      withdrawProtocolReserveParams.pop();
    }
  }

  function setWithdrawProtocolReserveParams(
    IAdminFacet.WithdrawProtocolReserveParam[]
      calldata _withdrawProtocolReserveParams
  ) external onlyOwner {
    uint256 _length = _withdrawProtocolReserveParams.length;

    for (uint256 _i; _i < _length; ) {
      withdrawProtocolReserveParams.push(_withdrawProtocolReserveParams[_i]);

      unchecked {
        ++_i;
      }
    }
    emit LogSetWithdrawProtocolReserveParams(_withdrawProtocolReserveParams);
  }

  function setDistributedTokens(
    address[] calldata _distributedTokens
  ) external onlyOwner {
    distributedTokens = _distributedTokens;
    emit LogSetDistributedTokens(_distributedTokens);
  }
}
