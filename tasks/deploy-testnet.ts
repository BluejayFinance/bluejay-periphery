import { BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getLogger, enableAllLog } from "../src/debug";
import { exp } from "../test/utils";

const log = getLogger("timelock");
enableAllLog();

const BLOCK_TIME = 2;

export const deployTestnet = async (
  _: any,
  { ethers }: HardhatRuntimeEnvironment
) => {
  const [deployer] = await ethers.getSigners();

  log.info(`Deploying from ${deployer.address}`);

  const SimpleToken = await ethers.getContractFactory("SimpleToken");

  // Deploy LP token
  const lpToken = await SimpleToken.deploy("LP Token", "LPT");
  await lpToken.deployed();
  await lpToken.mint(deployer.address, exp(18).mul(1000000));
  log.info(`LPT deployed at ${lpToken.address}`);

  // Deploy governance token
  const bluToken = await SimpleToken.deploy("Bluejay Token", "BLU");
  await bluToken.deployed();
  log.info(`BLU deployed at ${bluToken.address}`);

  // Deploy Liquidity Mining contract
  const currentBlockNumber = await ethers.provider.getBlockNumber();
  const startBlock = BigNumber.from(5)
    .mul(60)
    .div(BLOCK_TIME)
    .add(currentBlockNumber); // 5 minutes later
  const bonusEndBlock = BigNumber.from(15)
    .mul(60)
    .div(BLOCK_TIME)
    .add(currentBlockNumber); // 15 minutes later
  const LiquidityMining = await ethers.getContractFactory("LiquidityMining");
  const liquidityMining = await LiquidityMining.deploy(
    bluToken.address,
    exp(16),
    startBlock,
    bonusEndBlock,
    2
  );
  await liquidityMining.deployed();
  log.info(`LiquidityMining deployed at ${liquidityMining.address}`);

  await liquidityMining.add(60, lpToken.address, true);
  log.info(`LiquidityMining added pool`);

  await bluToken.mint(liquidityMining.address, exp(18).mul(1000000));
  log.info(`LiquidityMining funded`);

  return bluToken.address;
};
