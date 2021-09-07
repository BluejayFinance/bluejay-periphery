import { BigNumber, utils, constants } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getLogger, enableAllLog } from "../src/debug";
import { exp } from "../test/utils";

const log = getLogger("deploy");
enableAllLog();

const isInitialized = async ({
  address,
  slot = 0,
  ethers,
}: {
  address: string;
  slot?: number;
  ethers: HardhatRuntimeEnvironment["ethers"];
}) => {
  return (
    (await ethers.provider.getStorageAt(address, slot)) ===
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
};

const ROLE = {
  DEFAULT_ADMIN_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  MINTER_ROLE:
    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  UPGRADEER_ROLE:
    "0x189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e3",
  EXECUTOR_ROLE:
    "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63",
  PROPOSER_ROLE:
    "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1",
  TIMELOCK_ADMIN_ROLE:
    "0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5",
};

export const print = ({
  name,
  value,
}: {
  name: string;
  value: string | number;
}) => {
  log.info(`🧾 ${name}: ${value}`);
};

export const test = ({ name, pass }: { name: string; pass: boolean }) => {
  if (pass) {
    log.info(`✅ ${name}`);
  } else {
    log.error(`⛔️ ${name}`);
  }
};

export const bnToNum = (num: BigNumber, decimal: number) => {
  return num.div(exp(decimal - 8)).toNumber() / 100000000;
};

// Deploys the full infrastructure for the governance token
export const validateDeployment = async (
  {
    governanceImplementationAddr,
    governanceProxyAddr,
    timelockAddr,
    auctionImplementationAddr,
    auctionProxyAddr,
    liquidityMiningAddr,
    deployerAddr,
  }: {
    governanceImplementationAddr: string;
    governanceProxyAddr: string;
    auctionImplementationAddr: string;
    auctionProxyAddr: string;
    timelockAddr: string;
    liquidityMiningAddr: string;
    deployerAddr: string;
  },
  { ethers }: HardhatRuntimeEnvironment
) => {
  const governanceImplementation = (
    await ethers.getContractFactory("GovernanceToken")
  ).attach(governanceImplementationAddr);
  const governanceProxy = (
    await ethers.getContractFactory("GovernanceToken")
  ).attach(governanceProxyAddr);
  const auctionImplementation = (
    await ethers.getContractFactory("Auction")
  ).attach(governanceImplementationAddr);
  const auctionProxy = (await ethers.getContractFactory("Auction")).attach(
    auctionProxyAddr
  );
  const liquidityMining = (
    await ethers.getContractFactory("LiquidityMining")
  ).attach(liquidityMiningAddr);
  const timelock = (
    await ethers.getContractFactory("TimelockController")
  ).attach(timelockAddr);

  // Governance Token Implementation
  log.info("➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖");
  log.info(`Governance Token Implementation @ ${governanceImplementationAddr}`);
  test({
    name: "Initialized",
    pass: await isInitialized({
      address: governanceImplementation.address,
      ethers,
    }),
  });

  // Governance Token Proxy
  log.info("➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖");
  log.info(`Governance Token Proxy @ ${governanceProxyAddr}`);
  test({
    name: "Initialized",
    pass: await isInitialized({
      address: governanceImplementation.address,
      ethers,
    }),
  });
  test({
    name: "Admin role revoked from deployer",
    pass: !(await governanceProxy.hasRole(
      ROLE.DEFAULT_ADMIN_ROLE,
      deployerAddr
    )),
  });
  test({
    name: "Minter role revoked from deployer",
    pass: !(await governanceProxy.hasRole(ROLE.MINTER_ROLE, deployerAddr)),
  });
  test({
    name: "Upgrader role revoked from deployer",
    pass: !(await governanceProxy.hasRole(ROLE.UPGRADEER_ROLE, deployerAddr)),
  });
  test({
    name: "Admin role granted to timelock",
    pass: await governanceProxy.hasRole(ROLE.DEFAULT_ADMIN_ROLE, timelockAddr),
  });
  print({
    name: "Total Supply",
    value: utils.formatEther(await governanceProxy.totalSupply()),
  });
  print({
    name: "Balance of Timelock",
    value: utils.formatEther(await governanceProxy.balanceOf(timelockAddr)),
  });
  print({
    name: "Balance of Auction",
    value: utils.formatEther(await governanceProxy.balanceOf(auctionProxyAddr)),
  });
  print({
    name: "Balance of Liquidity Mining",
    value: utils.formatEther(
      await governanceProxy.balanceOf(liquidityMiningAddr)
    ),
  });
  print({
    name: "Balance of Developer",
    value: utils.formatEther(await governanceProxy.balanceOf(deployerAddr)),
  });

  // Auction Implementation
  log.info("➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖");
  log.info(`Auction Implementation @ ${auctionImplementationAddr}`);
  test({
    name: "Initialized",
    pass: await isInitialized({
      address: auctionImplementation.address,
      ethers,
    }),
  });

  // Auction Proxy
  log.info("➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖");
  log.info(`Auction Proxy @ ${auctionProxyAddr}`);
  test({
    name: "Initialized",
    pass: await isInitialized({
      address: auctionProxy.address,
      ethers,
    }),
  });
  test({
    name: "Admin is Timelock",
    pass:
      (await auctionProxy.owner()).toLowerCase() === timelockAddr.toLowerCase(),
  });
  test({
    name: "Token is BLU",
    pass:
      (await auctionProxy.token()).toLowerCase() ===
      governanceProxyAddr.toLowerCase(),
  });
  print({
    name: "Auction Start Block",
    value: (await auctionProxy.startBlock()).toString(),
  });
  print({
    name: "Auction Period (blocks)",
    value: (await auctionProxy.blocksPerPeriod()).toString(),
  });
  print({
    name: "Token Sold in Each Period",
    value: utils.formatEther(await auctionProxy.tokenPerPeriod()),
  });
  print({
    name: "Maximum Price Adjustment",
    value: bnToNum(await auctionProxy.sensitivity(), 27),
  });
  print({
    name: "Current Price (MATIC)",
    value: bnToNum(await auctionProxy.lastPrice(), 27),
  });

  // Liquidity Mining
  log.info("➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖");
  log.info(`Liquidity Mining @ ${liquidityMiningAddr}`);
  test({
    name: "Admin is Timelock",
    pass:
      (await liquidityMining.owner()).toLowerCase() ===
      timelockAddr.toLowerCase(),
  });
  test({
    name: "Reward is BLU",
    pass:
      (await liquidityMining.reward()).toLowerCase() ===
      governanceProxyAddr.toLowerCase(),
  });
  test({
    name: "Migrator is not set",
    pass:
      (await liquidityMining.migrator()).toLowerCase() ===
      constants.AddressZero,
  });
  print({
    name: "Start Block",
    value: (await liquidityMining.startBlock()).toString(),
  });
  print({
    name: "Bonus",
    value: (await liquidityMining.bonusMultiplier()).toString(),
  });
  print({
    name: "Bonus End Block",
    value: (await liquidityMining.bonusEndBlock()).toString(),
  });
  const noPools = (await liquidityMining.poolLength()).toNumber();
  print({
    name: "Number of Pools",
    value: noPools,
  });
  for (let i = 0; i < noPools; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const poolInfo = await liquidityMining.poolInfo(i);
    print({
      name: `Pool ${0} staked token address`,
      value: poolInfo[0],
    });
    print({
      name: `Pool ${0} allocation points`,
      value: poolInfo[1].toNumber(),
    });
  }

  // Timelock
  log.info("➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖");
  log.info(`Timelock @ ${timelockAddr}`);
  test({
    name: "Developer is a proposer",
    pass: await timelock.hasRole(ROLE.PROPOSER_ROLE, deployerAddr),
  });
  test({
    name: "Developer is a executor",
    pass: await timelock.hasRole(ROLE.EXECUTOR_ROLE, deployerAddr),
  });
  test({
    name: "Developer is timelock admin",
    pass: await timelock.hasRole(ROLE.TIMELOCK_ADMIN_ROLE, deployerAddr),
  });
  print({
    name: "Minimum delay (seconds)",
    value: (await timelock.getMinDelay()).toString(),
  });
};
