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

import { IFairLaunch } from "./IFairLaunch.sol";

interface IEmissionForwarder {
  function fairLaunch() external view returns (IFairLaunch);

  function forwardToken() external;

  function fairLaunchPoolId() external view returns (uint256);
}
