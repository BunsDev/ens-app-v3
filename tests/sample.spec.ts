import { Web3RequestKind } from 'headless-web3-provider'

import { test } from '../playwright/fixtures/headless-web3-provider'

test('connect the wallet', async ({ page, injectWeb3Provider }) => {
  // Inject window.ethereum instance
  const wallet = await injectWeb3Provider(page)

  await page.goto('https://metamask.github.io/test-dapp/')

  // Request connecting the wallet
  await page.locator('text=Connect').click()

  // You can either authorize or reject the request
  await wallet.authorize(Web3RequestKind.RequestAccounts)

  // Verify if the wallet is really connected
  await test.expect(page.locator('text=Connected')).toBeVisible()
  await test.expect(page.locator('text=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')).toBeVisible()
})
