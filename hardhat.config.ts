import { task, types } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-watcher";
import { config } from "./src/config";
import { deploy } from "./tasks/deploy";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  // eslint-disable-next-line no-console
  accounts.forEach((account) => console.log(account.address));
});

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
    "Delay for timelock transactions",
    undefined,
    types.int
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
