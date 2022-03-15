import { ethers, waffle } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  EmissionBridgeKeepers,
  EmissionBridgeKeepers__factory,
  IEmissionForwarder,
  IFairLaunch,
} from "../typechain";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { solidity } from "ethereum-waffle";
import * as timeHelpers from "./utils/time";

chai.use(solidity);
chai.should();
chai.use(smock.matchers);
const { expect } = chai;

describe("#EmissionBridgeKeepers", () => {
  const TRIGGER_WEI = ethers.utils.parseEther("1");

  let deployer: SignerWithAddress;

  let fakeFairLaunch: FakeContract<IFairLaunch>;
  let fakeEmissionForwarder: FakeContract<IEmissionForwarder>;
  let keepers: EmissionBridgeKeepers;

  async function fixture() {
    fakeFairLaunch = await smock.fake("IFairLaunch");
    fakeEmissionForwarder = await smock.fake("IEmissionForwarder");

    fakeEmissionForwarder.fairLaunch.returns(fakeFairLaunch.address);
    fakeEmissionForwarder.fairLaunchPoolId.returns(0);

    const EmissionBridgeKeepers = await ethers.getContractFactory(
      "EmissionBridgeKeepers"
    );
    keepers = await EmissionBridgeKeepers.deploy(
      "Fantom Emission Keepers",
      fakeEmissionForwarder.address,
      TRIGGER_WEI
    );
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("#setTriggerWei", async () => {
    context("when caller is not the owner", async () => {
      it("should revert", async () => {
        await expect(
          EmissionBridgeKeepers__factory.connect(
            keepers.address,
            (
              await ethers.getSigners()
            )[1]
          ).setTriggerWei(8)
        ).to.be.revertedWith("Ownable_NotOwner()");
      });
    });

    context("when call is the owner", async () => {
      it("should work", async () => {
        const newTriggerWei = ethers.utils.parseEther("88888");
        await keepers.setTriggerWei(newTriggerWei);
        expect(await keepers.triggerWei()).to.eq(newTriggerWei);
      });
    });
  });

  context("#checkUpkeep", async () => {
    context("when pendingAlpaca NOT pass triggerWei", async () => {
      it("should return false", async () => {
        fakeFairLaunch.pendingAlpaca.returns(TRIGGER_WEI.sub(1));
        const upKeepStatus = await keepers.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.false;
      });
    });

    context("when pendingAlpaca pass the triggerWei", async () => {
      it("should return true", async () => {
        fakeFairLaunch.pendingAlpaca.returns(TRIGGER_WEI);
        const upKeepStatus = await keepers.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.true;
      });
    });
  });

  context("#performUpkeep", async () => {
    context("when pendingAlpaca NOT pass the triggerWei", async () => {
      it("should revert", async () => {
        fakeFairLaunch.pendingAlpaca.returns(TRIGGER_WEI.sub(1));
        await expect(keepers.performUpkeep("0x")).to.be.revertedWith(
          "EmissionBridgeKeeper_NotPassTriggerWei()"
        );
      });
    });

    context("when pendingAlpaca pass the triggerWei", async () => {
      it("should forward token", async () => {
        // Mock
        fakeFairLaunch.pendingAlpaca.returns(TRIGGER_WEI);

        // Interaction
        await keepers.performUpkeep("0x");

        // Expect
        expect(fakeEmissionForwarder.forwardToken).to.have.been.calledOnce;
      });
    });
  });
});
