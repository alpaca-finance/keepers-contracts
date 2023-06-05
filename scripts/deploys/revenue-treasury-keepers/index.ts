import { ethers } from "hardhat";
import { RevenueTreasuryKeepers__factory } from "../../../../typechain";

async function main() {
  const NAME = "Revenue Treasury Keepers";
  const REVENUE_TREASURY_ADDRESS = "0x795997Ad55AcFc27148E86408355eC08cA1424A0";
  const TRIGGER_WEI = ethers.utils.parseEther("2500");

  const RevenueTreasuryKeepers = (await ethers.getContractFactory(
    "RevenueTreasuryKeepers"
  )) as RevenueTreasuryKeepers__factory;
  const revenueTreasuryKeepers = await RevenueTreasuryKeepers.deploy(
    NAME,
    REVENUE_TREASURY_ADDRESS,
    TRIGGER_WEI
  );

  await revenueTreasuryKeepers.deployTransaction.wait(3);

  console.log(
    "RevenueTreasuryKeepers deployed to:",
    revenueTreasuryKeepers.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
