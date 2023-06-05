import { ethers } from "hardhat";
import { SmartTreasuryDistributeKeeper__factory } from "../../../../typechain";

async function main() {
  const smartTreasuryKeeper = "";

  const DISTRIBUTED_TOKENS: Array<string> = [
    // WBNB
    "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    // USDC
    "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    // USDT
    "0x55d398326f99059fF775485246999027B3197955",
    // BUSD
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    // BTCB
    "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    // ETH
    "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    // HIGH
    "0x5f4Bde007Dc06b867f86EBFE4802e34A1fFEEd63",
    // CAKE
    "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    // XRP
    "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE",
  ];

  const deployer = (await ethers.getSigners())[0];

  const smartTreasuryDistributeKeeper =
    SmartTreasuryDistributeKeeper__factory.connect(
      smartTreasuryKeeper,
      deployer
    );

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
