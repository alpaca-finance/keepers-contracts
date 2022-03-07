import { ethers } from "hardhat";
import { AusdPriceFeedKeepers__factory } from "../../../../typechain";

async function main() {
  const NAME = "";
  const PRICE_FEEDERS = [""];
  const INTERVAL = 15 * 60;

  const AusdPriceFeedKeepers = (await ethers.getContractFactory(
    "AusdPriceFeedKeepers"
  )) as AusdPriceFeedKeepers__factory;
  const ausdPriceFeedKeepers = await AusdPriceFeedKeepers.deploy(
    NAME,
    PRICE_FEEDERS,
    INTERVAL
  );

  await ausdPriceFeedKeepers.deployTransaction.wait(3);

  console.log(
    "AusdPriceFeedKeepers deployed to:",
    ausdPriceFeedKeepers.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
