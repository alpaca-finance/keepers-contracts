// SPDX-License-Identifier: MIT
pragma solidity 0.8.12;

interface IAlperpParadeen {
  function feed(uint256[] memory timestamps, uint256[] memory amounts) external;
}
