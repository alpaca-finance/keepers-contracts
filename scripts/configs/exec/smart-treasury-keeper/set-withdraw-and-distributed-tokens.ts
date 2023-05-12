import { ethers } from "hardhat";
import { SmartTreasuryDistributeKeeper__factory } from "../../../../typechain";
import { BigNumberish, Bytes } from "ethers";

interface WithdrawProtocolReserveParam {
  token: string;
  to: string;
  amount: BigNumberish;
}

async function main() {
  const deployer = (await ethers.getSigners())[0];
  // TODO:
  const smartTreasuryDistributeKeeper =
    SmartTreasuryDistributeKeeper__factory.connect("0x", deployer);

  const WBNB = "";
  const TO_ADDRESS = "";

  const WITHDRAW_PARAMS: Array<WithdrawProtocolReserveParam> = [
    {
      token: WBNB,
      to: TO_ADDRESS,
      amount: 0,
    },
  ];

  console.log("> Setting withdraw tokens...");
  const setWithdrawTx =
    await smartTreasuryDistributeKeeper.setWithdrawProtocolReserveParams(
      WITHDRAW_PARAMS
    );
  console.log("> ⛓ Tx is submitted:", setWithdrawTx.hash);
  console.log("> ⏳ Waiting for tx to be mined...");
  await setWithdrawTx.wait(3);
  console.log("> ✅ Tx is mined");

  const DISTRIBUTED_TOKEN: Array<string> = [WBNB];

  console.log("> Setting distributed tokens...");
  const setDistributeTokentx =
    await smartTreasuryDistributeKeeper.setDistributedTokens(DISTRIBUTED_TOKEN);
  console.log("> ⛓ Tx is submitted:", setDistributeTokentx.hash);
  console.log("> ⏳ Waiting for tx to be mined...");
  await setDistributeTokentx.wait(3);
  console.log("> ✅ Tx is mined");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
