// SPDX-License-Identifier: WTF
pragma solidity 0.8.12;

/// OZ
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// Alpaca Keepers
import { Ownable } from "@alpaca-keepers/libs/Ownable.sol";
import { BasicKeepers } from "@alpaca-keepers/libs/BasicKeepers.sol";
import { IAlperpFeedableRewarder } from "@alpaca-keepers/interfaces/IAlperpFeedableRewarder.sol";
import { IAlperpParadeen } from "@alpaca-keepers/interfaces/IAlperpParadeen.sol";

// solhint-disable not-rely-on-time
contract AlperpLiquidityMiningKeeper is Ownable, BasicKeepers {
  /// Constants
  uint256 public constant WEEK = 7 days;

  /// Configs
  IERC20 public alpaca;
  IAlperpFeedableRewarder public alperpFeedableRewarder;
  IAlperpParadeen public alperpParadeen;
  struct RewardInfo {
    uint256 lpRewards;
    uint256 traderRewards;
  }
  mapping(uint256 => RewardInfo) public rewardsAt;
  address public rewardSource;

  /// States
  uint256 public lastUpKeepAt;

  /// Events
  event LogPerformUpkeep(uint256 timestamp);
  event LogSetRewardSource(address prevRewardSource, address newRewardSource);

  constructor(
    IERC20 alpaca_,
    IAlperpFeedableRewarder alperpFeedableRewarder_,
    IAlperpParadeen alperpParadeen_,
    address rewardSource_
  ) BasicKeepers("AlperpLiquidityMiningKeeper") {
    alpaca = alpaca_;
    alperpFeedableRewarder = alperpFeedableRewarder_;
    alperpParadeen = alperpParadeen_;
    lastUpKeepAt = _floorWeek(block.timestamp);
    rewardSource = rewardSource_;

    alpaca.approve(address(alperpFeedableRewarder), type(uint256).max);
    alpaca.approve(address(alperpParadeen), type(uint256).max);
  }

  function _floorWeek(uint256 timestamp) internal pure returns (uint256) {
    return (timestamp / WEEK) * WEEK;
  }

  function _nextWeek(uint256 timestamp) internal pure returns (uint256) {
    return (timestamp / WEEK + 1) * WEEK;
  }

  function checkUpkeep(
    bytes calldata /* data */
  ) external view returns (bool, bytes memory) {
    return (_floorWeek(block.timestamp) > _floorWeek(lastUpKeepAt), "");
  }

  function setRewardSource(address rewardSource_) external onlyOwner {
    emit LogSetRewardSource(rewardSource, rewardSource_);
    rewardSource = rewardSource_;
  }

  function setRewardInfo(
    uint256[] calldata timestamps,
    RewardInfo[] calldata rewardInfos
  ) external onlyOwner {
    require(timestamps.length == rewardInfos.length, "bad len");
    for (uint256 i = 0; i < timestamps.length; i++) {
      rewardsAt[_floorWeek(timestamps[i])] = rewardInfos[i];
    }
  }

  function performUpkeep(
    bytes calldata /* data */
  ) external {
    // Check
    require(_floorWeek(block.timestamp) > _floorWeek(lastUpKeepAt), "NR");

    // Perform
    // Find out which reward info to use
    uint256 week = _floorWeek(block.timestamp);
    RewardInfo memory rewardInfo = rewardsAt[week];

    // Collect rewards from "rewardSource"
    alpaca.transferFrom(
      rewardSource,
      address(this),
      rewardInfo.lpRewards + rewardInfo.traderRewards
    );

    // Effect
    lastUpKeepAt = block.timestamp;

    // Feed rewards to related contract.
    // Feed to LP rewards for ALP
    alperpFeedableRewarder.feedWithExpiredAt(
      rewardInfo.lpRewards,
      _nextWeek(block.timestamp)
    );

    // Feed to Paradeen for traders
    uint256[] memory timestamps = new uint256[](1);
    timestamps[0] = week;
    uint256[] memory amounts = new uint256[](1);
    amounts[0] = rewardInfo.traderRewards;
    alperpParadeen.feed(timestamps, amounts);

    emit LogPerformUpkeep(block.timestamp);
  }
}
