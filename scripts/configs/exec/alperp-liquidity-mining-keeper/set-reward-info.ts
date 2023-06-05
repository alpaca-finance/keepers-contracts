import { ethers } from "hardhat";
import { AlperpLiquidityMiningKeeper__factory } from "../../../../typechain";
import { BigNumberish } from "ethers";

interface SetRewardInfoParams {
  timestamp: BigNumberish;
  lpRewards: BigNumberish;
  traderRewards: BigNumberish;
}

async function main() {
  const PARAMS: Array<SetRewardInfoParams> = [
    // {
    //   timestamp: 1683158400,
    //   lpRewards: ethers.utils.parseEther("32000"),
    //   traderRewards: ethers.utils.parseEther("48000"),
    // },
    // {
    //   timestamp: 1683763200,
    //   lpRewards: ethers.utils.parseEther("32000"),
    //   traderRewards: ethers.utils.parseEther("48000"),
    // },
    // {
    //   timestamp: 1684368000,
    //   lpRewards: ethers.utils.parseEther("32000"),
    //   traderRewards: ethers.utils.parseEther("48000"),
    // },
    // {
    //   timestamp: 1684972800,
    //   lpRewards: ethers.utils.parseEther("32000"),
    //   traderRewards: ethers.utils.parseEther("48000"),
    // },
    {
      timestamp: 1685577600,
      lpRewards: "0",
      traderRewards: ethers.utils.parseEther("48000"),
    },
  ];

  const deployer = (await ethers.getSigners())[0];
  const alperpLiquidityMiningKeeper =
    AlperpLiquidityMiningKeeper__factory.connect(
      "0x091f7A0a84F12d188EC92C070464D387714B6a92",
      deployer
    );

  const timestamps = PARAMS.map((param) => param.timestamp);
  const rewardInfos = PARAMS.map((param) => ({
    lpRewards: param.lpRewards,
    traderRewards: param.traderRewards,
  }));

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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
