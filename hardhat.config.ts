import { task, types } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-watcher";
import { config } from "./src/config";
import { deploy } from "./tasks/deploy";
import { deployTestUpgrades } from "./tasks/deployTestUpgrades";
import { validateDeployment } from "./tasks/validateDeployment";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  // eslint-disable-next-line no-console
  accounts.forEach((account) => console.log(account.address));
});

task("validateDeployment", "Validate a deployment", async (args: any, hre) => {
  await validateDeployment(args, hre);
})
  .addParam(
    "governanceImplementationAddr",
    "Governance token implementation contract address",
    undefined,
    types.string
  )
  .addParam(
    "governanceProxyAddr",
    "Governance token proxy contract address",
    undefined,
    types.string
  )
  .addParam(
    "auctionImplementationAddr",
    "Auction implementation contract address",
    undefined,
    types.string
  )
  .addParam(
    "auctionProxyAddr",
    "Auction proxy contract address",
    undefined,
    types.string
  )
  .addParam(
    "liquidityMiningAddr",
    "Liquidity mining contract address",
    undefined,
    types.string
  )
  .addParam(
    "timelockAddr",
    "Timelock contract address",
    undefined,
    types.string
  )
  .addParam("deployerAddr", "Deployer's address", undefined, types.string);

task("deploy", "Deploy entire infrastructure", async (args: any, hre) => {
  await deploy(args, hre);
})
  .addParam(
    "auctionStartBlock",
    "Block number where Auction starts",
    undefined,
    types.int
  )
  .addParam(
    "auctionPrice",
    "Price of token in (MATIC/ETH)",
    undefined,
    types.int
  )
  .addParam(
    "lmStartBlock",
    "Block number where Liquidity Mining starts",
    undefined,
    types.int
  )
  .addParam(
    "lmBonusEndBlock",
    "Block number where Liquidity Mining bonus ends",
    undefined,
    types.int
  )
  .addOptionalParam(
    "gasPrice",
    "Gas price for transaction (in Gwei)",
    undefined,
    types.int
  )
  .addOptionalParam(
    "timelockDelay",
    "Delay for timelock transactions (in seconds)",
    undefined,
    types.int
  );

task(
  "deployTestUpgrades",
  "Deploy sample upgrades for testing",
  async (args: any, hre) => {
    await deployTestUpgrades(args, hre);
  }
);

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
// eslint-disable-next-line import/no-default-export
export default {
  solidity: "0.8.4",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  networks: config.networks,
  watcher: {
    test: {
      tasks: ["compile", "test"],
      files: ["./contracts", "./test"],
    },
  },
};
