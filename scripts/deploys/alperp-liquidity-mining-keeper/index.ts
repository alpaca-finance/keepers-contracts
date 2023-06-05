import { ethers } from "hardhat";
import { AlperpLiquidityMiningKeeper__factory } from "../../../../typechain";

async function main() {
  const ALPACA_ADDRESS = "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F";
  const ALPERP_FEEDABLE_REWARDER_ADDRESS =
    "0x2D4DdBb76CBb2aFf2553A5B4017318fd87586fA4";
  const ALPERP_PARADEEN_ADDRESS = "0xBA61db6b2CFEbC1580BF692389e831B24bb0a5eF";
  const REWARD_SOURCE_ADDRESS = "0x09d25b4e72132183eB05D6c4DA2B7533e178A0ae";

  const AlperpLiquidityMiningKeeper = (await ethers.getContractFactory(
    "AlperpLiquidityMiningKeeper"
  )) as AlperpLiquidityMiningKeeper__factory;
  const alperpLiquidityMiningKeeper = await AlperpLiquidityMiningKeeper.deploy(
    ALPACA_ADDRESS,
    ALPERP_FEEDABLE_REWARDER_ADDRESS,
    ALPERP_PARADEEN_ADDRESS,
    REWARD_SOURCE_ADDRESS
  );

  await alperpLiquidityMiningKeeper.deployTransaction.wait(3);

  console.log(
    "AlperpLiquidityMiningKeeper deployed to:",
    alperpLiquidityMiningKeeper.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
