import { ethers, waffle } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  EmissionBridgeKeepers,
  EmissionBridgeKeepers__factory,
  IEmissionForwarder,
} from "../typechain";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { solidity } from "ethereum-waffle";
import * as timeHelpers from "./utils/time";

chai.use(solidity);
chai.should();
chai.use(smock.matchers);
const { expect } = chai;

describe("#EmissionBridgeKeepers", () => {
  const INTERVAL = timeHelpers.DAY;

  let deployer: SignerWithAddress;

  let fakeEmissionForwarder: FakeContract<IEmissionForwarder>;
  let keepers: EmissionBridgeKeepers;

  async function fixture() {
    fakeEmissionForwarder = await smock.fake("IEmissionForwarder");

    const EmissionBridgeKeepers = await ethers.getContractFactory(
      "EmissionBridgeKeepers"
    );
    keepers = await EmissionBridgeKeepers.deploy(
      "Fantom Emission Keepers",
      fakeEmissionForwarder.address,
      INTERVAL
    );
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("#setInterval", async () => {
    context("when caller is not the owner", async () => {
      it("should revert", async () => {
        await expect(
          EmissionBridgeKeepers__factory.connect(
            keepers.address,
            (
              await ethers.getSigners()
            )[1]
          ).setInterval(timeHelpers.HOUR)
        ).to.be.revertedWith("Ownable_NotOwner()");
      });
    });

    context("when call is the owner", async () => {
      it("should work", async () => {
        await keepers.setInterval(timeHelpers.HOUR);
        expect(await keepers.interval()).to.eq(timeHelpers.HOUR);
      });
    });
  });

  context("#checkUpkeep", async () => {
    context("when time NOT pass the interval", async () => {
      it("should return false", async () => {
        const upKeepStatus = await keepers.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.false;
      });
    });

    context("when time pass the interval", async () => {
      it("should return true", async () => {
        await timeHelpers.increaseTimestamp(INTERVAL.add(1));
        const upKeepStatus = await keepers.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.true;
      });
    });
  });

  context("#performUpkeep", async () => {
    context("when time NOT pass the interval", async () => {
      it("should revert", async () => {
        await expect(keepers.performUpkeep("0x")).to.be.revertedWith(
          "EmissionBridgeKeeper_NotPassInterval()"
        );
      });
    });

    context("when time pass the interval", async () => {
      it("should forward token", async () => {
        // Interaction
        await timeHelpers.increaseTimestamp(INTERVAL.add(1));
        await keepers.performUpkeep("0x");

        // Expect
        const lastTimestamp = await keepers.lastTimestamp();
        expect(fakeEmissionForwarder.forwardToken).to.have.been.calledOnce;
        expect(lastTimestamp).to.be.eq(await timeHelpers.latestTimestamp());
      });
    });
  });
});
