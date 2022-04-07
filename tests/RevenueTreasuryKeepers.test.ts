import { ethers, waffle } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  IERC20,
  IRevenueTreasury,
  RevenueTreasuryKeepers,
  RevenueTreasuryKeepers__factory,
} from "../typechain";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { solidity } from "ethereum-waffle";

chai.use(solidity);
chai.should();
chai.use(smock.matchers);
const { expect } = chai;

describe("#RevenueTreasury", () => {
  const TRIGGER_WEI = ethers.utils.parseEther("1");

  let deployer: SignerWithAddress;

  let fakeToken: FakeContract<IERC20>;
  let fakeRevenueTreasury: FakeContract<IRevenueTreasury>;
  let keepers: RevenueTreasuryKeepers;

  async function fixture() {
    fakeToken = await smock.fake("IERC20");
    fakeRevenueTreasury = await smock.fake("IRevenueTreasury");

    const RevenueTreasuryKeepers = (await ethers.getContractFactory(
      "RevenueTreasuryKeepers"
    )) as RevenueTreasuryKeepers__factory;
    keepers = await RevenueTreasuryKeepers.deploy(
      "Fantom Emission Keepers",
      fakeRevenueTreasury.address,
      TRIGGER_WEI
    );

    fakeRevenueTreasury.token.returns(fakeToken.address);
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("#setTriggerWei", async () => {
    context("when caller is not the owner", async () => {
      it("should revert", async () => {
        await expect(
          RevenueTreasuryKeepers__factory.connect(
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
        fakeToken.balanceOf.returns(TRIGGER_WEI.sub(1));
        const upKeepStatus = await keepers.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.false;
      });
    });

    context("when pendingAlpaca pass the triggerWei", async () => {
      it("should return true", async () => {
        fakeToken.balanceOf.returns(TRIGGER_WEI);
        const upKeepStatus = await keepers.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.true;
      });
    });
  });

  context("#performUpkeep", async () => {
    context("when pendingAlpaca NOT pass the triggerWei", async () => {
      it("should revert", async () => {
        fakeToken.balanceOf.returns(TRIGGER_WEI.sub(1));
        await expect(keepers.performUpkeep("0x")).to.be.revertedWith(
          "RevenueTreasuryKeepers_NotPassTriggerWei()"
        );
      });
    });

    context("when pendingAlpaca pass the triggerWei", async () => {
      it("should forward token", async () => {
        // Mock
        fakeToken.balanceOf.returns(TRIGGER_WEI);

        // Interaction
        await keepers.performUpkeep("0x");

        // Expect
        expect(fakeRevenueTreasury.feedGrassHouse).to.have.been.calledOnce;
      });
    });
  });
});
