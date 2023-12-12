import { ethers } from "hardhat";
import { RevenueTreasuryKeepers02__factory } from "../../../../typechain";

async function main() {
  const NAME = "Revenue Treasury Keepers02";
  const REVENUE_TREASURY_ADDRESS = "0x08B5A95cb94f926a8B620E87eE92e675b35afc7E";
  const TRIGGER_WEI = ethers.utils.parseEther("1500");
  const TIME_LIMIT = 7200;

  const RevenueTreasuryKeepers02 = (await ethers.getContractFactory(
    "RevenueTreasuryKeepers02"
  )) as RevenueTreasuryKeepers02__factory;
  const revenueTreasuryKeepers02 = await RevenueTreasuryKeepers02.deploy(
    NAME,
    REVENUE_TREASURY_ADDRESS,
    TRIGGER_WEI,
    TIME_LIMIT
  );

  await revenueTreasuryKeepers02.deployTransaction.wait(3);

  console.log(
    "RevenueTreasuryKeepers02 deployed to:",
    revenueTreasuryKeepers02.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
