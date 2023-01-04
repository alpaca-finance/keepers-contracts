import { ethers, waffle } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  IERC20,
  IRevenueTreasury,
  ISwapRouter02Like,
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
  let fakeSwapLikeRouter: FakeContract<ISwapRouter02Like>;
  let keepers: RevenueTreasuryKeepers;

  async function fixture() {
    fakeToken = await smock.fake("IERC20");
    fakeRevenueTreasury = await smock.fake("IRevenueTreasury");
    fakeSwapLikeRouter = await smock.fake("ISwapRouter02Like");

    const RevenueTreasuryKeepers = (await ethers.getContractFactory(
      "RevenueTreasuryKeepers"
    )) as RevenueTreasuryKeepers__factory;
    keepers = await RevenueTreasuryKeepers.deploy(
      "Revenue Treasury Keepers",
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
      context("when slippage bps NOT set", async () => {
        it("should return true with correct data", async () => {
          fakeToken.balanceOf.returns(TRIGGER_WEI);
          fakeRevenueTreasury.router.returns(fakeSwapLikeRouter.address);
          fakeRevenueTreasury.splitBps.returns(5000);
          fakeRevenueTreasury.remaining.returns(
            ethers.utils.parseEther("10000")
          );
          fakeRevenueTreasury.getRewardPath.returns([
            fakeToken.address,
            fakeToken.address,
          ]);
          fakeRevenueTreasury.getVaultSwapPath.returns([
            fakeToken.address,
            fakeToken.address,
          ]);
          fakeSwapLikeRouter.getAmountsOut.returns([
            0,
            ethers.utils.parseEther("5000"),
          ]);

          const upKeepStatus = await keepers.checkUpkeep("0x");
          expect(upKeepStatus[0]).to.be.true;
          expect(upKeepStatus[1]).to.eq(
            ethers.utils.defaultAbiCoder.encode(
              ["uint256", "uint256"],
              [ethers.utils.parseEther("5000"), ethers.utils.parseEther("5000")]
            )
          );
        });
      });

      context("when slippage bps set to 10 bps", async () => {
        it("should return true with correct data", async () => {
          await keepers.setSlippageBps("10");

          fakeToken.balanceOf.returns(TRIGGER_WEI);
          fakeRevenueTreasury.router.returns(fakeSwapLikeRouter.address);
          fakeRevenueTreasury.splitBps.returns(5000);
          fakeRevenueTreasury.remaining.returns(
            ethers.utils.parseEther("10000")
          );
          fakeRevenueTreasury.getRewardPath.returns([
            fakeToken.address,
            fakeToken.address,
          ]);
          fakeRevenueTreasury.getVaultSwapPath.returns([
            fakeToken.address,
            fakeToken.address,
          ]);
          fakeSwapLikeRouter.getAmountsOut.returns([
            0,
            ethers.utils.parseEther("5000"),
          ]);

          const upKeepStatus = await keepers.checkUpkeep("0x");
          expect(upKeepStatus[0]).to.be.true;
          expect(upKeepStatus[1]).to.eq(
            ethers.utils.defaultAbiCoder.encode(
              ["uint256", "uint256"],
              [ethers.utils.parseEther("4995"), ethers.utils.parseEther("4995")]
            )
          );
        });
      });

      context("when remaining is 0", async () => {
        it("should return true with correct data", async () => {
          await keepers.setSlippageBps("10");

          fakeToken.balanceOf.returns(TRIGGER_WEI);
          fakeRevenueTreasury.router.returns(fakeSwapLikeRouter.address);
          fakeRevenueTreasury.splitBps.returns(5000);
          fakeRevenueTreasury.remaining.returns("0");
          fakeRevenueTreasury.getRewardPath.returns([
            fakeToken.address,
            fakeToken.address,
          ]);
          fakeRevenueTreasury.getVaultSwapPath.returns([
            fakeToken.address,
            fakeToken.address,
          ]);
          fakeSwapLikeRouter.getAmountsOut.returns([
            0,
            ethers.utils.parseEther("5000"),
          ]);

          const upKeepStatus = await keepers.checkUpkeep("0x");
          expect(upKeepStatus[0]).to.be.true;
          expect(upKeepStatus[1]).to.eq(
            ethers.utils.defaultAbiCoder.encode(
              ["uint256", "uint256"],
              ["0", ethers.utils.parseEther("4995")]
            )
          );
        });
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
        await keepers.performUpkeep(
          ethers.utils.defaultAbiCoder.encode(
            ["uint256", "uint256"],
            [ethers.utils.parseEther("4995"), ethers.utils.parseEther("4995")]
          )
        );

        // Expect
        expect(fakeRevenueTreasury.feedGrassHouse).to.have.been.calledOnce;
      });
    });
  });
});
