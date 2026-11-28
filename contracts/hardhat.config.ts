import * as path from 'path';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

// Load root monorepo .env first, then allow local contracts/.env overrides
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const PRIVATE_KEY =
  process.env.PRIVATE_KEY && /^0x?[a-fA-F0-9]{64}$/.test(process.env.PRIVATE_KEY.trim())
    ? process.env.PRIVATE_KEY.trim().startsWith('0x')
      ? process.env.PRIVATE_KEY.trim()
      : `0x${process.env.PRIVATE_KEY.trim()}`
    : '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      evmVersion: 'cancun',
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    bscTestnet: {
      url: process.env.BNB_TESTNET_RPC_URL || 'https://bsc-testnet-rpc.publicnode.com',
      chainId: 97,
      accounts: [PRIVATE_KEY],
    },
    bsc: {
      url: process.env.BNB_RPC_URL || 'https://bsc.publicnode.com',
      chainId: 56,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      bsc: BSCSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY,
    },
  },
};

export default config;
