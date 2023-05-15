// SPDX-License-Identifier: BUSL
pragma solidity 0.8.12;

import { IAdminFacet } from "./IAdminFacet.sol";

interface IMoneyMarket is IAdminFacet {
  function getProtocolReserve(
    address _token
  ) external view returns (uint256 _reserve);
}
