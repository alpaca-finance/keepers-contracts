import { ethers, waffle } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  IMoneyMarket,
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
  let moneyMarket: FakeContract<IMoneyMarket>;
  let smartTreasury: FakeContract<ISmartTreasury>;
  let keepers: SmartTreasuryDistributeKeeper;

  async function fixture() {
    deployer = (await ethers.getSigners())[0];

    fakeToken = await smock.fake("IERC20");
    moneyMarket = await smock.fake("IMoneyMarket");
    smartTreasury = await smock.fake("ISmartTreasury");

    const SmartTreasuryDistributeKeeper = await ethers.getContractFactory(
      "SmartTreasuryDistributeKeeper"
    );

    keepers = await SmartTreasuryDistributeKeeper.connect(deployer).deploy(
      "Smart Treasury Keepers",
      INTERVAL,
      moneyMarket.address,
      smartTreasury.address
    );

    // setup withdraw and distribute tokens
    const tokens: Array<string> = [fakeToken.address];
    await keepers.connect(deployer).setDistributedTokens(tokens);
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("#checkUpkeep", () => {
    context("when time not reached", () => {
      it("should return false", async () => {
        const currentTimestamp = await latestTimestamp();
        await setTimestamp(currentTimestamp.add(INTERVAL).sub(1));
        const upKeepStatus = await keepers.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.false;
      });
    });

    context("when time reached", () => {
      it("should return true", async () => {
        const currentTimestamp = await latestTimestamp();
        await setTimestamp(currentTimestamp.add(INTERVAL).add(1));
        const upKeepStatus = await keepers.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.true;
      });
    });
  });

  context("#performUpkeep", () => {
    context("when not passed", () => {
      it("should revert", async () => {
        await expect(keepers.performUpkeep("0x")).to.be.revertedWith(
          "IntervalKeepers_NotPassInterval()"
        );
      });
    });

    context("when passed", () => {
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

  context("#distributeTokens", () => {
    const tokens = ["0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47"];
    context("set tokens", () => {
      it("tokens should be set", async () => {
        await keepers.connect(deployer).setDistributedTokens(tokens);

        expect(await keepers.distributedTokens(0)).to.be.equal(tokens[0]);
      });
    });
    context("add tokens", () => {
      it("tokens should be added", async () => {
        await keepers.connect(deployer).addDistributedTokens(tokens);

        expect(await keepers.distributedTokens(1)).to.be.equal(tokens[0]);
      });
    });
  });
});
