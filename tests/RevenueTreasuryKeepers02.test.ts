import { ethers, waffle } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  IERC20,
  IRevenueTreasury02,
  ITreasuryBuybackStrategy,
  RevenueTreasuryKeepers02,
  RevenueTreasuryKeepers02__factory,
} from "../typechain";
import { FakeContract, smock } from "@defi-wonderland/smock";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";

chai.use(solidity);
chai.should();
chai.use(smock.matchers);
const { expect } = chai;

describe.only("#RevenueTreasury02", () => {
  const TRIGGER_WEI = ethers.utils.parseEther("1");
  const TIME_LIMIT = "3600";

  let deployer: SignerWithAddress;

  let fakeToken: FakeContract<IERC20>;
  let fakeRevenueTreasury02: FakeContract<IRevenueTreasury02>;
  let fakeTreasuryBuybackStrategy: FakeContract<ITreasuryBuybackStrategy>;
  let keepers02: RevenueTreasuryKeepers02;

  async function fixture() {
    fakeToken = await smock.fake("IERC20");
    fakeRevenueTreasury02 = await smock.fake("IRevenueTreasury02");
    fakeTreasuryBuybackStrategy = await smock.fake("ITreasuryBuybackStrategy");

    const RevenueTreasuryKeepers02 = (await ethers.getContractFactory(
      "RevenueTreasuryKeepers02"
    )) as RevenueTreasuryKeepers02__factory;
    keepers02 = await RevenueTreasuryKeepers02.deploy(
      "Revenue Treasury Keepers",
      fakeRevenueTreasury02.address,
      TRIGGER_WEI,
      TIME_LIMIT
    );

    fakeRevenueTreasury02.token.returns(fakeToken.address);
    fakeRevenueTreasury02.treasuryBuybackStrategy.returns(
      fakeTreasuryBuybackStrategy.address
    );
    fakeTreasuryBuybackStrategy.nftTokenId.returns(BigNumber.from(0));
  }

  beforeEach(async () => {
    await waffle.loadFixture(fixture);
  });

  context("#setTriggerWei", async () => {
    context("when caller is not the owner", async () => {
      it("should revert", async () => {
        await expect(
          RevenueTreasuryKeepers02__factory.connect(
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

  context("#setTimeLimit", async () => {
    context("when caller is not the owner", async () => {
      it("should revert", async () => {
        await expect(
          RevenueTreasuryKeepers02__factory.connect(
            keepers02.address,
            (
              await ethers.getSigners()
            )[1]
          ).setTimeLimit(3600)
        ).to.be.revertedWith("Ownable_NotOwner()");
      });
    });

    context("when call is the owner", async () => {
      it("should work", async () => {
        const newTimeLimit = 1800;
        await keepers02.setTimeLimit(newTimeLimit);
        expect(await keepers02.timeLimit()).to.eq(newTimeLimit);
      });
    });
  });

  context("#checkUpkeep", async () => {
    context("when nftTokenId is 0", async () => {
      context("when pendingAlpaca NOT pass triggerWei", async () => {
        it("should return false", async () => {
          fakeToken.balanceOf.returns(TRIGGER_WEI.sub(1));
          const upKeepStatus = await keepers02.checkUpkeep("0x");
          expect(upKeepStatus[0]).to.be.false;
        });
      });

      context("when pendingAlpaca more than triggerWei", async () => {
        it("should return true", async () => {
          fakeToken.balanceOf.returns(TRIGGER_WEI.add(1));
          const upKeepStatus = await keepers02.checkUpkeep("0x");
          console.log("upkeep", upKeepStatus[1]);
          expect(upKeepStatus[0]).to.be.true;
          expect(upKeepStatus[1]).to.eq(BigNumber.from(0));
        });
      });
    });

    // context("when alpaca not pass trigger wei", async () => {
    // });
    //     context("when remaining is 0", async () => {
    //       it("should return true with correct data", async () => {
    //         await keepers.setSlippageBps("10");
    //         fakeToken.balanceOf.returns(TRIGGER_WEI);
    //         fakeRevenueTreasury.router.returns(fakeSwapLikeRouter.address);
    //         fakeRevenueTreasury.splitBps.returns(5000);
    //         fakeRevenueTreasury.remaining.returns("0");
    //         fakeRevenueTreasury.getRewardPath.returns([
    //           fakeToken.address,
    //           fakeToken.address,
    //         ]);
    //         fakeRevenueTreasury.getVaultSwapPath.returns([
    //           fakeToken.address,
    //           fakeToken.address,
    //         ]);
    //         fakeSwapLikeRouter.getAmountsOut.returns([
    //           0,
    //           ethers.utils.parseEther("5000"),
    //         ]);
    //         const upKeepStatus = await keepers.checkUpkeep("0x");
    //         expect(upKeepStatus[0]).to.be.true;
    //         expect(upKeepStatus[1]).to.eq(
    //           ethers.utils.defaultAbiCoder.encode(
    //             ["uint256", "uint256"],
    //             ["0", ethers.utils.parseEther("4995")]
    //           )
    //         );
    //       });
    //     });
  });

  // context("#performUpkeep", async () => {
  //   context("when pendingAlpaca NOT pass the triggerWei", async () => {
  //     it("should revert", async () => {
  //       fakeToken.balanceOf.returns(TRIGGER_WEI.sub(1));
  //       await expect(keepers.performUpkeep("0x")).to.be.revertedWith(
  //         "RevenueTreasuryKeepers_NotPassTriggerWei()"
  //       );
  //     });
  //   });

  //   context("when pendingAlpaca pass the triggerWei", async () => {
  //     it("should forward token", async () => {
  //       // Mock
  //       fakeToken.balanceOf.returns(TRIGGER_WEI);

  //       // Interaction
  //       await keepers.performUpkeep(
  //         ethers.utils.defaultAbiCoder.encode(
  //           ["uint256", "uint256"],
  //           [ethers.utils.parseEther("4995"), ethers.utils.parseEther("4995")]
  //         )
  //       );

  //       // Expect
  //       expect(fakeRevenueTreasury.feedGrassHouse).to.have.been.calledOnce;
  //     });
  //   });
  // });
});
