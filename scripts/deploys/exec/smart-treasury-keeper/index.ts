import { ethers } from "hardhat";
import { SmartTreasuryDistributeKeeper__factory } from "../../../../typechain";

async function main() {
  const NAME = "Smart Treasury Distribute Keeper";
  const MONEY_MARKET_ADDRESS = "0x7389aaf2e32872cABD766D0CEB384220e8F2A590";
  const SMART_TREASURY_ADDRESS = "";
  const INTERVAL = 86400;

  const SmartTreasuryDistributeKeeper = (await ethers.getContractFactory(
    "SmartTreasuryDistributeKeeper"
  )) as SmartTreasuryDistributeKeeper__factory;
  const smartTreasuryDistributeKeeper =
    await SmartTreasuryDistributeKeeper.deploy(
      NAME,
      INTERVAL,
      MONEY_MARKET_ADDRESS,
      SMART_TREASURY_ADDRESS
    );

  await smartTreasuryDistributeKeeper.deployTransaction.wait(3);

  console.log(
    "SmartTreasuryDistributeKeeper deployed to:",
    smartTreasuryDistributeKeeper.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
