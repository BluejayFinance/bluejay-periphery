import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { exp, mineBlocks } from "./utils";

const whenLiquidityMiningSetup = async ({
  rewardToMint,
  rewardPerBlock,
  startBlock,
  bonusEndBlock,
  bonusMultiplier,
}: {
  rewardToMint: BigNumber;
  rewardPerBlock: BigNumber;
  startBlock: number;
  bonusEndBlock: number;
  bonusMultiplier: number;
}) => {
  const SimpleToken = await ethers.getContractFactory("SimpleToken");
  const rewardToken = await SimpleToken.deploy("Bluejay Token", "BLU");
  const lpToken1 = await SimpleToken.deploy("LP Token 1", "LP1");
  const lpToken2 = await SimpleToken.deploy("LP Token 2", "LP2");

  const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
  const liquidityMining = await LiquidityMining.deploy(
    rewardToken.address,
    rewardPerBlock,
    startBlock,
    bonusEndBlock,
    bonusMultiplier
  );
  await liquidityMining.add(60, lpToken1.address, false);
  await liquidityMining.add(40, lpToken2.address, true);
  await rewardToken.mint(liquidityMining.address, rewardToMint);

  return { rewardToken, lpToken1, lpToken2, liquidityMining };
};

const BLOCK_TIME = 2; // seconds
const DEFAULT_REWARD_TO_MINT = exp(18).mul(250000); // 250,000 BLU
const DEFAULT_REWARD_PER_BLOCK = DEFAULT_REWARD_TO_MINT.div(5) // 5 years
  .div(365) // 365 days
  .div(24) // 24 hours
  .div(60) // 60 min
  .div(60) // 60 sec
  .mul(BLOCK_TIME); // 1 block per 2 seconds
const DEFAULT_BONUS_END_BLOCK_CHANGE = BigNumber.from(2) // 2 weeks
  .mul(7) // 7 days
  .mul(24) // 24 hours
  .mul(60) // 60 min
  .mul(60) // 60 sec
  .div(BLOCK_TIME); // 1 block per 2 seconds

describe("LiquidityMining", () => {
  it("should reward user who deposited liquidity in different pools", async () => {
    const [, participant1, participant2] = await ethers.getSigners();
    const currentBlock = await ethers.provider.getBlockNumber();
    const { rewardToken, lpToken1, lpToken2, liquidityMining } =
      await whenLiquidityMiningSetup({
        rewardPerBlock: DEFAULT_REWARD_PER_BLOCK,
        rewardToMint: DEFAULT_REWARD_TO_MINT,
        bonusMultiplier: 2,
        bonusEndBlock:
          currentBlock + 20 + DEFAULT_BONUS_END_BLOCK_CHANGE.toNumber(),
        startBlock: currentBlock + 20,
      });

    // Participants get their LP token by depositing liquidity in pool
    await lpToken1.mint(participant1.address, exp(18).mul(4000));
    await lpToken1.mint(participant2.address, exp(18).mul(6000));
    await lpToken2.mint(participant2.address, exp(18).mul(10000));

    // Participants approve mining contract to spend
    await lpToken1
      .connect(participant1)
      .approve(liquidityMining.address, exp(18).mul(4000));
    await lpToken1
      .connect(participant2)
      .approve(liquidityMining.address, exp(18).mul(6000));
    await lpToken2
      .connect(participant2)
      .approve(liquidityMining.address, exp(18).mul(10000));

    // Participant deposit their tokens;
    await liquidityMining.connect(participant1).deposit(0, exp(18).mul(4000));
    await liquidityMining.connect(participant2).deposit(0, exp(18).mul(6000));
    await liquidityMining.connect(participant2).deposit(1, exp(18).mul(10000));

    // Should not have rewards since mining have not started
    expect(
      await liquidityMining.pendingReward(0, participant1.address)
    ).to.equal(0);
    expect(
      await liquidityMining.pendingReward(0, participant2.address)
    ).to.equal(0);
    expect(
      await liquidityMining.pendingReward(1, participant2.address)
    ).to.equal(0);

    // Wait for some time to pass
    await mineBlocks(40, ethers.provider);
    const reward0participant1 = await liquidityMining.pendingReward(
      0,
      participant1.address
    );
    const reward0participant2 = await liquidityMining.pendingReward(
      0,
      participant2.address
    );
    const reward1participant2 = await liquidityMining.pendingReward(
      1,
      participant2.address
    );

    // Should be distributed in the right ratio between the pools
    expect(
      reward0participant1.add(reward0participant2).mul(40).div(60)
    ).to.equal(reward1participant2);

    await mineBlocks(1, ethers.provider);

    const reward0participant1Change = (
      await liquidityMining.pendingReward(0, participant1.address)
    ).sub(reward0participant1);
    const reward0participant2Change = (
      await liquidityMining.pendingReward(0, participant2.address)
    ).sub(reward0participant2);
    const reward1participant2Change = (
      await liquidityMining.pendingReward(1, participant2.address)
    ).sub(reward1participant2);

    // Should have correct amount of pending reward credited each block
    expect(reward0participant1Change).to.be.closeTo(
      DEFAULT_REWARD_PER_BLOCK.mul(2).mul(60).div(100).mul(40).div(100),
      exp(4).toNumber()
    );
    expect(reward0participant2Change).to.be.closeTo(
      DEFAULT_REWARD_PER_BLOCK.mul(2).mul(60).div(100).mul(60).div(100),
      exp(4).toNumber()
    );
    expect(reward1participant2Change).to.be.closeTo(
      DEFAULT_REWARD_PER_BLOCK.mul(2).mul(40).div(100),
      exp(4).toNumber()
    );

    // Should allow participant to withdraw their LP and rewards
    await liquidityMining.connect(participant1).withdraw(0, exp(18).mul(4000));
    await liquidityMining.connect(participant2).withdraw(0, exp(18).mul(6000));
    await liquidityMining.connect(participant2).withdraw(1, exp(18).mul(10000));
    expect(await lpToken1.balanceOf(participant1.address)).to.equal(
      exp(18).mul(4000)
    );
    expect(await lpToken1.balanceOf(participant2.address)).to.equal(
      exp(18).mul(6000)
    );
    expect(await lpToken2.balanceOf(participant2.address)).to.equal(
      exp(18).mul(10000)
    );
    expect(await rewardToken.balanceOf(participant1.address)).to.equal(
      "57838660578384000"
    );
    expect(await rewardToken.balanceOf(participant2.address)).to.equal(
      "192034500253666000"
    );
  });
  it("should not start mining before start block", async () => {
    const [, participant] = await ethers.getSigners();
    const currentBlock = await ethers.provider.getBlockNumber();
    const { lpToken1, liquidityMining } = await whenLiquidityMiningSetup({
      rewardPerBlock: DEFAULT_REWARD_PER_BLOCK,
      rewardToMint: DEFAULT_REWARD_TO_MINT,
      bonusMultiplier: 2,
      bonusEndBlock:
        currentBlock + 1000 + DEFAULT_BONUS_END_BLOCK_CHANGE.toNumber(),
      startBlock: currentBlock + 1000,
    });

    // Participants get their LP token by depositing liquidity in pool
    await lpToken1.mint(participant.address, exp(18).mul(4000));

    // Participants approve mining contract to spend
    await lpToken1
      .connect(participant)
      .approve(liquidityMining.address, exp(18).mul(4000));

    // Participant deposit their tokens;
    await liquidityMining.connect(participant).deposit(0, exp(18).mul(4000));

    // Should not have rewards since mining have not started
    expect(
      await liquidityMining.pendingReward(0, participant.address)
    ).to.equal(0);

    // Wait for some time to pass
    await mineBlocks(40, ethers.provider);

    // Should not have rewards since mining have not started
    expect(
      await liquidityMining.pendingReward(0, participant.address)
    ).to.equal(0);
  });
  it("should not have bonus after the bonus end block", async () => {
    const [, participant] = await ethers.getSigners();
    const currentBlock = await ethers.provider.getBlockNumber();
    const { lpToken1, liquidityMining } = await whenLiquidityMiningSetup({
      rewardPerBlock: DEFAULT_REWARD_PER_BLOCK,
      rewardToMint: DEFAULT_REWARD_TO_MINT,
      bonusMultiplier: 2,
      bonusEndBlock: currentBlock + 20,
      startBlock: currentBlock + 20,
    });

    // Participants get their LP token by depositing liquidity in pool
    await lpToken1.mint(participant.address, exp(18).mul(4000));

    // Participants approve mining contract to spend
    await lpToken1
      .connect(participant)
      .approve(liquidityMining.address, exp(18).mul(4000));

    // Participant deposit their tokens;
    await liquidityMining.connect(participant).deposit(0, exp(18).mul(4000));

    // Should not have rewards since mining have not started
    expect(
      await liquidityMining.pendingReward(0, participant.address)
    ).to.equal(0);

    // Wait for some time to pass
    await mineBlocks(40, ethers.provider);
    const reward0participant = await liquidityMining.pendingReward(
      0,
      participant.address
    );

    await mineBlocks(1, ethers.provider);

    const reward0participantChange = (
      await liquidityMining.pendingReward(0, participant.address)
    ).sub(reward0participant);

    // Should have correct amount of pending reward credited each block
    expect(reward0participantChange).to.be.closeTo(
      DEFAULT_REWARD_PER_BLOCK.mul(60).div(100),
      exp(4).toNumber()
    );
  });
  it("should allow user to withdraw funds when reward is ending", async () => {
    const [, participant1] = await ethers.getSigners();
    const currentBlock = await ethers.provider.getBlockNumber();
    const { rewardToken, lpToken1, liquidityMining } =
      await whenLiquidityMiningSetup({
        rewardPerBlock: DEFAULT_REWARD_PER_BLOCK,
        rewardToMint: BigNumber.from(10000),
        bonusMultiplier: 2,
        bonusEndBlock: currentBlock + 10,
        startBlock: currentBlock + 10,
      });
    // Participants get their LP token by depositing liquidity in pool
    await lpToken1.mint(participant1.address, exp(18).mul(4000));
    // Participants approve mining contract to spend
    await lpToken1
      .connect(participant1)
      .approve(liquidityMining.address, exp(18).mul(4000));
    // Participant deposit their tokens;
    await liquidityMining.connect(participant1).deposit(0, exp(18).mul(4000));
    // Should not have rewards since mining have not started
    expect(
      await liquidityMining.pendingReward(0, participant1.address)
    ).to.equal(0);
    // Wait for some time to pass
    await mineBlocks(40, ethers.provider);
    const reward0participant1 = await liquidityMining.pendingReward(
      0,
      participant1.address
    );

    // User would have accrued lots of tokens
    expect(reward0participant1).to.equal("76103500761032000");
    await liquidityMining.connect(participant1).withdraw(0, exp(18).mul(4000));

    // User get back full balance of LP
    expect(await lpToken1.balanceOf(participant1.address)).to.equal(
      exp(18).mul(4000)
    );
    // User gets remaining balance of rewards token
    expect(await rewardToken.balanceOf(participant1.address)).to.equal("10000");
  });
  it("should allow admin to withdraw reward token", async () => {
    const [deployer] = await ethers.getSigners();
    const currentBlock = await ethers.provider.getBlockNumber();
    const { rewardToken, liquidityMining } = await whenLiquidityMiningSetup({
      rewardPerBlock: DEFAULT_REWARD_PER_BLOCK,
      rewardToMint: BigNumber.from(10000),
      bonusMultiplier: 2,
      bonusEndBlock: currentBlock + 10,
      startBlock: currentBlock + 10,
    });
    const ownerBalanceBefore = await rewardToken.balanceOf(deployer.address);
    const liquidityMiningBalanceBefore = await rewardToken.balanceOf(
      liquidityMining.address
    );
    await liquidityMining.withdrawReward(liquidityMiningBalanceBefore);
    const ownerBalanceAfter = await rewardToken.balanceOf(deployer.address);

    expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(
      liquidityMiningBalanceBefore
    );
  });
  it("should not allow non-admin to withdraw reward token", async () => {
    const [, notOwner] = await ethers.getSigners();
    const currentBlock = await ethers.provider.getBlockNumber();
    const { liquidityMining } = await whenLiquidityMiningSetup({
      rewardPerBlock: DEFAULT_REWARD_PER_BLOCK,
      rewardToMint: BigNumber.from(10000),
      bonusMultiplier: 2,
      bonusEndBlock: currentBlock + 10,
      startBlock: currentBlock + 10,
    });

    await expect(
      liquidityMining.connect(notOwner).withdrawReward(1)
    ).to.revertedWith("Ownable: caller is not the owner");
  });
});
