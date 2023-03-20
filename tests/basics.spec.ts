import { expect } from '@playwright/test'
import { ethers } from 'ethers'
import { Web3RequestKind } from 'headless-web3-provider'

import { test } from '../playwright/fixtures/headless-web3-provider'

test('should allow user to connect', async ({ page, injectHeadlessWeb3Provider }) => {
  const wallet = await injectHeadlessWeb3Provider(page)

  // Connect account
  await page.goto('http://localhost:3000')
  await page.locator('text=Connect').click()
  await page.locator('text=Injected Wallet').click()
  await page.isVisible('text=Confirm connection in Injected Wallet')
  expect(wallet.getPendingRequestCount(Web3RequestKind.RequestAccounts)).toEqual(1)
  await wallet.authorize(Web3RequestKind.RequestAccounts)
  expect(wallet.getPendingRequestCount(Web3RequestKind.RequestAccounts)).toEqual(0)
  await page.isVisible('text=0xf39...92266')

  // Register name
  const name = `name-${Math.floor(Math.random() * 1000000)}.eth`
  await page.goto(`http://localhost:3000/${name}`)

  await page.locator('text=Ethereum').click()
  await page.getByTestId('primary-name-toggle').click()
  await page.locator('text=Next').click()
  await page.isVisible('text=Registering your name takes three steps')
  await page.getByTestId('next-button').click()
  await page.locator('text=Open Wallet').click()
  await wallet.authorize(Web3RequestKind.SendTransaction)
  // await expect(await page.getByTestId('countdown-complete-check')).toBeVisible()

  await page.pause()
  await page.evaluate(async () => {
    await window.ethereum!.request({ method: 'evm_increaseTime', params: [60] })
    await window.ethereum!.request({ method: 'evm_mine', params: [] })
  })

  await page.getByTestId('finish-button', { timeout: 120000 }).click()
  await page.locator('text=Open Wallet').click()
  await wallet.authorize(Web3RequestKind.SendTransaction)

  await page.pause()

  // Switch account
  await wallet.changeAccounts([
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  ])
  await page.isVisible('text=0x59c...8690d')

  // Test getGasPrice
  await page.goto('http://localhost:3000/wrapped.eth')
  const expiryLocator = await page.getByTestId('owner-profile-button-name.expiry')

  await expect(expiryLocator.innerText()).not.toEqual('expiryno expiry')
  const expiryLabel = await expiryLocator.innerText()

  const expiryDate = new Date(expiryLabel.replace('expiry', '').trim())
  expiryDate.setFullYear(expiryDate.getFullYear() + 1)
  console.log('expiryDate', expiryDate)
  const newExpiryLable = `expiry\n${expiryDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`
  console.log(newExpiryLable)

  await page.pause()
  await page.locator('text=Extend').click()
  await page.getByTestId('extend-names-confirm').click()
  await page.locator('text=Open Wallet').click()
  await wallet.authorize(Web3RequestKind.SendTransaction)
  await page.getByTestId('transaction-modal-complete-button').click()
  await expect(await page.getByTestId('owner-profile-button-name.expiry').innerText()).toEqual(
    newExpiryLable,
  )
  await page.pause()

  // Perform a transaction
  const newSubname = `sn${Math.floor(Math.random() * 1000000)}`
  await page.goto('http://localhost:3000/wrapped.eth?tab=subnames')
  await page.locator('text=New subname').click()
  await page.getByTestId('add-subname-input').type(newSubname)
  await page.getByTestId('create-subname-next').click()
  await page.locator('text=Open Wallet').click()
  await wallet.authorize(Web3RequestKind.SendTransaction)
  await page.getByTestId('transaction-modal-complete-button').click()
})

// test('should allow user to disconnect', async ({ page, injectHeadlessWeb3Provider }) => {
//   const wallet = await injectHeadlessWeb3Provider(page)
// })
