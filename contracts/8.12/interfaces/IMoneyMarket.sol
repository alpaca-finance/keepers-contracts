// SPDX-License-Identifier: BUSL
pragma solidity 0.8.12;

interface IMoneyMarket {
  struct WithdrawProtocolReserveParam {
    address token;
    address to;
    uint256 amount;
  }

  function getProtocolReserve(
    address _token
  ) external view returns (uint256 _reserve);

  function withdrawProtocolReserves(
    WithdrawProtocolReserveParam[] calldata _withdrawProtocolReserveParam
  ) external;
}
