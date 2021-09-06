import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseUnits } from "ethers/lib/utils";
import { getLogger, enableAllLog } from "../src/debug";

const log = getLogger("deploy");
enableAllLog();

// Deploys the full infrastructure for the governance token
export const deployTestUpgrades = async (
  _: any,
  hre: HardhatRuntimeEnvironment
) => {
  const gasPrice = parseUnits("2", "gwei");

  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  log.info(`Deploying from ${deployer.address}`);

  // Deploy upgrade for Auction
  const AuctionSimpleUpgrade = await ethers.getContractFactory(
    "AuctionSimpleUpgrade"
  );
  const auctionSimpleUpgrade = await AuctionSimpleUpgrade.deploy({ gasPrice });
  await auctionSimpleUpgrade.deployed();
  log.info(`AuctionSimpleUpgrade: ${auctionSimpleUpgrade.address}`);

  // Deploy upgrade for GovernanceToken
  const GovernanceTokenSimpleUpgrade = await ethers.getContractFactory(
    "GovernanceTokenSimpleUpgrade"
  );
  const governanceTokenSimpleUpgrade =
    await GovernanceTokenSimpleUpgrade.deploy({ gasPrice });
  await governanceTokenSimpleUpgrade.deployed();
  log.info(
    `GovernanceTokenSimpleUpgrade: ${governanceTokenSimpleUpgrade.address}`
  );
};
