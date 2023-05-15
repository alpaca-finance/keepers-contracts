import { ethers, waffle } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  IAdminFacet,
  IERC20,
  ISmartTreasury,
  SmartTreasuryDistributeKeeper,
  SmartTreasuryDistributeKeeper__factory,
} from "../typechain";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { solidity } from "ethereum-waffle";
import { latestTimestamp, setTimestamp } from "./utils/time";
import { BigNumberish } from "ethers";

chai.use(solidity);
chai.should();
chai.use(smock.matchers);
const { expect } = chai;

describe("#SmartTreasury", () => {
  const INTERVAL = 86400;

  let deployer: SignerWithAddress;

  let fakeToken: FakeContract<IERC20>;
  let moneyMarket: FakeContract<IAdminFacet>;
  let smartTreasury: FakeContract<ISmartTreasury>;
  let keepers: SmartTreasuryDistributeKeeper;

  async function fixture() {
    fakeToken = await smock.fake("IERC20");
    moneyMarket = await smock.fake("IAdminFacet");
    smartTreasury = await smock.fake("ISmartTreasury");

    const SmartTreasuryDistributeKeeper = (await ethers.getContractFactory(
      "SmartTreasuryDistributeKeeper"
    )) as SmartTreasuryDistributeKeeper__factory;
    keepers = await SmartTreasuryDistributeKeeper.deploy(
      "Smart Treasury Keepers",
      INTERVAL,
      moneyMarket.address,
      smartTreasury.address
    );

    // setup withdraw and distribute tokens
    const tokens: Array<string> = [fakeToken.address];
    keepers.setDistributedTokens(tokens);
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("#checkUpkeep", async () => {
    context("when time not reached", async () => {
      it("should return false", async () => {
        const currentTimestamp = await latestTimestamp();
        await setTimestamp(currentTimestamp.add(INTERVAL).sub(1));
        const upKeepStatus = await keepers.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.false;
      });
    });

    context("when time reached", async () => {
      it("should return true", async () => {
        const currentTimestamp = await latestTimestamp();
        await setTimestamp(currentTimestamp.add(INTERVAL).add(1));
        const upKeepStatus = await keepers.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.true;
      });
    });
  });

  context("#performUpkeep", async () => {
    context("when not passed", async () => {
      it("should revert", async () => {
        await expect(keepers.performUpkeep("0x")).to.be.revertedWith(
          "IntervalKeepers_NotPassInterval()"
        );
      });
    });

    context("when passed", async () => {
      it("should withdraw and distribute token", async () => {
        const currentTimestamp = await latestTimestamp();
        await setTimestamp(currentTimestamp.add(INTERVAL).add(1));

        // Interaction
        await keepers.performUpkeep("0x");

        // Expect
        expect(smartTreasury.distribute).to.have.been.calledOnce;
      });
    });
  });
});
