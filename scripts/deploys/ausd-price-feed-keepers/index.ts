import { ethers } from "hardhat";
import { AusdPriceFeedKeepers__factory } from "../../../../typechain";

async function main() {
  const NAME = "AUSD IbTokenPriceFeed Keepers";
  const PRICE_FEEDERS = [
    "0x4a89F897AA97D096dBeA0f874a5854662996f8ae",
    "0xFB6A378b5e5bBc6F413DdDf07873076851a00fD1",
    "0x44b930F2e53231B3F85495229eA644724C93c617",
    "0x4C7fb2214e6D782Dc0152ea39c39166F666cA367",
    "0x4C7fb2214e6D782Dc0152ea39c39166F666cA367",
    "0x4C7fb2214e6D782Dc0152ea39c39166F666cA367",
  ];
  const CALL_DATAS = [
    ethers.utils.formatBytes32String(""),
    ethers.utils.formatBytes32String(""),
    ethers.utils.formatBytes32String(""),
    ethers.utils.formatBytes32String("ibBUSD"),
    ethers.utils.formatBytes32String("ibUSDT"),
    ethers.utils.formatBytes32String("ibWBNB"),
  ];
  const INTERVAL = 15 * 60;

  const AusdPriceFeedKeepers = (await ethers.getContractFactory(
    "AusdPriceFeedKeepers"
  )) as AusdPriceFeedKeepers__factory;
  const ausdPriceFeedKeepers = await AusdPriceFeedKeepers.deploy(
    NAME,
    PRICE_FEEDERS,
    CALL_DATAS,
    INTERVAL
  );

  await ausdPriceFeedKeepers.deployTransaction.wait(3);

  console.log(
    "AusdPriceFeedKeepers deployed to:",
    ausdPriceFeedKeepers.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
