import { BigNumber } from "ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { exp, mineBlocks } from "./utils";

const whenAuctionDeployed = async ({
  startDelay = 5,
  initialPrice = exp(27).mul(10),
  initialBlocksPerPeriod = (24 * 60 * 60) / 2,
  initialTokenPerPeriod = exp(18).mul(600),
  sensitivity = exp(27).mul(2),
  tokensMinted = exp(18).mul(250000),
}) => {
  const SimpleToken = await ethers.getContractFactory("SimpleToken");
  const rewardToken = await SimpleToken.deploy("Bluejay Token", "BLU");

  const currentBlock = await ethers.provider.getBlockNumber();

  const Auction = await ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(
    rewardToken.address,
    initialPrice,
    sensitivity,
    initialBlocksPerPeriod,
    initialTokenPerPeriod,
    currentBlock + startDelay + 2
  );

  await rewardToken.mint(auction.address, tokensMinted);

  return { rewardToken, auction };
};

describe("Auction", () => {
  describe("periodSinceStart", () => {
    it("should revert if auction has not started", async () => {
      const { auction } = await whenAuctionDeployed({});
      await expect(auction.periodSinceStart()).to.revertedWith(
        "Auction not started"
      );
    });
    it("should return period correctly when auction starts", async () => {
      const { auction } = await whenAuctionDeployed({
        initialBlocksPerPeriod: 5,
      });
      // t = 0
      await mineBlocks(5, ethers.provider);
      // t = 5
      expect(await auction.periodSinceStart()).to.equal(0);
      await mineBlocks(1, ethers.provider);
      // t = 6
      expect(await auction.periodSinceStart()).to.equal(0);
      await mineBlocks(3, ethers.provider);
      // t = 9
      expect(await auction.periodSinceStart()).to.equal(0);
      await mineBlocks(1, ethers.provider);
      // t = 10
      expect(await auction.periodSinceStart()).to.equal(1);
      await mineBlocks(49, ethers.provider);
      // t = 59
      expect(await auction.periodSinceStart()).to.equal(10);
    });
  });
  describe("adjustedPrice", () => {
    it("should return the same price if it sold exactly 50% of tokens last period", async () => {
      const { auction } = await whenAuctionDeployed({
        startDelay: 0,
      });
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300))
      ).to.equal(exp(27).mul(10));
    });
    it("should return positive price adjustments correctly", async () => {
      const { auction } = await whenAuctionDeployed({
        startDelay: 0,
      });
      // sold 10% above target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 1.1))
      ).to.equal(exp(27).mul(10).mul(110).div(100));
      // sold 20% above target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 1.2))
      ).to.equal(exp(27).mul(10).mul(120).div(100));
      // sold 30% above target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 1.3))
      ).to.equal(exp(27).mul(10).mul(130).div(100));
      // sold 40% above target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 1.4))
      ).to.equal(exp(27).mul(10).mul(140).div(100));
      // sold 50% above target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 1.5))
      ).to.equal(exp(27).mul(10).mul(150).div(100));
      // sold 60% above target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 1.6))
      ).to.equal(exp(27).mul(10).mul(160).div(100));
      // sold 70% above target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 1.7))
      ).to.equal(exp(27).mul(10).mul(170).div(100));
      // sold 80% above target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 1.8))
      ).to.equal(exp(27).mul(10).mul(180).div(100));
      // sold 90% above target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 1.9))
      ).to.equal(exp(27).mul(10).mul(190).div(100));
      // sold 100% above target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 2))
      ).to.equal(exp(27).mul(10).mul(200).div(100));
    });
    it("should return negative price adjustments correctly", async () => {
      const { auction } = await whenAuctionDeployed({
        startDelay: 0,
      });
      //   sold 10% below target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 0.9))
      ).to.equal(exp(27).mul(10).mul(95).div(100));
      // sold 20% below target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 0.8))
      ).to.equal(exp(27).mul(10).mul(90).div(100));
      // sold 30% below target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 0.7))
      ).to.equal(exp(27).mul(10).mul(85).div(100));
      // sold 40% below target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 0.6))
      ).to.equal(exp(27).mul(10).mul(80).div(100));
      // sold 50% below target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 0.5))
      ).to.equal(exp(27).mul(10).mul(75).div(100));
      // sold 60% below target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 0.4))
      ).to.equal(exp(27).mul(10).mul(70).div(100));
      // sold 70% below target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 0.3))
      ).to.equal(exp(27).mul(10).mul(65).div(100));
      // sold 80% below target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 0.2))
      ).to.equal(exp(27).mul(10).mul(60).div(100));
      // sold 90% below target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 0.1))
      ).to.equal(exp(27).mul(10).mul(55).div(100));
      // sold 100% below target
      expect(
        await auction.adjustedPrice(exp(27).mul(10), exp(18).mul(300 * 0))
      ).to.equal(exp(27).mul(10).mul(50).div(100));
    });
  });
  describe("currentPrice", () => {
    it("should return the last price if still in same period", async () => {
      const { auction } = await whenAuctionDeployed({
        startDelay: 0,
      });
      expect(await auction.currentPrice()).to.equal(exp(27).mul(10));
    });
    it("should return the updated price if last period had no sale", async () => {
      const { auction } = await whenAuctionDeployed({
        startDelay: 0,
        initialBlocksPerPeriod: 5,
      });
      await mineBlocks(5, ethers.provider);
      expect(await auction.currentPrice()).to.equal(exp(27).mul(5));
    });
    it("should return the updated price if last period has little sale", async () => {
      const { auction } = await whenAuctionDeployed({
        startDelay: 0,
        initialBlocksPerPeriod: 5,
        initialPrice: exp(27).mul(1),
      });
      await auction.buyToken({ value: exp(18).mul(100) }); // buy 100
      await mineBlocks(5, ethers.provider);
      expect(await auction.currentPrice()).to.equal(
        exp(27).sub(exp(27).div(2).mul(2).div(3))
      );
    });
    it("should return the updated price if there were period without sale", async () => {
      const { auction } = await whenAuctionDeployed({
        startDelay: 0,
        initialBlocksPerPeriod: 5,
        initialPrice: exp(27).mul(1),
      });
      await auction.buyToken({ value: exp(18).mul(100) }); // buy 100 in first period
      await mineBlocks(14, ethers.provider); // buy 0 in second & third period
      expect(await auction.currentPrice()).to.closeTo(
        exp(27).sub(exp(27).div(2).mul(2).div(3)).div(4),
        10
      );
    });
  });
  describe("updatePrice", () => {
    it("should do nothing when period is lastTransactedPeriod", async () => {
      const { auction } = await whenAuctionDeployed({
        startDelay: 0,
        initialBlocksPerPeriod: 5,
        initialPrice: exp(27).mul(1),
      });
      await auction.buyToken({ value: exp(18).mul(100) });
      await auction.buyToken({ value: exp(18).mul(100) });
      expect(await auction.lastPrice()).to.equal(exp(27).mul(1));
      expect(await auction.lastTokenSoldInPeriod()).to.equal(exp(18).mul(200));
      expect(await auction.lastTransactedPeriod()).to.equal(0);
      await auction.updatePrice();
      expect(await auction.lastPrice()).to.equal(exp(27).mul(1));
      expect(await auction.lastTokenSoldInPeriod()).to.equal(exp(18).mul(200));
      expect(await auction.lastTransactedPeriod()).to.equal(0);
    });
    it("should update when one period passed", async () => {
      const { auction } = await whenAuctionDeployed({
        startDelay: 0,
        initialBlocksPerPeriod: 5,
        initialPrice: exp(27).mul(1),
      });
      await auction.buyToken({ value: exp(18).mul(100) });
      await mineBlocks(5, ethers.provider);
      expect(await auction.lastPrice()).to.equal(exp(27).mul(1));
      expect(await auction.lastTokenSoldInPeriod()).to.equal(exp(18).mul(100));
      expect(await auction.lastTransactedPeriod()).to.equal(0);
      await auction.updatePrice();
      expect(await auction.lastPrice()).to.equal("666666666666666666666666667");
      expect(await auction.lastTokenSoldInPeriod()).to.equal(0);
      expect(await auction.lastTransactedPeriod()).to.equal(1);
    });
    it("should update when more than one period passed", async () => {
      const { auction } = await whenAuctionDeployed({
        startDelay: 0,
        initialBlocksPerPeriod: 5,
        initialPrice: exp(27).mul(1),
      });
      await auction.buyToken({ value: exp(18).mul(100) });
      await mineBlocks(15, ethers.provider);
      expect(await auction.lastPrice()).to.equal(exp(27).mul(1));
      expect(await auction.lastTokenSoldInPeriod()).to.equal(exp(18).mul(100));
      expect(await auction.lastTransactedPeriod()).to.equal(0);
      await auction.updatePrice();
      expect(await auction.lastPrice()).to.equal("166666666666666666666666667");
      expect(await auction.lastTokenSoldInPeriod()).to.equal(0);
      expect(await auction.lastTransactedPeriod()).to.equal(3);
    });
  });
  describe("buyToken", () => {
    it("should not work before auction start", async () => {
      const { auction } = await whenAuctionDeployed({ startDelay: 5 });
      await expect(auction.buyToken({ value: exp(18) })).to.revertedWith(
        "Auction not started"
      );
    });
    it("should not sell more than tokenPerPeriod", async () => {
      const [deployer] = await ethers.getSigners();
      const { auction, rewardToken } = await whenAuctionDeployed({
        initialPrice: exp(24), // 1 wei to 1000 token
        startDelay: 0,
      });
      await auction.buyToken({ value: exp(18) });
      expect(await rewardToken.balanceOf(deployer.address)).to.equal(
        exp(18).mul(600)
      );
      expect(await ethers.provider.getBalance(auction.address)).to.equal(
        "600000000000000000"
      );
    });
    it("should not accept buy when tokens are all sold", async () => {
      const { auction } = await whenAuctionDeployed({
        tokensMinted: BigNumber.from(0),
        startDelay: 0,
      });
      expect(await ethers.provider.getBalance(auction.address)).to.equal(0);
    });
    it("should accept multiple buy within a period", async () => {
      const [, p1, p2] = await ethers.getSigners();
      const { auction, rewardToken } = await whenAuctionDeployed({
        initialPrice: exp(25), // 100 token / wei
        startDelay: 0,
        initialBlocksPerPeriod: 5,
      });
      await auction.connect(p1).buyToken({ value: exp(18) });
      await auction.connect(p2).buyToken({ value: exp(18).mul(2) });
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        exp(18).mul(100)
      );
      expect(await rewardToken.balanceOf(p2.address)).to.equal(
        exp(18).mul(200)
      );
      expect(await ethers.provider.getBalance(auction.address)).to.equal(
        "3000000000000000000"
      );
    });
    it("should update price correctly across multiple periods (decreasing)", async () => {
      const [, p1, p2] = await ethers.getSigners();
      const { auction, rewardToken } = await whenAuctionDeployed({
        initialPrice: exp(25), // 100 / token
        startDelay: 0,
        initialBlocksPerPeriod: 5,
      });

      // Period: 0
      // Price: 0.01
      // P1: 1 eth > 100 token
      // P2: 2 eth > 200 token
      // Next price: 0.01
      await auction.connect(p1).buyToken({ value: exp(18) });
      await auction.connect(p2).buyToken({ value: exp(18).mul(2) });
      await mineBlocks(3, ethers.provider);
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        exp(18).mul(100)
      );
      expect(await rewardToken.balanceOf(p2.address)).to.equal(
        exp(18).mul(200)
      );
      expect(await ethers.provider.getBalance(auction.address)).to.equal(
        "3000000000000000000"
      );
      expect(await auction.currentPrice()).to.equal(
        "10000000000000000000000000"
      );

      // Period: 1
      // Price: 0.01
      // P1: 0.5 eth > 50 token
      // P2: 1 eth > 100 token
      // Next price: 0.0075
      await auction.connect(p1).buyToken({ value: exp(18).div(2) });
      await auction.connect(p2).buyToken({ value: exp(18) });
      await mineBlocks(3, ethers.provider);
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        exp(18).mul(150)
      );
      expect(await rewardToken.balanceOf(p2.address)).to.equal(
        exp(18).mul(300)
      );
      expect(await ethers.provider.getBalance(auction.address)).to.equal(
        "4500000000000000000"
      );
      expect(await auction.currentPrice()).to.equal(
        "7500000000000000000000000"
      );

      // Period: 2
      // Price: 0.0075
      // P1: 1 eth > 133.33 token
      // Next price: 0.0054166
      await auction.connect(p1).buyToken({
        value: exp(18),
      });
      await mineBlocks(4, ethers.provider);
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        "283333333333333333333"
      );
      expect(await ethers.provider.getBalance(auction.address)).to.equal(
        "5500000000000000000"
      );

      // Period: 3
      // Price: 0.0054166
      // Next price: 0.00027083
      expect(await auction.currentPrice()).to.equal(
        "5416666666666666666662501"
      );
      await mineBlocks(5, ethers.provider);

      // Period: 3
      // Price: 0.00027083
      // P2: 1 eth > 3692.35 token
      expect(await auction.currentPrice()).to.equal(
        "2708333333333333333331251"
      );
      await auction.connect(p2).buyToken({
        value: exp(18),
      });
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        "283333333333333333333"
      );
      expect(await rewardToken.balanceOf(p2.address)).to.equal(
        "669230769230769230769"
      );
    });
    it("should update price correctly across multiple periods (increasing)", async () => {
      const [, p1] = await ethers.getSigners();
      const { auction, rewardToken } = await whenAuctionDeployed({
        initialPrice: exp(25), // 100 / token
        startDelay: 0,
        initialBlocksPerPeriod: 5,
      });

      // Period 0
      // Price: 0.01
      // P1: 6 eth > 600 token
      await auction.connect(p1).buyToken({ value: exp(18).mul(6) });
      await mineBlocks(4, ethers.provider);
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        "600000000000000000000"
      );

      // Period 1
      // Price: 0.02
      // P1: 12 eth > 600 token
      await auction.connect(p1).buyToken({ value: exp(18).mul(12) });
      await mineBlocks(4, ethers.provider);
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        "1200000000000000000000"
      );

      // Period 2
      // Price: 0.04
      // P1: 12 eth > 300 token
      await auction.connect(p1).buyToken({ value: exp(18).mul(12) });
      await mineBlocks(4, ethers.provider);
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        "1500000000000000000000"
      );

      // Period 3
      // Price: 0.04
      // P1: 14 eth > 350 token
      await auction.connect(p1).buyToken({ value: exp(18).mul(14) });
      await mineBlocks(4, ethers.provider);
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        "1850000000000000000000"
      );
      expect(await ethers.provider.getBalance(auction.address)).to.equal(
        "44000000000000000000"
      );
    });
    it("should revert on shutdown", async () => {
      const [, p1] = await ethers.getSigners();
      const { auction } = await whenAuctionDeployed({
        initialPrice: exp(25), // 100 / token
        startDelay: 0,
        initialBlocksPerPeriod: 5,
      });

      await auction.connect(p1).buyToken({ value: exp(18).mul(6) });
      await mineBlocks(4, ethers.provider);

      await auction.emergencyShutdown();
      await expect(
        auction.connect(p1).buyToken({ value: exp(18).mul(6) })
      ).to.revertedWith("Auction is on shutdown");
    });
  });
  describe("withdraw", () => {
    it("should be callable by owner to withdraw funds", async () => {
      const [deployer, p1] = await ethers.getSigners();
      const { auction } = await whenAuctionDeployed({
        initialPrice: exp(25), // 100 token / wei
        startDelay: 0,
        initialBlocksPerPeriod: 5,
      });
      await auction.connect(p1).buyToken({ value: exp(18).mul(2) });
      const initialDeployerBalance = await ethers.provider.getBalance(
        deployer.address
      );
      await auction.withdraw(exp(18).mul(2), deployer.address);
      const finalDeployerBalance = await ethers.provider.getBalance(
        deployer.address
      );
      expect(
        finalDeployerBalance.sub(initialDeployerBalance).div(exp(14))
      ).closeTo("20000", 10);
    });
    it("should not be callable by others to withdraw funds", async () => {
      const [deployer, p1] = await ethers.getSigners();
      const { auction } = await whenAuctionDeployed({
        initialPrice: exp(25), // 100 token / wei
        startDelay: 0,
        initialBlocksPerPeriod: 5,
      });
      await auction.connect(p1).buyToken({ value: exp(18).mul(2) });
      await expect(
        auction.connect(p1).withdraw(exp(18).mul(2), deployer.address)
      ).to.revertedWith("Ownable: caller is not the owner");
      expect(await ethers.provider.getBalance(auction.address)).to.equal(
        exp(18).mul(2)
      );
    });
  });
  describe("updatePriceManually", () => {
    it("should be callable by owner to update price in emergency (ie dos)", async () => {
      const [, p1] = await ethers.getSigners();
      const { auction, rewardToken } = await whenAuctionDeployed({
        initialPrice: exp(25), // 100 token / wei
        startDelay: 0,
        initialBlocksPerPeriod: 5,
      });
      await auction.connect(p1).buyToken({ value: exp(18) });
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        "100000000000000000000"
      );
      await mineBlocks(19, ethers.provider);
      expect(await auction.currentPrice()).to.equal("833333333333333333333334");
      await auction.updatePriceManually(exp(25));
      expect(await auction.currentPrice()).to.equal(
        "10000000000000000000000000"
      );
      await auction.connect(p1).buyToken({ value: exp(18) });
      expect(await rewardToken.balanceOf(p1.address)).to.equal(
        "200000000000000000000"
      );
    });
  });
});
