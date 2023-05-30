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
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SmartTreasuryDistributeKeeper is IntervalKeepers {
  event LogPerformUpkeep(uint256 _timestamp);
  event LogAddDistributedToken(address _token);
  event LogSetDistributedTokens(address[] _distributedTokens);
  event LogWithdraw(address _to, address _token, uint256 _amount);

  address[] public distributedTokens;

  IMoneyMarket public immutable moneyMarket;
  ISmartTreasury public immutable smartTreasury;

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

  function addDistributedTokens(address[] calldata _tokens) external onlyOwner {
    uint256 _length = _tokens.length;

    for (uint256 _i; _i < _length; ) {
      distributedTokens.push(_tokens[_i]);
      emit LogAddDistributedToken(_tokens[_i]);
      unchecked {
        ++_i;
      }
    }
  }

  function setDistributedTokens(
    address[] calldata _distributedTokens
  ) external onlyOwner {
    distributedTokens = _distributedTokens;
    emit LogSetDistributedTokens(_distributedTokens);
  }

  function withdraw(
    address[] calldata _tokens,
    address _to
  ) external onlyOwner {
    uint256 _length = _tokens.length;
    for (uint256 _i; _i < _length; ) {
      _withdraw(_tokens[_i], _to);
      unchecked {
        ++_i;
      }
    }
  }

  function _withdraw(address _token, address _to) internal {
    uint256 _amount = IERC20(_token).balanceOf(address(this));
    IERC20(_token).transfer(_to, _amount);
    emit LogWithdraw(_to, _token, _amount);
  }
}
