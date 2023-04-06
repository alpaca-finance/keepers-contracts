// SPDX-License-Identifier: WTF
pragma solidity 0.8.12;

interface IAlperpFeedableRewarder {
  function feedWithExpiredAt(uint256 feedAmount, uint256 expiredAt) external;
}
