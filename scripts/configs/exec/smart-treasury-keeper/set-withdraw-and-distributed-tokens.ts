import { ethers } from "hardhat";
import { SmartTreasuryDistributeKeeper__factory } from "../../../../typechain";
import { BigNumberish, Bytes } from "ethers";

async function main() {
  const deployer = (await ethers.getSigners())[0];
  // TODO:
  const smartTreasuryDistributeKeeper =
    SmartTreasuryDistributeKeeper__factory.connect("0x", deployer);

  const WBNB = "0x";
  const DISTRIBUTED_TOKENS: Array<string> = [WBNB];

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
