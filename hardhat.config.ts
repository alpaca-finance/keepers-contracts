import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.12",
  networks: {
    bsc_mainnet: {
      url: process.env.BSC_MAINNET_RPC,
      accounts: [process.env.MAINNET_DEPLOYER_PRIVATE_KEY!],
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-2-s2.binance.org:8545/",
      accounts: [process.env.TESTNET_DEPLOYER_PRIVATE_KEY!],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts/8.12",
    tests: "./tests",
    cache: "./cahce",
    artifacts: "./artifacts",
  },
};

export default config;
