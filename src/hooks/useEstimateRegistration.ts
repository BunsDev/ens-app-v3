import { BigNumber } from '@ethersproject/bignumber/lib/bignumber'
import { toUtf8Bytes } from '@ethersproject/strings/lib/utf8'
import { useMemo } from 'react'
import { useQuery } from 'wagmi'

import { formatsByCoinType, formatsByName } from '@ensdomains/address-encoder'
import {
  BaseRegistrationParams,
  makeRegistrationData,
} from '@ensdomains/ensjs/utils/registerHelpers'

import { RegistrationReducerDataItem } from '@app/components/pages/profile/[name]/registration/types'
import { useEns } from '@app/utils/EnsProvider'

import { useAccountSafely } from './useAccountSafely'
import { useChainId } from './useChainId'
import useEstimateTransactionCost from './useEstimateTransactionCost'
import { useNameDetails } from './useNameDetails'
import useRegistrationParams from './useRegistrationParams'

type RegistrationProps = Omit<
  BaseRegistrationParams,
  'resolver' | 'duration' | 'secret' | 'resolverAddress'
> & {
  name: string
}
type GasCostData = [index: number, gas: number]

const BASE_LIMIT = 265428

const byteLengthToDataInx = (byteLength: number) =>
  byteLength > 1 ? Math.ceil(byteLength / 32) + 1 : byteLength

const useEstimateRegistration = (
  gasPrice: BigNumber | undefined,
  data: RegistrationProps | undefined,
) => {
  const chainId = useChainId()
  const { ready, contracts } = useEns()
  const {
    data: gasUsed,
    isLoading: gasUsedLoading,
    isError,
  } = useQuery(
    ['getRegistrationGasEstimate', data],
    async () => {
      const resolver = await contracts?.getPublicResolver()
      if (!resolver) return null
      const registrationTuple = makeRegistrationData({
        ...data!,
        resolver,
        duration: 31557600,
        secret: 'placeholder',
      })
      const result = await fetch('https://gas-estimate-worker.ens-cf.workers.dev/registration', {
        method: 'POST',
        body: JSON.stringify({
          networkId: chainId,
          label: registrationTuple[0],
          owner: registrationTuple[1],
          resolver: registrationTuple[4],
          data: registrationTuple[5],
          reverseRecord: registrationTuple[6],
          ownerControlledFuses: registrationTuple[7],
        }),
        // eslint-disable-next-line @typescript-eslint/naming-convention
      }).then((res) => res.json<{ gas_used: number }>())
      return result.gas_used
    },
    {
      enabled: !!data && ready,
    },
  )

  const { data: gasCosts, isLoading: gasCostsLoading } = useQuery(['gas-costs'], async () => {
    const addr = (await import('@app/assets/gas-costs/addr.json'))
      .default as unknown as GasCostData[]
    const text = (await import('@app/assets/gas-costs/text.json'))
      .default as unknown as GasCostData[]

    return { addr, text }
  })

  const fallbackEstimate = useMemo(() => {
    if (!gasPrice || !gasCosts || !data) return BigNumber.from(0)

    const { addr, text } = gasCosts
    const { reverseRecord } = data
    const {
      texts: textRecords = [],
      coinTypes: addressRecords = [],
      clearRecords,
    } = data.records || {}

    let limit = BASE_LIMIT

    if (reverseRecord) {
      limit += 116396
    }
    if (clearRecords) {
      limit += 26191
    }
    for (const { value } of textRecords) {
      const { byteLength } = toUtf8Bytes(value)
      const bytesAsDataInx = byteLengthToDataInx(byteLength)
      limit += text.find(([dataInx]) => bytesAsDataInx >= dataInx)![1]
    }
    for (const { key, value } of addressRecords) {
      let coinTypeInstance
      if (!Number.isNaN(parseInt(key))) {
        coinTypeInstance = formatsByCoinType[parseInt(key)]
      } else {
        coinTypeInstance = formatsByName[key.toUpperCase()]
      }
      const encodedAddress = coinTypeInstance.decoder(value)
      const bytesAsDataInx = byteLengthToDataInx(encodedAddress.byteLength)
      limit += addr.find(([dataInx]) => bytesAsDataInx >= dataInx)![1]
    }

    return BigNumber.from(limit).mul(gasPrice)
  }, [gasCosts, data, gasPrice])

  const estimate = useMemo(() => {
    if (!gasUsed || !gasPrice) return undefined
    return gasPrice.mul(gasUsed)
  }, [gasUsed, gasPrice])

  return isError
    ? {
        estimate: fallbackEstimate,
        isLoading: gasCostsLoading,
      }
    : {
        estimate,
        isLoading: gasUsedLoading,
      }
}

type FullProps = {
  registrationData: RegistrationReducerDataItem
  price: ReturnType<typeof useNameDetails>['priceData']
  name: string
}

export const useEstimateFullRegistration = ({ registrationData, price, name }: FullProps) => {
  const { data: estimatedCommitData, isLoading: commitGasLoading } =
    useEstimateTransactionCost('COMMIT')
  const { transactionFee: commitGasFee, gasPrice } = estimatedCommitData || {}
  const { address } = useAccountSafely()
  const { owner, fuses, records, reverseRecord } = useRegistrationParams({
    name,
    owner: address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    registrationData,
  })
  const { estimate: registrationGasFee, isLoading: registrationGasLoading } =
    useEstimateRegistration(gasPrice, {
      name,
      owner,
      fuses,
      records,
      reverseRecord,
    })
  const estimatedGasLoading = commitGasLoading || registrationGasLoading
  const estimatedGasFee = useMemo(() => {
    return commitGasFee && registrationGasFee ? commitGasFee.add(registrationGasFee) : undefined
  }, [commitGasFee, registrationGasFee])

  const yearlyFee = price?.base
  const premiumFee = price?.premium
  const hasPremium = premiumFee?.gt(0)
  const totalYearlyFee = yearlyFee?.mul(registrationData.years)

  return {
    estimatedGasFee,
    estimatedGasLoading,
    yearlyFee,
    totalYearlyFee,
    hasPremium,
    premiumFee,
    gasPrice,
    years: registrationData.years,
  }
}

export default useEstimateRegistration
