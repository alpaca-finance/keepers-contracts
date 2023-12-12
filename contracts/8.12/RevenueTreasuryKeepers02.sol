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
contract RevenueTreasuryKeepers02 is
  Ownable,
  ReentrancyGuard,
  BasicKeepers,
  KeeperCompatibleInterface
{
  /// Errors
  error RevenueTreasuryKeepers02_NotPassTriggerWei();
  error RevenueTreasuryKeepers02_TimeLimitTooLow();

  /// Configs
  IRevenueTreasury02 public revenueTreasury02;
  uint256 public triggerWei;
  uint256 public slippageBps;
  uint256 public timeLimit;
  uint256 public initiateAt;

  /// Events
  event LogPerformUpkeep(uint256 _timestamp);
  event LogSetTriggerWei(uint256 _prevTriggerWei, uint256 _triggerWei);
  event LogSetTimeLimit(uint256 _prevTimeLimit, uint256 _timeLimit);

  //--------- Enum --------------//
  enum TreasuryBuybackAction {
    INITIATE,
    TERMINATE
  }

  constructor(
    string memory _name,
    IRevenueTreasury02 _revenueTreausry02,
    uint256 _triggerWei,
    uint256 _timeLimit
  ) BasicKeepers(_name) {
    // Effect
    revenueTreasury02 = _revenueTreausry02;
    triggerWei = _triggerWei;
    // validate timelimit to prevent terminate lp right after initiate buyback
    if (_timeLimit < 600) {
      revert RevenueTreasuryKeepers02_TimeLimitTooLow();
    }

    timeLimit = _timeLimit;
  }

  function checkUpkeep(
    bytes calldata /* _checkData */
  ) external view override returns (bool, bytes memory) {
    ITreasuryBuybackStrategy _treasuryBuybackStrategy = ITreasuryBuybackStrategy(
        revenueTreasury02.treasuryBuybackStrategy()
      );

    // buyback strategy not initiate
    if (_treasuryBuybackStrategy.nftTokenId() == 0) {
      uint256 _balanceOfRevenueTreasury = IERC20(revenueTreasury02.token())
        .balanceOf(address(revenueTreasury02));

      // initiate buyback strategy when balance surpass threshold
      if (_balanceOfRevenueTreasury >= triggerWei) {
        return (true, abi.encode(TreasuryBuybackAction.INITIATE));
      }
    } else {
      address _accumulatedToken = _treasuryBuybackStrategy.accumToken();
      (uint256 _token0Amount, uint256 _token1Amount) = _treasuryBuybackStrategy
        .getAmountsFromPositionLiquidity();

      // verify close logic here
      bool _buybackComplete;
      if (
        (_accumulatedToken == _treasuryBuybackStrategy.token0() &&
          _token1Amount == 0) ||
        (_accumulatedToken == _treasuryBuybackStrategy.token1() &&
          _token0Amount == 0)
      ) {
        _buybackComplete = true;
      }

      if (
        block.timestamp > initiateAt + timeLimit || _buybackComplete
      ) // close strategy once reach timelimit or buyback complete
      {
        return (true, abi.encode(TreasuryBuybackAction.TERMINATE));
      }
    }

    return (false, "");
  }

  function performUpkeep(bytes calldata _performData) external nonReentrant {
    // Check

    TreasuryBuybackAction _treasuryBuybackAction = abi.decode(
      _performData,
      (TreasuryBuybackAction)
    );

    IRevenueTreasury02 _revenueTreasury02 = revenueTreasury02;
    IERC20 _revenueTreasuryToken = IERC20(_revenueTreasury02.token());

    if (_treasuryBuybackAction == TreasuryBuybackAction.INITIATE) {
      initiateAt = block.timestamp;

      _revenueTreasury02.initiateBuybackStrategy();
    } else if (_treasuryBuybackAction == TreasuryBuybackAction.TERMINATE) {
      initiateAt = 0;

      uint256 _balanceOfRevenueTreasuryBefore = _revenueTreasuryToken.balanceOf(
        address(_revenueTreasury02)
      );

      // remove liquidity
      _revenueTreasury02.stopBuybackStrategy();

      uint256 _swapAmount = _revenueTreasuryToken.balanceOf(
        address(_revenueTreasury02)
      ) - _balanceOfRevenueTreasuryBefore;

      // swap reaming token
      // check against 1e18 to prevent precision loss when _swapAmount is very small
      if (_swapAmount > 1e18) {
        _revenueTreasury02.swapStrategy(_swapAmount);
      }

      // feed to revenueDistributor
      _revenueTreasury02.feedRevenueDistributor();
    }

    emit LogPerformUpkeep(block.timestamp);
  }

  function setTriggerWei(uint256 _triggerWei) external onlyOwner {
    // Effect
    uint256 _prevTriggerWei = _triggerWei;
    triggerWei = _triggerWei;

    emit LogSetTriggerWei(_prevTriggerWei, _triggerWei);
  }

  function setTimeLimit(uint256 _timeLimit) external onlyOwner {
    if (_timeLimit < 600) {
      revert RevenueTreasuryKeepers02_TimeLimitTooLow();
    }
    // Effect
    uint256 _prevTimeLimit = _timeLimit;
    timeLimit = _timeLimit;

    emit LogSetTimeLimit(_prevTimeLimit, _timeLimit);
  }
}
