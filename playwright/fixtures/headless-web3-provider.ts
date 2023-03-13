import { test as base } from '@playwright/test'
import { injectHeadlessWeb3Provider } from 'headless-web3-provider'

export const test = base.extend<{}, { signers: string[]; injectHeadlessWeb3Provider: any }>({
  // signers - the private keys that are to be used in the tests
  signers: [
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  ],

  // injectWeb3Provider - function that injects web3 provider instance into the page
  injectHeadlessWeb3Provider: async ({ signers }, use) => {
    await use((page, privateKeys = signers) =>
      injectHeadlessWeb3Provider(
        page,
        privateKeys, // Private keys that you want to use in tests
        1337, // Chain ID - 31337 is common testnet id
        'http://localhost:8545', // Ethereum client's JSON-RPC URL
      ),
    )
  },
})
