import { ethers, waffle } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  AlpacaMoneyMarketRewardsKeeper,
  IERC20,
} from "../typechain";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { solidity } from "ethereum-waffle";
import * as timeHelpers from "./utils/time";

chai.use(solidity);
chai.should();
chai.use(smock.matchers);
const { expect } = chai;

describe("#AlpacaMoneyMarketRewardsKeeper", () => {
  let deployer: SignerWithAddress;

  let fakeToken: FakeContract<IERC20>;
  let keeper: ;

  async function fixture() {
    const signers = await ethers.getSigners();
    deployer = signers[0];

    fakeToken = await smock.fake("IERC20");
    fakeFeedableRewarder = await smock.fake("IAlperpFeedableRewarder");
    fakeParadeen = await smock.fake("IAlperpParadeen");

    // Move timestamp to start of the next week plus 1 day
    const currentTimestamp = await timeHelpers.latestTimestamp();
    await timeHelpers.setTimestamp(
      currentTimestamp
        .div(timeHelpers.WEEK)
        .add(1)
        .mul(timeHelpers.WEEK)
        .add(timeHelpers.DAY)
    );

    const AlperpLiquidityMiningKeeper = (await ethers.getContractFactory(
      "AlperpLiquidityMiningKeeper"
    )) as AlperpLiquidityMiningKeeper__factory;
    keeper = await AlperpLiquidityMiningKeeper.deploy(
      fakeToken.address,
      fakeFeedableRewarder.address,
      fakeParadeen.address,
      deployer.address
    );

    expect(await keeper.lastUpKeepAt()).to.be.eq(
      currentTimestamp.div(timeHelpers.WEEK).add(1).mul(timeHelpers.WEEK)
    );
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("#checkUpkeep", async () => {
    context("when time not reached", async () => {
      it("should return false", async () => {
        const upKeepStatus = await keeper.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.false;
      });
    });

    context("when time reached", async () => {
      it("should return true", async () => {
        // Move timestamp to start of the next week
        const currentTimestamp = await timeHelpers.latestTimestamp();
        await timeHelpers.setTimestamp(
          currentTimestamp.div(timeHelpers.WEEK).add(1).mul(timeHelpers.WEEK)
        );

        const upKeepStatus = await keeper.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.true;
      });
    });
  });

  context("#performUpkeep", async () => {
    context("when time not reached", async () => {
      it("should revert", async () => {
        await expect(keeper.performUpkeep("0x")).to.be.revertedWith("NR");
      });
    });

    context("when time reached", async () => {
      context("when reward info not set", async () => {
        it("should work", async () => {
          // Move timestamp to start of the next week
          let currentTimestamp = await timeHelpers.latestTimestamp();
          await timeHelpers.setTimestamp(
            currentTimestamp.div(timeHelpers.WEEK).add(1).mul(timeHelpers.WEEK)
          );

          await keeper.performUpkeep("0x");

          currentTimestamp = await timeHelpers.latestTimestamp();
          expect(await keeper.lastUpKeepAt()).to.be.eq(currentTimestamp);
          expect(fakeToken.transferFrom).to.be.calledWith(
            deployer.address,
            keeper.address,
            ethers.BigNumber.from("0")
          );
          expect(fakeFeedableRewarder.feedWithExpiredAt).to.be.calledOnce;
          expect(fakeParadeen.feed).to.be.calledOnce;

          // Check up keep
          const upKeepStatus = await keeper.checkUpkeep("0x");
          expect(upKeepStatus[0]).to.be.false;
        });
      });

      context("when reward info set correctly", async () => {
        it("should work", async () => {
          // Set reward info
          let currentTimestamp = await timeHelpers.latestTimestamp();
          const nextWeekTimestamp =
            timeHelpers.timestampNextWeek(currentTimestamp);
          await keeper.setRewardInfo(
            [nextWeekTimestamp],
            [
              {
                lpRewards: ethers.utils.parseEther("48000"),
                traderRewards: ethers.utils.parseEther("32000"),
              },
            ]
          );

          // Move timestamp to start of the next week
          await timeHelpers.setTimestamp(nextWeekTimestamp);

          await keeper.performUpkeep("0x");

          currentTimestamp = await timeHelpers.latestTimestamp();
          expect(await keeper.lastUpKeepAt()).to.be.eq(currentTimestamp);
          expect(fakeToken.transferFrom).to.be.calledWith(
            deployer.address,
            keeper.address,
            ethers.BigNumber.from("0")
          );
          expect(fakeFeedableRewarder.feedWithExpiredAt).to.be.calledWith(
            ethers.utils.parseEther("48000"),
            timeHelpers.timestampNextWeek(currentTimestamp)
          );
          expect(fakeParadeen.feed).to.be.calledWith(
            [timeHelpers.timestampFloorWeek(currentTimestamp)],
            [ethers.utils.parseEther("32000")]
          );

          // Check up keep
          const upKeepStatus = await keeper.checkUpkeep("0x");
          expect(upKeepStatus[0]).to.be.false;
        });
      });
    });
  });
});
