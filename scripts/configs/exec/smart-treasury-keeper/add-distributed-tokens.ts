import { ethers } from "hardhat";
import { SmartTreasuryDistributeKeeper__factory } from "../../../../typechain";

async function main() {
  const smartTreasuryKeeper = "";
  const DISTRIBUTED_TOKENS: Array<string> = [
    "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  ];

  const deployer = (await ethers.getSigners())[0];

  const smartTreasuryDistributeKeeper =
    SmartTreasuryDistributeKeeper__factory.connect(
      smartTreasuryKeeper,
      deployer
    );

  console.log("> Setting distributed tokens...");
  const addDistributeTokentx =
    await smartTreasuryDistributeKeeper.addDistributedTokens(
      DISTRIBUTED_TOKENS
    );
  console.log("> ⛓ Tx is submitted:", addDistributeTokentx.hash);
  console.log("> ⏳ Waiting for tx to be mined...");
  await addDistributeTokentx.wait(3);
  console.log("> ✅ Tx is mined");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
