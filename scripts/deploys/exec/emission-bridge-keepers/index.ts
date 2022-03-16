import { ethers } from "hardhat";
import { EmissionBridgeKeepers__factory } from "../../../../typechain";

async function main() {
  const NAME = "Fantom Emission Keepers";
  const FORWARDER = "0x4F4054B4D286213a39cA5b8eF89116AC62c1cf43";
  const TRIGGER_WEI = ethers.utils.parseEther("10000");

  const EmissionBridgeKeepers = (await ethers.getContractFactory(
    "EmissionBridgeKeepers"
  )) as EmissionBridgeKeepers__factory;
  const emissionBridgeKeepers = await EmissionBridgeKeepers.deploy(
    NAME,
    FORWARDER,
    TRIGGER_WEI
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
