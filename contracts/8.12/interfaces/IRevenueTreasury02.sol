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

interface IRevenueTreasury02 {
  function token() external view returns (address);

  function treasuryBuybackStrategy() external view returns (address);

  function initiateBuybackStrategy() external;

  function stopBuybackStrategy() external;

  function swapStrategy(uint256 _amountIn) external;

  function feedRevenueDistributor() external;
}
