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

interface IRevenueTreasury1 {
  function token() external view returns (address);

  function feedGrassHouse() external;

  function router() external view returns (address);

  function getRewardPath() external view returns (address[] memory);

  function getVaultSwapPath() external view returns (address[] memory);

  function splitBps() external view returns (uint256);

  function remaining() external view returns (uint256);
}
