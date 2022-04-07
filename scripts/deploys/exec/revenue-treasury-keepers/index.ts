import { ethers } from "hardhat";
import { RevenueTreasuryKeepers__factory } from "../../../../typechain";

async function main() {
  const NAME = "Revenue Treasury Keepers";
  const REVENUE_TREASURY_ADDRESS = "0x08B5A95cb94f926a8B620E87eE92e675b35afc7E";
  const TRIGGER_WEI = ethers.utils.parseEther("5000");

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
