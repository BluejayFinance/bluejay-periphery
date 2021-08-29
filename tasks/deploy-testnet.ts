import { BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getLogger, enableAllLog } from "../src/debug";
import { exp } from "../test/utils";

const log = getLogger("deploy-testnet");
enableAllLog();

const BLOCK_TIME = 2; // 2 seconds
const BLOCK_PER_PERIOD = (24 * 60 * 60) / BLOCK_TIME; // 24 hours

export const deployTestnet = async (
  {
    auctionStartBlock,
    auctionPrice = exp(24),
    auctionSensitivity = exp(27).mul(2),
    auctionBlocksPerPeriod = BLOCK_PER_PERIOD,
    auctionTokensPerPeriod = exp(18).mul(600),
    auctionTokenFunded = exp(18).mul(250000),
    lmStartBlock,
    lmBonusEndBlock,
    lmRewardPerBlock = exp(18)
      .mul(250000)
      .div(5)
      .div(365)
      .div(24)
      .div(60)
      .div(60)
      .mul(BLOCK_TIME),
    lmBonusMultiplier = 2,
    lmTokenFunded = exp(18).mul(250000),
    deployerFunded = exp(18),
  }: {
    auctionStartBlock: number;
    auctionPrice: BigNumber;
    auctionSensitivity: BigNumber;
    auctionBlocksPerPeriod: number;
    auctionTokensPerPeriod: BigNumber;
    auctionTokenFunded: BigNumber;
    lmStartBlock: number;
    lmBonusEndBlock: number;
    lmRewardPerBlock: BigNumber;
    lmBonusMultiplier: number;
    lmTokenFunded: BigNumber;
    deployerFunded: BigNumber;
  },
  { ethers }: HardhatRuntimeEnvironment
) => {
  const [deployer] = await ethers.getSigners();

  log.info(`Deploying from ${deployer.address}`);

  const SimpleToken = await ethers.getContractFactory("SimpleToken");

  // Deploy governance token
  const bluToken = await SimpleToken.deploy("Bluejay Token", "BLU");
  await bluToken.deployed();
  log.info(`BLU deployed at ${bluToken.address}`);

  await bluToken.mint(deployer.address, deployerFunded);
  log.info(`Deployer funded`);

  // Deploy Auction contract
  const Auction = await ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(
    bluToken.address,
    auctionPrice,
    auctionSensitivity,
    auctionBlocksPerPeriod,
    auctionTokensPerPeriod,
    auctionStartBlock
  );
  await auction.deployed();
  log.info(`Auction deployed at ${auction.address}`);

  await bluToken.mint(auction.address, auctionTokenFunded);
  log.info(`Auction funded`);

  // Deploy Liquidity Mining contract
  const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
  const liquidityMining = await LiquidityMining.deploy(
    bluToken.address,
    lmRewardPerBlock,
    lmStartBlock,
    lmBonusEndBlock,
    lmBonusMultiplier
  );
  await liquidityMining.deployed();
  log.info(`LiquidityMining deployed at ${liquidityMining.address}`);

  await bluToken.mint(liquidityMining.address, lmTokenFunded);
  log.info(`LiquidityMining funded`);

  return bluToken.address;
};
