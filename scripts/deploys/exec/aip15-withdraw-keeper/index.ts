import { ethers } from "hardhat";
import { Aip15WithdrawKeeper__factory } from "../../../../typechain";

async function main() {
  const NAME = "Aip15 Withdraw Keeper";
  const AIP15 = "0xFd42963E41BE196F05741c40FA4765739b3796B2";
  const FAIR_LAUNCH = "0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F";

  const Aip15WithdrawKeeper = (await ethers.getContractFactory(
    "Aip15WithdrawKeeper"
  )) as Aip15WithdrawKeeper__factory;
  const aip15WithdrawKeeper = await Aip15WithdrawKeeper.deploy(
    NAME,
    AIP15,
    FAIR_LAUNCH
  );

  await aip15WithdrawKeeper.deployTransaction.wait(3);

  console.log("Aip15WithdrawKeeper deployed to:", aip15WithdrawKeeper.address);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
