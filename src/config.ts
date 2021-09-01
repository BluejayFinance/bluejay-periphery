import { config as loadEnv } from "dotenv";

loadEnv();

const generateNetworks = () => {
  if (!process.env.ALCHEMY_KEY)
    throw new Error(`ALCHEMY_KEY not set in config`);
  if (!process.env.MATIC_ACCOUNT_1)
    throw new Error(`MATIC_ACCOUNT_1 not set in config`);
  if (!process.env.MUMBAI_ACCOUNT_1)
    throw new Error(`MUMBAI_ACCOUNT_1 not set in config`);
  return {
    hardhat: {},
    matic: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [process.env.MATIC_ACCOUNT_1],
      chainId: 137,
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [process.env.MUMBAI_ACCOUNT_1],
      chainId: 80001,
    },
  };
};

const generateConfig = () => ({
  networks: generateNetworks(),
});

export const config = generateConfig();
