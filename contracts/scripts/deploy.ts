import { ethers, network } from 'hardhat';

async function main() {
  console.log(`\n========================================`);
  console.log(`Deploying CRAFT TaskRegistry Contract`);
  console.log(`Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log(`========================================\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} BNB\n`);

  let agentIdAddress: string;
  let enforceCheck = true;

  if (network.name === 'bsc') {
    // Official Binance Agent ID Contract on BSC Mainnet
    agentIdAddress = '0x60b9262456de011f7d15a54cdd8c48baaa8b022f';
    enforceCheck = true;
  } else if (network.name === 'bscTestnet') {
    // For testnet, can point to testnet agent id or mock
    agentIdAddress = '0x60b9262456de011f7d15a54cdd8c48baaa8b022f';
    enforceCheck = false; // Allow testing on testnet without mainnet NFT
  } else {
    // Local / Hardhat network: Deploy MockAgentID first
    console.log('Deploying MockAgentID for local testing...');
    const MockAgentFactory = await ethers.getContractFactory('MockAgentID');
    const mockAgent = await MockAgentFactory.deploy();
    await mockAgent.waitForDeployment();
    agentIdAddress = await mockAgent.getAddress();
    console.log(`MockAgentID deployed at: ${agentIdAddress}`);

    // Mint test token to deployer
    await mockAgent.mint(deployer.address);
    console.log(`Minted test Agent ID to: ${deployer.address}`);
  }

  console.log(`\nDeploying TaskRegistry...`);
  console.log(`Agent ID Contract: ${agentIdAddress}`);
  console.log(`Enforce Agent ID: ${enforceCheck}`);

  const TaskRegistryFactory = await ethers.getContractFactory('TaskRegistry');
  const taskRegistry = await TaskRegistryFactory.deploy(agentIdAddress, enforceCheck);
  await taskRegistry.waitForDeployment();

  const taskRegistryAddress = await taskRegistry.getAddress();
  console.log(`\nTaskRegistry successfully deployed to: ${taskRegistryAddress}`);
  console.log(`\nNext 1 — Verify Source Code on BscScan (Mandatory for Hackathon Eligibility):`);
  console.log(`npx hardhat verify --network ${network.name} ${taskRegistryAddress} "${agentIdAddress}" ${enforceCheck}`);
  console.log(`\nNext 2 — Add these Environment Variables to .env & Vercel Project Settings:`);
  console.log(`TASK_REGISTRY_ADDRESS=${taskRegistryAddress}`);
  console.log(`NEXT_PUBLIC_TASK_REGISTRY_ADDRESS=${taskRegistryAddress}`);
  console.log(`NEXT_PUBLIC_TASK_REGISTRY_CHAIN_ID=${network.config.chainId || 56}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
