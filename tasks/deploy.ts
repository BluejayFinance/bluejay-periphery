import { BigNumber, constants } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { getLogger, enableAllLog } from "../src/debug";
import { deployUups } from "../src/deployUups";
import { exp } from "../test/utils";

const log = getLogger("deploy");
enableAllLog();

const BLOCK_TIME = 2; // 2 seconds
const BLOCK_PER_PERIOD = (24 * 60 * 60) / BLOCK_TIME; // 24 hours

// Deploys the full infrastructure for the governance token
export const deploy = async (
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
    gasPrice: txGasPrice = 2,
    timelockDelay = 24 * 60 * 60, // 24 hours
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
    gasPrice: number;
    timelockDelay: number;
  },
  hre: HardhatRuntimeEnvironment
) => {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const gasPrice = parseUnits(txGasPrice.toString(), "gwei");

  log.info(`Deploying from ${deployer.address}`);

  // Deploy BLU token contract
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const { contract: governanceToken } = await deployUups({
    name: "GovernanceToken",
    hre,
    signer: deployer,
    implementationContractFactory: GovernanceToken,
    deploymentOption: { gasPrice },
    initializerArgs: [],
  });

  // Mints 1 million BLU to deployer
  await governanceToken.grantRole(
    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
    deployer.address
  );
  await governanceToken.mint(deployer.address, parseEther("1000000"));
  await governanceToken.revokeRole(
    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
    deployer.address
  );

  // Deploy Auction token contract
  const Auction = await ethers.getContractFactory("Auction");
  const { contract: auction } = await deployUups({
    name: "Auction",
    hre,
    signer: deployer,
    implementationContractFactory: Auction,
    deploymentOption: { gasPrice },
    initializerArgs: [
      governanceToken.address,
      auctionPrice,
      auctionSensitivity,
      auctionBlocksPerPeriod,
      auctionTokensPerPeriod,
      auctionStartBlock,
    ],
  });
  await governanceToken.transfer(auction.address, auctionTokenFunded);
  log.info(`Auction funded`);

  // Deploy Liquidity Mining
  const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
  const liquidityMining = await LiquidityMining.deploy(
    governanceToken.address,
    lmRewardPerBlock,
    lmStartBlock,
    lmBonusEndBlock,
    lmBonusMultiplier,
    { gasPrice }
  );
  await liquidityMining.deployed();
  log.info(`LiquidityMining deployed at ${liquidityMining.address}`);
  await governanceToken.transfer(liquidityMining.address, lmTokenFunded);
  log.info(`LiquidityMining funded`);

  // Deploy Timelock Controller
  const TimelockController = await ethers.getContractFactory(
    "TimelockController"
  );
  const timelock = await TimelockController.deploy(
    timelockDelay,
    [deployer.address],
    [deployer.address]
  );
  await timelock.deployed();
  log.info(`TimelockController deployed at ${timelock.address}`);

  // Transfer remaining governance token to timelock, leaving 1 with deployer to setup swap pool
  await governanceToken.transfer(liquidityMining.address, exp(18).mul(499999));

  // Transfer control of governance token to timelock
  await governanceToken.grantRole(constants.HashZero, timelock.address);
  await governanceToken.revokeRole(constants.HashZero, deployer.address);

  // Transfer control of auction to timelock
  await auction.transferOwnership(timelock.address);

  // Holding off transfer of ownership for liquidity mining after pool has been added
};
