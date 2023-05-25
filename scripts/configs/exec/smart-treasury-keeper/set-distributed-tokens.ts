import { ethers } from "hardhat";
import { SmartTreasuryDistributeKeeper__factory } from "../../../../typechain";
import { BigNumberish, Bytes } from "ethers";

async function main() {
  const deployer = (await ethers.getSigners())[0];
  const smartTreasuryAddress = "0x0000000000000000000000000000000000000000";
  const smartTreasuryDistributeKeeper =
    SmartTreasuryDistributeKeeper__factory.connect(
      smartTreasuryAddress,
      deployer
    );

  // TODO: pending distributed tokens
  const DISTRIBUTED_TOKENS: Array<string> = [
    "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  ];

  console.log("> Setting distributed tokens...");
  const setDistributeTokentx =
    await smartTreasuryDistributeKeeper.setDistributedTokens(
      DISTRIBUTED_TOKENS
    );
  console.log("> ⛓ Tx is submitted:", setDistributeTokentx.hash);
  console.log("> ⏳ Waiting for tx to be mined...");
  await setDistributeTokentx.wait(3);
  console.log("> ✅ Tx is mined");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
