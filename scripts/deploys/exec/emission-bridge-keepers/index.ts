import { ethers } from "hardhat";
import { EmissionBridgeKeepers__factory } from "../../../../typechain";

async function main() {
  const NAME = "";
  const FORWARDER = "";
  const INTERVAL = 86400;

  const EmissionBridgeKeepers = (await ethers.getContractFactory(
    "EmissionBridgeKeepers"
  )) as EmissionBridgeKeepers__factory;
  const emissionBridgeKeepers = await EmissionBridgeKeepers.deploy(
    NAME,
    FORWARDER,
    INTERVAL
  );

  await emissionBridgeKeepers.deployTransaction.wait(3);

  console.log(
    "EmissionBridgeKeepers deployed to:",
    emissionBridgeKeepers.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
