// SPDX-License-Identifier: WTF
pragma solidity 0.8.12;

/// OZ
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// Alpaca Keepers
import { Ownable } from "@alpaca-keepers/libs/Ownable.sol";
import { BasicKeepers } from "@alpaca-keepers/libs/BasicKeepers.sol";

// solhint-disable not-rely-on-time
contract AlpacaMoneyMarketRewardsKeeper is Ownable, BasicKeepers {
  /// Constants
  uint256 public constant WEEK = 7 days;

  /// Configs
  IERC20 public alpaca;
  address public miniFairlaunch;
  mapping(uint256 => uint256) public rewardsAt;
  address public rewardSource;

  /// States
  uint256 public lastUpKeepAt;

  /// Events
  event LogPerformUpkeep(uint256 timestamp);
  event LogSetRewardSource(address prevRewardSource, address newRewardSource);

  constructor(
    IERC20 alpaca_,
    address miniFairlaunch_,
    address rewardSource_
  ) BasicKeepers("AlpacaMoneyMarketRewardsKeeper") {
    alpaca = alpaca_;
    miniFairlaunch = miniFairlaunch_;
    lastUpKeepAt = _floorWeek(block.timestamp);
    rewardSource = rewardSource_;
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
    uint256[] calldata rewardInfos
  ) external onlyOwner {
    require(timestamps.length == rewardInfos.length, "bad len");
    for (uint256 i = 0; i < timestamps.length; i++) {
      rewardsAt[_floorWeek(timestamps[i])] = rewardInfos[i];
    }
  }

  function performUpkeep(bytes calldata /* data */) external {
    // Check
    require(_floorWeek(block.timestamp) > _floorWeek(lastUpKeepAt), "NR");

    // Perform
    // Find out which reward info to use
    uint256 week = _floorWeek(block.timestamp);

    // Transfer rewards to MiniFairLaunch
    alpaca.transferFrom(rewardSource, miniFairlaunch, rewardsAt[week]);

    // Effect
    lastUpKeepAt = block.timestamp;

    emit LogPerformUpkeep(block.timestamp);
  }
}
