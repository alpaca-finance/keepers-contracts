import { ethers, waffle } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  IERC20,
  IRevenueTreasury1,
  ISwapRouter02Like,
  TimeBasedRevenueTreasuryKeeper,
  TimeBasedRevenueTreasuryKeeper__factory,
} from "../typechain";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { solidity } from "ethereum-waffle";
import { latestTimestamp, setTimestamp } from "./utils/time";

chai.use(solidity);
chai.should();
chai.use(smock.matchers);
const { expect } = chai;

describe("#TimeBasedRevenueTreasury", () => {
  const INTERVAL = 259200;

  let deployer: SignerWithAddress;

  let fakeToken: FakeContract<IERC20>;
  let fakeRevenueTreasury: FakeContract<IRevenueTreasury1>;
  let fakeSwapLikeRouter: FakeContract<ISwapRouter02Like>;
  let keepers: TimeBasedRevenueTreasuryKeeper;

  async function fixture() {
    fakeToken = await smock.fake("IERC20");
    fakeRevenueTreasury = await smock.fake("IRevenueTreasury1");

    const TimeBasedRevenueTreasuryKeeper = (await ethers.getContractFactory(
      "TimeBasedRevenueTreasuryKeeper"
    )) as TimeBasedRevenueTreasuryKeeper__factory;
    keepers = await TimeBasedRevenueTreasuryKeeper.deploy(
      "Time-based Revenue Treasury Keepers",
      fakeRevenueTreasury.address,
      INTERVAL
    );

    fakeRevenueTreasury.token.returns(fakeToken.address);
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
      it("should forward token", async () => {
        const currentTimestamp = await latestTimestamp();
        await setTimestamp(currentTimestamp.add(INTERVAL).add(1));

        // Interaction
        await keepers.performUpkeep("0x");

        // Expect
        expect(fakeRevenueTreasury.feedGrassHouse).to.have.been.calledOnce;
      });
    });
  });
});
