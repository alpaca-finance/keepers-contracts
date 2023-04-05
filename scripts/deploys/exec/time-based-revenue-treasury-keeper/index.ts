import { ethers } from "hardhat";
import { TimeBasedRevenueTreasuryKeeper__factory } from "../../../../typechain";

async function main() {
  const NAME = "Time-based Revenue Treasury Keepers";
  const REVENUE_TREASURY_ADDRESS = "0x795997Ad55AcFc27148E86408355eC08cA1424A0";
  const INTERVAL = 86400;

  const TimeBasedRevenueTreasuryKeeper = (await ethers.getContractFactory(
    "TimeBasedRevenueTreasuryKeeper"
  )) as TimeBasedRevenueTreasuryKeeper__factory;
  const timeBasedRevenueTreasuryKeeper =
    await TimeBasedRevenueTreasuryKeeper.deploy(
      NAME,
      REVENUE_TREASURY_ADDRESS,
      INTERVAL
    );

  await timeBasedRevenueTreasuryKeeper.deployTransaction.wait(3);

  console.log(
    "TimeBasedRevenueTreasuryKeeper deployed to:",
    timeBasedRevenueTreasuryKeeper.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
