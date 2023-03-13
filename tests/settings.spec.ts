import { expect } from '@playwright/test'
import { Web3RequestKind } from 'headless-web3-provider'

import { test } from '../playwright/fixtures/headless-web3-provider'

test('should allow user to connect', async ({ page, injectHeadlessWeb3Provider }) => {
  const wallet = await injectHeadlessWeb3Provider(page)
  await page.addInitScript(() => (window.ethereum.isMetaMask = true))

  await page.goto('http://localhost:3000')
  await page.locator('text=Connect').click()
  await page.locator('text=MetaMask').click()

  await (async () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 10000)
    }))()

  expect(wallet.getPendingRequestCount(Web3RequestKind.RequestAccounts)).toEqual(1)
  await wallet.authorize(Web3RequestKind.RequestAccounts)
  expect(wallet.getPendingRequestCount(Web3RequestKind.RequestAccounts)).toEqual(0)
  await expect(true).toBe(true)
  await page.pause()
})

// test('should allow user to disconnect', async ({ page, injectHeadlessWeb3Provider }) => {
//   const wallet = await injectHeadlessWeb3Provider(page)
// })
