import { ethers } from "hardhat";
import { Aip15HarvestKeeper__factory } from "../../../../typechain";

async function main() {
  const NAME = "Aip15 Harvest Keeper";
  const INTERVAL = 60 * 60 * 24;
  const AIP15 = "0xFd42963E41BE196F05741c40FA4765739b3796B2";

  const Aip15HarvestKeeper = (await ethers.getContractFactory(
    "Aip15HarvestKeeper"
  )) as Aip15HarvestKeeper__factory;
  const aip15HarvestKeeper = await Aip15HarvestKeeper.deploy(
    NAME,
    INTERVAL,
    AIP15
  );

  await aip15HarvestKeeper.deployTransaction.wait(3);

  console.log("Aip15HarvestKeeper deployed to:", aip15HarvestKeeper.address);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
