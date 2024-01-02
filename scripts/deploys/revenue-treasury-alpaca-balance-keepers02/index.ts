import { ethers } from "hardhat";
import { RevenueTreasuryAlpacaBalanceKeepers02__factory } from "../../../typechain";

async function main() {
  const NAME = "Revenue Treasury Alpaca Balance Keepers02";
  const REVENUE_TREASURY_ADDRESS = "0x08B5A95cb94f926a8B620E87eE92e675b35afc7E";
  const ALPACA_TOKEN_ADDRESS = "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F";
  const TRIGGER_WEI = ethers.utils.parseEther("5000");

  const RevenueTreasuryAlpacaBalanceKeepers02 =
    (await ethers.getContractFactory(
      "RevenueTreasuryAlpacaBalanceKeepers02"
    )) as RevenueTreasuryAlpacaBalanceKeepers02__factory;
  const revenueTreasuryAlpacaBalanceKeepers02 =
    await RevenueTreasuryAlpacaBalanceKeepers02.deploy(
      NAME,
      REVENUE_TREASURY_ADDRESS,
      ALPACA_TOKEN_ADDRESS,
      TRIGGER_WEI
    );

  await revenueTreasuryAlpacaBalanceKeepers02.deployTransaction.wait(3);

  console.log(
    "RevenueTreasuryAlpacaBalanceKeepers02 deployed to:",
    revenueTreasuryAlpacaBalanceKeepers02.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
