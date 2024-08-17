import * as dotenv from 'dotenv'
dotenv.config()

import { HardhatUserConfig } from 'hardhat/types'
import { task } from 'hardhat/config'

// Plugins

import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import '@typechain/hardhat'

// Networks

interface NetworkConfig {
  network: string
  chainId: number
  gas?: number | 'auto'
  gasPrice?: number | 'auto'
}

const networkConfigs: NetworkConfig[] = [
  { network: 'mainnet', chainId: 1 },
  { network: 'ropsten', chainId: 3 },
  { network: 'rinkeby', chainId: 4 },
  { network: 'kovan', chainId: 42 },
]

function getAccountMnemonic() {
  return process.env.MNEMONIC || ''
}

function getDefaultProviderURL(network: string) {
  return `https://${network}.infura.io/v3/${process.env.INFURA_KEY}`
}

function setupDefaultNetworkProviders(buidlerConfig) {
  for (const netConfig of networkConfigs) {
    buidlerConfig.networks[netConfig.network] = {
      chainId: netConfig.chainId,
      url: getDefaultProviderURL(netConfig.network),
      gas: netConfig.gasPrice || 'auto',
      gasPrice: netConfig.gasPrice || 'auto',
      accounts: {
        mnemonic: getAccountMnemonic(),
      },
    }
  }
}

// Tasks

task('accounts', 'Prints the list of accounts', async (taskArgs, bre) => {
  const accounts = await bre.ethers.getSigners()
  for (const account of accounts) {
    console.log(await account.getAddress())
  }
})

// Config

const config: HardhatUserConfig = {
  paths: {
    sources: './contracts',
    tests: './test',
    artifacts: './build/contracts',
  },
  mocha: {
    timeout: 100000000
  },
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          outputSelection: {
            '*': {
              '*': ['storageLayout'],
            },
          },
        },
      },
    ],
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 1,
      accounts: [process.env.PRIVATE_KEY],
    },
    rinkeby: {
        url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
        chainId: 4,
        accounts: [process.env.PRIVATE_KEY],
    },
    mumbai: {
      url: 'https://polygon-mumbai.g.alchemy.com/v2/YYZyqE0v2BO7ap26Ie16IWdRWpr2T0Wy',
      accounts: [process.env.PRIVATE_KEY],
    },
    matic: {
      url: 'https://polygon-mainnet.g.alchemy.com/v2/RiEdJAsZdbKF1nIOcrNerAF1YgEOVfbR',
      accounts: [process.env.PRIVATE_KEY],
    },
    bsc: {
      url: 'https://bsc-testnet.publicnode.com',
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY],
    },
    bsc_mainnet: {
      url: 'https://bsc-dataseed.binance.org',
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY],
    },
    avaxTest: {
      url: 'https://ava-testnet.public.blastapi.io/ext/bc/C/rpc',
      chainId: 43113,
      accounts: [`${process.env.PRIVATE_KEY}`]
    },
    avaxMain: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      chainId: 43114,
      accounts: [`${process.env.PRIVATE_KEY}`]
    },
    ganache: {
      chainId: 1337,
      url: 'http://localhost:8545',
    },
  },
  etherscan: {
    //  apiKey: "NURDXE28N6MM9VI216UCSEBZVV5IA7UWSS" // for ether net work
     apiKey: "N2E5BV7EU18ZEFEMGM8YS5NBPPQH9QJK3Q"
    // apiKey: "BCT83TFQ1QJ7XPRIVG2V82YVF6SVTRVNDE"
  },
  typechain: {
    outDir: 'build/types',
    target: 'ethers-v5',
  },
}

setupDefaultNetworkProviders(config)

export default config
