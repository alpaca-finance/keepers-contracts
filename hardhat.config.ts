import fs from "fs";
import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-preprocessor";

dotenv.config();

function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.trim().split("="));
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 168,
      },
    },
  },
  networks: {
    bsc_mainnet: {
      url: process.env.BSC_MAINNET_RPC,
      accounts: [process.env.MAINNET_DEPLOYER_PRIVATE_KEY!],
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-2-s2.binance.org:8545/",
      accounts: [process.env.TESTNET_DEPLOYER_PRIVATE_KEY!],
    },
    fantom_mainnet: {
      url: process.env.FTM_MAINNET_RPC,
      accounts: [process.env.MAINNET_DEPLOYER_PRIVATE_KEY!],
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
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // This fully resolves paths for imports in the ./lib directory for Hardhat
  preprocess: {
    eachLine: (hre) => ({
      transform: (line: string) => {
        if (line.match(/^\s*import /i)) {
          getRemappings().forEach(([find, replace]) => {
            if (line.match(find)) {
              line = line.replace(find, replace);
            }
          });
        }
        return line;
      },
    }),
  },
};

export default config;
