import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getProxyFactory } from "@openzeppelin/hardhat-upgrades/dist/utils/factories";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getLogger } from "./debug";

const log = getLogger("deployUups");

function getInitializerData(
  ImplFactory: ContractFactory,
  args: unknown[],
  initializer: string
): string {
  const fragment = ImplFactory.interface.getFunction(initializer);
  return ImplFactory.interface.encodeFunctionData(fragment, args);
}

export const deployUups = async ({
  name,
  hre,
  signer,
  implementationContractFactory,
  deploymentOption = {},
  initializer = "initialize",
  initializerArgs,
}: {
  name: string;
  hre: HardhatRuntimeEnvironment;
  signer: SignerWithAddress;
  implementationContractFactory: ContractFactory;
  deploymentOption: any;
  initializer?: string | false;
  initializerArgs: any[];
}) => {
  const implementation = await implementationContractFactory.deploy(
    deploymentOption
  );
  log.info(`Waiting to be mined: ${implementation.deployTransaction.hash}`);
  await implementation.deployed();
  log.info(`Deployed ${name} implementation: ${implementation.address}`);
  const initilizeData = initializer
    ? getInitializerData(
        implementationContractFactory,
        initializerArgs,
        initializer
      )
    : "0x";
  const ProxyFactory = await getProxyFactory(hre, signer);
  const proxy = await ProxyFactory.deploy(
    implementation.address,
    initilizeData,
    deploymentOption
  );
  log.info(`Waiting to be mined: ${proxy.deployTransaction.hash}`);
  await proxy.deployed();
  log.info(`Deployed ${name} Proxy ${proxy.address}`);
  const contract = implementation.attach(proxy.address);
  return { proxy, implementation, contract };
};
