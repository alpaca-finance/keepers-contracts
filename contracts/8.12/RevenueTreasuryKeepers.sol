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
import { KeeperCompatibleInterface } from "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import { IRevenueTreasury } from "./interfaces/IRevenueTreasury.sol";
import { ISwapRouter02Like } from "./interfaces/ISwapRouter02Like.sol";

/// @title Revenue Treasury Keepers - A Chainlink's Keepers compatible contract
/// for up keep ALPACA to be distributed or settle for bad debts.
/// @author spicysquid168
// solhint-disable not-rely-on-time
contract RevenueTreasuryKeepers is
  Ownable,
  ReentrancyGuard,
  BasicKeepers,
  KeeperCompatibleInterface
{
  /// Errors
  error RevenueTreasuryKeepers_NotPassTriggerWei();

  /// Configs
  IRevenueTreasury public revenueTreasury;
  uint256 public triggerWei;
  uint256 public slippageBps;

  /// Events
  event LogPerformUpkeep(uint256 _timestamp);
  event LogSetTriggerWei(uint256 _prevTriggerWei, uint256 _triggerWei);
  event LogSetSlippageBps(uint256 _prevSlippageBps, uint256 _slippageBps);

  constructor(
    string memory _name,
    IRevenueTreasury _revenueTreausry,
    uint256 _triggerWei
  ) BasicKeepers(_name) {
    // Effect
    revenueTreasury = _revenueTreausry;
    triggerWei = _triggerWei;
  }

  function checkUpkeep(
    bytes calldata /* _checkData */
  ) external view override returns (bool, bytes memory) {
    // SLOAD
    uint256 _balanceOfRevenueTreasury = IERC20(revenueTreasury.token())
      .balanceOf(address(revenueTreasury));
    uint256 _slippageBps = slippageBps;

    if (_balanceOfRevenueTreasury < triggerWei) {
      return (false, "");
    }

    // Query required parameters
    ISwapRouter02Like _router = ISwapRouter02Like(revenueTreasury.router());
    uint256 _splitBps = revenueTreasury.splitBps();
    uint256 _remaining = revenueTreasury.remaining();
    address[] memory _rewardPath = revenueTreasury.getRewardPath();
    address[] memory _vaultSwapPath = revenueTreasury.getVaultSwapPath();

    // Calculate amount out for each path
    uint256 _maxBadDebtPart = (_balanceOfRevenueTreasury * _splitBps) / 10000;
    uint256 _canSettle = _remaining > _maxBadDebtPart
      ? _maxBadDebtPart
      : _remaining;

    // What if _canSettle is 0?
    uint256 _minVaultAmountOut = 0;
    if (_canSettle > 0) {
      uint256[] memory _vaultSwapAmountsOut = _router.getAmountsOut(
        _maxBadDebtPart,
        _vaultSwapPath
      );
      _minVaultAmountOut =
        (_vaultSwapAmountsOut[_vaultSwapAmountsOut.length - 1] *
          (10000 - _slippageBps)) /
        10000;
    }

    // amountIn here cannot be zero because:
    //  _balanceOfRevenueTreasury >= _canSettle && _balanceOfRevenueTreasury >= triggerWei
    uint256[] memory _rewardAmountsOut = _router.getAmountsOut(
      _balanceOfRevenueTreasury - _canSettle,
      _rewardPath
    );

    return (
      true,
      abi.encode(
        _minVaultAmountOut,
        (_rewardAmountsOut[_rewardAmountsOut.length - 1] *
          (10000 - _slippageBps)) / 10000
      )
    );
  }

  function performUpkeep(bytes calldata _performData) external nonReentrant {
    // Check
    // SLOAD
    uint256 _balanceOfRevenueTreasury = IERC20(revenueTreasury.token())
      .balanceOf(address(revenueTreasury));
    if (_balanceOfRevenueTreasury < triggerWei)
      revert RevenueTreasuryKeepers_NotPassTriggerWei();

    (uint256 _vaultSwapAmountOut, uint256 _rewardAmountOut) = abi.decode(
      _performData,
      (uint256, uint256)
    );

    // Interaction
    revenueTreasury.feedGrassHouse(_vaultSwapAmountOut, _rewardAmountOut);

    emit LogPerformUpkeep(block.timestamp);
  }

  function setTriggerWei(uint256 _triggerWei) external onlyOwner {
    // Effect
    uint256 _prevTriggerWei = _triggerWei;
    triggerWei = _triggerWei;

    emit LogSetTriggerWei(_prevTriggerWei, _triggerWei);
  }

  function setSlippageBps(uint256 _slippageBps) external onlyOwner {
    // Check
    require(_slippageBps <= 100, "slippageBps too high");

    // Effect
    emit LogSetSlippageBps(slippageBps, _slippageBps);
    slippageBps = _slippageBps;
  }
}
