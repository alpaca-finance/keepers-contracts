import { ethers } from "hardhat";
import { AlpacaMoneyMarketRewardsKeeper__factory } from "../../../../typechain";
import { BigNumberish } from "ethers";

interface SetRewardInfoParams {
  timestamp: BigNumberish;
  rewards: BigNumberish;
}

async function main() {
  const PARAMS: Array<SetRewardInfoParams> = [
    {
      timestamp: 1686182400,
      rewards: ethers.utils.parseEther("86000"),
    },
  ];

  const deployer = (await ethers.getSigners())[0];
  const alperpLiquidityMiningKeeper =
    AlpacaMoneyMarketRewardsKeeper__factory.connect(
      "0x59FFc3859B79aDb5fE15d58d82e450916595e23d",
      deployer
    );

  const timestamps = PARAMS.map((param) => param.timestamp);
  const rewardInfos = PARAMS.map((param) => param.rewards);

  console.log("> Setting reward info...");
  const tx = await alperpLiquidityMiningKeeper.setRewardInfo(
    timestamps,
    rewardInfos
  );
  console.log("> ⛓ Tx is submitted:", tx.hash);
  console.log("> ⏳ Waiting for tx to be mined...");
  await tx.wait(3);
  console.log("> ✅ Tx is mined");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
