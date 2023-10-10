const hre = require("hardhat");
const fs = require("fs");

const config = {
  goerli: [
    "0x3ef8D010f76dc42e7479CF5A914ae45AdE76eb32", // owner
    "0x3ef8D010f76dc42e7479CF5A914ae45AdE76eb32", // rewardsDistribution
    "0x909ef0b6cF52B7cB2B3390F7e8147997E3A2E52D", // rewardsToken
    "0xb5adeaa28209b9dc0a9cac380b6f3ad59744c7ca", // stakingToken
  ],
  mainnet: [
    "0x2f16615234827eE4dF14d02d40C24E6a258dD360", // owner
    "0x2f16615234827eE4dF14d02d40C24E6a258dD360", // rewardsDistribution
    "0x67F4C72a50f8Df6487720261E188F2abE83F57D7", // rewardsToken
    "0xa7fd8ff8f4cada298286d3006ee8f9c11e2ff84e", // stakingToken
  ],
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const network = await deployer.provider.getNetwork();

  console.log(`Deploying StakingRewards to ${network.name}`);

  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceFormatted = hre.ethers.formatEther(balance);
  const address = await deployer.getAddress();

  console.log(`Deployer: ${address}`);
  console.log(`Balance: ${balanceFormatted} ETH`);

  const [owner, rewardsDistribution, rewardsToken, stakingToken] =
    config[network.name];

  if (!owner) {
    throw new Error("Owner address not found");
  }

  if (!rewardsDistribution) {
    throw new Error("Rewards distribution address not found");
  }

  if (!rewardsToken) {
    throw new Error("Rewards token address not found");
  }

  if (!stakingToken) {
    throw new Error("Staking token address not found");
  }

  const stakingRewards = await hre.ethers.deployContract("StakingRewards", [
    owner,
    rewardsDistribution,
    rewardsToken,
    stakingToken,
  ]);

  await stakingRewards.waitForDeployment();

  console.log(`StakingRewards deployed to ${stakingRewards.target}`);

  const tx = stakingRewards.deploymentTransaction();

  const receipt = await tx.wait(5);

  await hre.run("verify:verify", {
    address: stakingRewards.target,
    constructorArguments: [
      owner,
      rewardsDistribution,
      rewardsToken,
      stakingToken,
    ],
  });

  console.log("StakingRewards verified");

  const deploymentDetails = {
    owner: owner,
    rewardsDistribution: rewardsDistribution,
    rewardsToken: rewardsToken,
    stakingToken: stakingToken,
    stakingRewards: stakingRewards.target,
    blockNumber: receipt.blockNumber,
    transactionHash: receipt.hash,
  };

  console.log(JSON.stringify(deploymentDetails, null, 2));

  fs.writeFileSync(
    `./deployments/${network.name}.json`,
    JSON.stringify(deploymentDetails, null, 2)
  );

  console.log(
    `Deployment details written to ./deployments/${network.name}.json`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
