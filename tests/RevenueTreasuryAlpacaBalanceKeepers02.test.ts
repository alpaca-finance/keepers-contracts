import { ethers, waffle } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  IERC20,
  IRevenueTreasury02,
  RevenueTreasuryAlpacaBalanceKeepers02,
  RevenueTreasuryAlpacaBalanceKeepers02__factory,
} from "../typechain";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";

chai.use(solidity);
chai.should();
chai.use(smock.matchers);
const { expect } = chai;

describe("#RevenueTreasuryAlpacaBalanceKeepers02", () => {
  const TRIGGER_WEI = ethers.utils.parseEther("1");

  let deployer: SignerWithAddress;

  let fakeUSDT: FakeContract<IERC20>;
  let fakeALPACA: FakeContract<IERC20>;
  let fakeRevenueTreasury02: FakeContract<IRevenueTreasury02>;
  let keepers02: RevenueTreasuryAlpacaBalanceKeepers02;

  async function fixture() {
    fakeUSDT = await smock.fake("IERC20");
    fakeALPACA = await smock.fake("IERC20");
    fakeRevenueTreasury02 = await smock.fake("IRevenueTreasury02");

    const RevenueTreasuryAlpacaBalanceKeepers02 =
      (await ethers.getContractFactory(
        "RevenueTreasuryAlpacaBalanceKeepers02"
      )) as RevenueTreasuryAlpacaBalanceKeepers02__factory;
    keepers02 = await RevenueTreasuryAlpacaBalanceKeepers02.deploy(
      "Revenue Treasury Keepers",
      fakeRevenueTreasury02.address,
      fakeALPACA.address,
      TRIGGER_WEI
    );

    fakeRevenueTreasury02.token.returns(fakeUSDT.address);
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("#setTriggerWei", async () => {
    context("when caller is not the owner", async () => {
      it("should revert", async () => {
        await expect(
          RevenueTreasuryAlpacaBalanceKeepers02__factory.connect(
            keepers02.address,
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
        await keepers02.setTriggerWei(newTriggerWei);
        expect(await keepers02.triggerWei()).to.eq(newTriggerWei);
      });
    });
  });

  context("#checkUpkeep", async () => {
    context("when pendingAlpaca more than triggerWei", async () => {
      it("should return true", async () => {
        fakeALPACA.balanceOf.returns(TRIGGER_WEI.add(1));
        const upKeepStatus = await keepers02.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.true;
      });
    });

    context("when pendingAlpaca no more than triggerWei", async () => {
      it("should return false", async () => {
        fakeALPACA.balanceOf.returns(TRIGGER_WEI.sub(1));
        const upKeepStatus = await keepers02.checkUpkeep("0x");
        expect(upKeepStatus[0]).to.be.false;
      });
    });
  });

  context("#performUpkeep", async () => {
    context("when performUpkeep get called", async () => {
      it("should call feedRevenueDistributor", async () => {
        await keepers02.performUpkeep(
          ethers.utils.defaultAbiCoder.encode(["uint256"], [0])
        );

        expect(fakeRevenueTreasury02.feedRevenueDistributor).to.have.been
          .calledOnce;
      });
    });
  });
});
