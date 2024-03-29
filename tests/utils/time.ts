import { BigNumber, BigNumberish } from "ethers";
import { ethers } from "hardhat";

export const HOUR = ethers.BigNumber.from(3600);
export const DAY = ethers.BigNumber.from(86400);
export const WEEK = DAY.mul(7);
export const YEAR = DAY.mul(365);

export async function setStartNextWeek(): Promise<BigNumber> {
  const currentTimestamp = await latestTimestamp();
  const nextWeek = currentTimestamp.div(WEEK).add(1).mul(WEEK);
  setTimestamp(nextWeek);
  return nextWeek;
}

export function timestampFloorWeek(t: BigNumberish): BigNumber {
  const bt = BigNumber.from(t);
  return bt.div(WEEK).mul(WEEK);
}

export function timestampNextWeek(t: BigNumberish): BigNumber {
  const bt = BigNumber.from(t);
  return timestampFloorWeek(bt).add(WEEK);
}

export async function latestTimestamp(): Promise<BigNumber> {
  const block = await ethers.provider.getBlock("latest");
  return ethers.BigNumber.from(block.timestamp);
}

export async function latestBlockNumber(): Promise<BigNumber> {
  const block = await ethers.provider.getBlock("latest");
  return ethers.BigNumber.from(block.number);
}

export async function advanceBlock() {
  await ethers.provider.send("evm_mine", []);
}

export async function setTimestamp(timestamp: BigNumberish) {
  const timestampBN = BigNumber.from(timestamp);
  await ethers.provider.send("evm_mine", [timestampBN.toNumber()]);
}

export async function increaseTimestamp(duration: BigNumberish) {
  const durationBN = BigNumber.from(duration);
  if (durationBN.isNegative())
    throw Error(`Cannot increase time by a negative amount (${duration})`);

  await ethers.provider.send("evm_increaseTime", [durationBN.toNumber()]);

  await advanceBlock();
}

export async function advanceBlockTo(block: number) {
  let latestBlock = (await latestBlockNumber()).toNumber();

  if (block <= latestBlock) {
    throw new Error("input block exceeds current block");
  }

  while (block > latestBlock) {
    await advanceBlock();
    latestBlock++;
  }
}
