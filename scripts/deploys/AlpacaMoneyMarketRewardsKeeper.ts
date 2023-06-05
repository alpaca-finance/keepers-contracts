import { ethers } from "hardhat";
import { AlpacaMoneyMarketRewardsKeeper__factory } from "../../typechain";

async function main() {
  const deployer = (await ethers.getSigners())[0];

  console.log("> Deploying AlpacaMoneyMarketRewardsKeeper...");
  const AlpacaMoneyMarketRewardsKeeper =
    new AlpacaMoneyMarketRewardsKeeper__factory(deployer);
  const alpacaMoneyMarketRewardsKeeper =
    await AlpacaMoneyMarketRewardsKeeper.deploy(
      "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
      "0x4579587AE043131999cE3d9C66199726972E3Fb7",
      "0x09d25b4e72132183eB05D6c4DA2B7533e178A0ae"
    );
  console.log(
    "> AlpacaMoneyMarketRewardsKeeper deployed to:",
    alpacaMoneyMarketRewardsKeeper.address
  );
  console.log(
    "> Waiting for AlpacaMoneyMarketRewardsKeeper transaction to be confirmed..."
  );
  await alpacaMoneyMarketRewardsKeeper.deployTransaction.wait(3);
  console.log("> AlpacaMoneyMarketRewardsKeeper deployed!");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
