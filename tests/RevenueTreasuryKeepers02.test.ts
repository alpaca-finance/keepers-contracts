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
import { advanceBlock, increaseTimestamp } from "./utils/time";

chai.use(solidity);
chai.should();
chai.use(smock.matchers);
const { expect } = chai;

describe("#RevenueTreasury02", () => {
  const TRIGGER_WEI = ethers.utils.parseEther("1");
  const TIME_LIMIT = "3600";

  let deployer: SignerWithAddress;

  let fakeUSDT: FakeContract<IERC20>;
  let fakeALPACA: FakeContract<IERC20>;
  let fakeRevenueTreasury02: FakeContract<IRevenueTreasury02>;
  let fakeTreasuryBuybackStrategy: FakeContract<ITreasuryBuybackStrategy>;
  let keepers02: RevenueTreasuryKeepers02;

  const TreasuryBuybackAction: Record<"INITIATE" | "TERMINATE", BigNumber> = {
    INITIATE: BigNumber.from(0),
    TERMINATE: BigNumber.from(1),
  };

  async function fixture() {
    fakeUSDT = await smock.fake("IERC20");
    fakeALPACA = await smock.fake("IERC20");
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

    fakeRevenueTreasury02.token.returns(fakeUSDT.address);

    fakeRevenueTreasury02.treasuryBuybackStrategy.returns(
      fakeTreasuryBuybackStrategy.address
    );

    fakeTreasuryBuybackStrategy.token0.returns(fakeUSDT.address);
    fakeTreasuryBuybackStrategy.token1.returns(fakeALPACA.address);
    fakeTreasuryBuybackStrategy.accumToken.returns(fakeALPACA.address);
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
          fakeUSDT.balanceOf.returns(TRIGGER_WEI.sub(1));
          const upKeepStatus = await keepers02.checkUpkeep("0x");
          expect(upKeepStatus[0]).to.be.false;
        });
      });

      context("when pendingAlpaca more than triggerWei", async () => {
        it("should return true", async () => {
          fakeUSDT.balanceOf.returns(TRIGGER_WEI.add(1));
          const upKeepStatus = await keepers02.checkUpkeep("0x");
          expect(upKeepStatus[0]).to.be.true;
          expect(upKeepStatus[1]).to.eq(TreasuryBuybackAction.INITIATE);
        });
      });

      context("when nftTokenId is not 0", async () => {
        beforeEach(async () => {
          await keepers02.performUpkeep(
            ethers.utils.defaultAbiCoder.encode(
              ["uint256"],
              [TreasuryBuybackAction.INITIATE]
            )
          );

          await fakeTreasuryBuybackStrategy.nftTokenId.returns(
            BigNumber.from(1)
          );

          await fakeTreasuryBuybackStrategy.getAmountsFromPositionLiquidity.returns(
            [BigNumber.from(1), BigNumber.from(1)]
          );
        });

        context("when buyback not complete and under timeLimit", async () => {
          it("should return false", async () => {
            const upKeepStatus = await keepers02.checkUpkeep("0x");
            expect(upKeepStatus[0]).to.be.false;
          });
        });

        context("when buyback complete", async () => {
          it("should return true with terminate action", async () => {
            await fakeTreasuryBuybackStrategy.getAmountsFromPositionLiquidity.returns(
              [BigNumber.from(0), BigNumber.from(1)]
            );

            const upKeepStatus = await keepers02.checkUpkeep("0x");
            expect(upKeepStatus[0]).to.be.true;
            expect(upKeepStatus[1]).to.be.eq(TreasuryBuybackAction.TERMINATE);
          });
        });

        context("when pass timeLimit ", async () => {
          it("should return true with terminate action", async () => {
            await increaseTimestamp(BigNumber.from(TIME_LIMIT).add(1));

            await advanceBlock();

            const upKeepStatus = await keepers02.checkUpkeep("0x");
            expect(upKeepStatus[0]).to.be.true;
            expect(upKeepStatus[1]).to.be.eq(TreasuryBuybackAction.TERMINATE);
          });
        });
      });
    });
  });

  context("#performUpkeep", async () => {
    context("when action is initiate with pass trigger wei", async () => {
      it("should stamp initiateAt", async () => {
        await keepers02.performUpkeep(
          ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [TreasuryBuybackAction.INITIATE]
          )
        );

        await fakeTreasuryBuybackStrategy.nftTokenId.returns(BigNumber.from(1));

        const initiateAt = await keepers02.initiateAt();
        const block = await ethers.provider.getBlock("latest");
        expect(initiateAt).to.eq(block.timestamp);
      });
    });

    context("when action is initiate with not pass trigger wei", async () => {
      it("should revert", async () => {
        fakeUSDT.balanceOf.returns(TRIGGER_WEI.sub(1));

        await expect(
          keepers02.performUpkeep(
            ethers.utils.defaultAbiCoder.encode(
              ["uint256"],
              [TreasuryBuybackAction.INITIATE]
            )
          )
        ).to.be.revertedWith("RevenueTreasuryKeepers02_NotPassTriggerWei()");
      });
    });

    context("when action is terminate", async () => {
      it("should reset initiateAt to 0", async () => {
        fakeUSDT.balanceOf.returns(TRIGGER_WEI.add(1));
        await keepers02.performUpkeep(
          ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [TreasuryBuybackAction.INITIATE]
          )
        );

        expect(await keepers02.initiateAt()).to.not.eq(BigNumber.from(0));
        await fakeTreasuryBuybackStrategy.getAmountsFromPositionLiquidity.returns(
          [BigNumber.from(0), BigNumber.from(1)]
        );

        await keepers02.performUpkeep(
          ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [TreasuryBuybackAction.TERMINATE]
          )
        );

        expect(await keepers02.initiateAt()).to.eq(BigNumber.from(0));
        expect(fakeRevenueTreasury02.stopBuybackStrategy).to.have.been
          .calledOnce;
        expect(fakeRevenueTreasury02.feedRevenueDistributor).to.have.been
          .calledOnce;
      });

      context(
        "when not pass time limit and buyback not completed",
        async () => {
          it("should revert", async () => {
            fakeUSDT.balanceOf.returns(TRIGGER_WEI.add(1));

            await keepers02.performUpkeep(
              ethers.utils.defaultAbiCoder.encode(
                ["uint256"],
                [TreasuryBuybackAction.INITIATE]
              )
            );

            expect(await keepers02.initiateAt()).to.not.eq(BigNumber.from(0));

            fakeTreasuryBuybackStrategy.getAmountsFromPositionLiquidity.returns(
              [BigNumber.from(1), BigNumber.from(1)]
            );

            await expect(
              keepers02.performUpkeep(
                ethers.utils.defaultAbiCoder.encode(
                  ["uint256"],
                  [TreasuryBuybackAction.TERMINATE]
                )
              )
            ).to.be.revertedWith(
              "RevenueTreasuryKeepers02_InvalidTerminateCondition()"
            );
          });
        }
      );
    });
  });
});
