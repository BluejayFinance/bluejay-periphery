import { ethers } from "hardhat";
import { BigNumber } from "ethers";

export const exp = (exponent: number) => {
  return BigNumber.from(10).pow(exponent);
};

export const mineBlocks = async (
  blocksToMine: number,
  provider: typeof ethers.provider
) => {
  for (let i = 0; i < blocksToMine; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await provider.send("evm_mine", []);
  }
};

export const increaseTime = async (
  timeToIncrease: number,
  provider: typeof ethers.provider
) => {
  await provider.send("evm_increaseTime", [timeToIncrease]);
  await provider.send("evm_mine", []);
};
