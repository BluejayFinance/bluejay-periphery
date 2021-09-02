import { expect } from "chai";
import { BigNumber, constants } from "ethers";
import { ethers, upgrades } from "hardhat";

const whenGovernanceTokenDeployed = async () => {
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const governanceToken = await upgrades.deployProxy(GovernanceToken, {
    kind: "uups",
  });
  return { governanceToken };
};

const MINTER_ROLE =
  "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
const UPGRADER_ROLE =
  "0x189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e3";
describe("GovernanceToken", () => {
  it("should be deployable", async () => {
    const { governanceToken } = await whenGovernanceTokenDeployed();
    expect(await governanceToken.name()).to.equal("Bluejay Token");
  });
  it("should be upgradable", async () => {
    const [deployer, user] = await ethers.getSigners();
    const { governanceToken } = await whenGovernanceTokenDeployed();
    await governanceToken.grantRole(MINTER_ROLE, deployer.address);
    await governanceToken.grantRole(UPGRADER_ROLE, deployer.address);
    await governanceToken.mint(
      user.address,
      BigNumber.from("100000000000000000000")
    );
    const GovernanceTokenSimpleUpgrade = await ethers.getContractFactory(
      "GovernanceTokenSimpleUpgrade"
    );
    const upgradedToken = await upgrades.upgradeProxy(
      governanceToken,
      GovernanceTokenSimpleUpgrade
    );
    expect(await upgradedToken.version()).to.equal("v2");
    expect(await upgradedToken.balanceOf(user.address)).to.equal(
      BigNumber.from("100000000000000000000")
    );
  });
  it("should be mintable", async () => {
    const [deployer, user] = await ethers.getSigners();

    const { governanceToken } = await whenGovernanceTokenDeployed();
    await governanceToken.grantRole(MINTER_ROLE, deployer.address);

    await governanceToken.mint(
      user.address,
      BigNumber.from("100000000000000000000")
    );
    expect(await governanceToken.balanceOf(user.address)).to.equal(
      BigNumber.from("100000000000000000000")
    );
  });
  it("should not be minted without permission", async () => {
    const [, user] = await ethers.getSigners();
    const { governanceToken } = await whenGovernanceTokenDeployed();
    await expect(
      governanceToken
        .connect(user)
        .mint(user.address, BigNumber.from("100000000000000000000"))
    ).to.revertedWith(
      "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
    );
  });
  it("should be able to add minter", async () => {
    const [, user] = await ethers.getSigners();
    const { governanceToken } = await whenGovernanceTokenDeployed();
    await governanceToken.grantRole(MINTER_ROLE, user.address);
    await governanceToken
      .connect(user)
      .mint(user.address, BigNumber.from("100000000000000000000"));
    expect(await governanceToken.balanceOf(user.address)).to.equal(
      BigNumber.from("100000000000000000000")
    );
  });
  it("should be able to transfer admin role to hardware wallet", async () => {
    const [deployer, user] = await ethers.getSigners();
    const { governanceToken } = await whenGovernanceTokenDeployed();
    await governanceToken.grantRole(constants.HashZero, user.address);
    await governanceToken.revokeRole(constants.HashZero, deployer.address);
    await governanceToken.connect(user).grantRole(MINTER_ROLE, user.address);
    await governanceToken
      .connect(user)
      .mint(user.address, BigNumber.from("100000000000000000000"));
    expect(await governanceToken.balanceOf(user.address)).to.equal(
      BigNumber.from("100000000000000000000")
    );
    await expect(
      governanceToken.grantRole(MINTER_ROLE, user.address)
    ).to.revertedWith(
      "AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
    );
  });
});
