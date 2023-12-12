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

interface ITreasuryBuybackStrategy {
  function openPosition(uint256 _desiredAmount) external;

  function closePosition() external;

  function swap(address _tokenIn, uint256 _amountIn) external;

  function nftTokenId() external view returns (uint256);

  function token0() external view returns (address);

  function token1() external view returns (address);

  function accumToken() external view returns (address);

  function getAmountsFromPositionLiquidity()
    external
    view
    returns (uint256 _amount0, uint256 _amount1);
}
