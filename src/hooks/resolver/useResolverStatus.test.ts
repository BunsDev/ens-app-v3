import { mockFunction, renderHook } from '@app/test-utils'

import { useResolverStatus } from '@app/hooks/resolver/useResolverStatus'
import { useContractAddress } from '@app/hooks/useContractAddress'
import { ReturnedENS } from '@app/types/index'
import { NAMEWRAPPER_AWARE_RESOLVERS } from '@app/utils/constants'

const makeProfile = ({
  texts: _texts,
  coinTypes: _coinTypes,
  contentHash: _contentHash,
  abi: _abi,
  resolverAddress: _resolverAddress,
}: {
  texts?: { key: string; value: string }[]
  coinTypes?: { coin: string; addr: string }[]
  contentHash?: { protocolType: string; decoded: string }
  abi?: { contentType: number; data: string }
  resolverAddress?: string
}) => {
  const texts = Object.entries(
    [{ key: 'test', value: 'test' }, ...(_texts || [])].reduce((acc, { key, value }) => ({
      ...acc,
      [key]: value,
    })),
  ).map(([key, value]) => ({ key, value, type: 'text' }))
  const coinTypes = Object.entries(
    [{ coin: 'ETH', addr: '0x123' }, ...(_coinTypes || [])].reduce((acc, { coin, addr }) => ({
      ...acc,
      [coin]: addr,
    })),
  ).map(([coin, addr]) => ({ coin, addr, type: 'addr' }))
  const contentHash = _contentHash || { protocolType: 'ipfs', decoded: '0x123' }
  const abi = _abi || { contentType: 1, data: '[{}]' }
  const resolverAddress = _resolverAddress ?? NAMEWRAPPER_AWARE_RESOLVERS['1'][0]
  return {
    records: {
      texts,
      coinTypes,
      contentHash,
      abi,
    },
    resolverAddress,
  } as unknown as ReturnedENS['getProfile']
}

const mockBasicName = jest.fn().mockReturnValue({ isWrapped: false, isLoading: false })
jest.mock('@app/hooks/useBasicName', () => ({
  useBasicName: (_: string, options: any) => {
    if (options?.enabled ?? true) return mockBasicName()
    return { data: undefined, isLoading: false }
  },
}))

const mockUseLatestResolverProfile = jest
  .fn()
  .mockReturnValue({ loading: false, profile: makeProfile({}) })
const mockUseProfile = jest.fn().mockReturnValue({ loading: false, profile: makeProfile({}) })
jest.mock('@app/hooks/useProfile', () => ({
  useProfile: jest.fn().mockImplementation((_, options = {}) => {
    if (options?.skip) return { data: undefined, loading: false }
    if (options?.resolverAddress) {
      return mockUseLatestResolverProfile()
    }
    return mockUseProfile()
  }),
}))

jest.mock('@app/hooks/useContractAddress')
const mockUseContractAddress = mockFunction(useContractAddress)
mockUseContractAddress.mockReturnValue('0xlatest')

const mockUseResolverIsAuthorized = jest.fn().mockReturnValue({
  data: { isAuthorized: true, isValid: true },
  isLoading: false,
})
jest.mock('@app/hooks/resolver/useResolverIsAuthorized', () => ({
  useResolverIsAuthorized: (_: string, options: any) => {
    if (options?.enabled ?? true) return mockUseResolverIsAuthorized()
    return { data: undefined, isLoading: false }
  },
}))

const mockUseResolverType = jest.fn().mockReturnValue({ data: { type: 'latest' } })
jest.mock('@app/hooks/resolver/useResolverType', () => ({
  useResolverType: (_: string, options: any) => {
    if (options?.enabled ?? true) return mockUseResolverType()
    return { data: undefined, isLoading: false }
  },
}))

const makeResult = (keys?: string[], isLoading = false) => ({
  data: {
    hasResolver: false,
    hasLatestResolver: false,
    hasValidResolver: false,
    isAuthorized: false,
    hasProfile: false,
    hasMigratedProfile: false,
    isMigratedProfileEqual: false,
    isNameWrapperAware: false,
    ...(keys || []).reduce((acc, key) => {
      return {
        ...acc,
        [key]: true,
      }
    }, {}),
  },
  isLoading,
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('useResolverStatus', () => {
  it('should return expected values for base mock data', () => {
    const { result } = renderHook(() => useResolverStatus('test.eth'))
    expect(result.current).toMatchObject(
      makeResult([
        'hasLatestResolver',
        'hasProfile',
        'hasResolver',
        'hasValidResolver',
        'isAuthorized',
        'hasMigratedProfile',
        'isMigratedProfileEqual',
        'isNameWrapperAware',
      ]),
    )
    expect(mockBasicName).toHaveBeenCalled()
    expect(mockUseProfile).toHaveBeenCalled()
    expect(mockUseResolverType).toHaveBeenCalled()
    expect(mockUseResolverIsAuthorized).not.toHaveBeenCalled()
    expect(mockUseLatestResolverProfile).not.toHaveBeenCalled()
  })

  it('should return data is undefined if name is empty', () => {
    const { result } = renderHook(() => useResolverStatus(''))
    expect(result.current).toMatchObject({ data: undefined, isLoading: false })
    expect(mockBasicName).not.toHaveBeenCalled()
    expect(mockUseProfile).not.toHaveBeenCalled()
    expect(mockUseResolverType).not.toHaveBeenCalled()
    expect(mockUseResolverIsAuthorized).not.toHaveBeenCalled()
    expect(mockUseLatestResolverProfile).not.toHaveBeenCalled()
  })

  it('should return data is undefined if enabled is false', () => {
    const { result } = renderHook(() => useResolverStatus('test.eth', { enabled: false }))
    expect(result.current).toMatchObject({ data: undefined, isLoading: false })
    expect(mockBasicName).not.toHaveBeenCalled()
    expect(mockUseProfile).not.toHaveBeenCalled()
    expect(mockUseResolverType).not.toHaveBeenCalled()
    expect(mockUseResolverIsAuthorized).not.toHaveBeenCalled()
    expect(mockUseLatestResolverProfile).not.toHaveBeenCalled()
  })

  it('should not call useBasicName if isWrapped is defined', () => {
    const { result } = renderHook(() => useResolverStatus('test.eth', { isWrapped: true }))
    expect(result.current).toMatchObject(
      makeResult([
        'hasLatestResolver',
        'hasProfile',
        'hasResolver',
        'hasValidResolver',
        'isAuthorized',
        'hasMigratedProfile',
        'isMigratedProfileEqual',
        'isNameWrapperAware',
      ]),
    )
    expect(mockBasicName).not.toHaveBeenCalled()
    expect(mockUseProfile).toHaveBeenCalled()
    expect(mockUseResolverType).toHaveBeenCalled()
    expect(mockUseResolverIsAuthorized).not.toHaveBeenCalled()
    expect(mockUseLatestResolverProfile).not.toHaveBeenCalled()
  })

  it('should not call useProfile if profile is defined in options', () => {
    const { result } = renderHook(() => useResolverStatus('test.eth', { profile: makeProfile({}) }))
    expect(result.current).toMatchObject(
      makeResult([
        'hasLatestResolver',
        'hasProfile',
        'hasResolver',
        'hasValidResolver',
        'isAuthorized',
        'hasMigratedProfile',
        'isMigratedProfileEqual',
        'isNameWrapperAware',
      ]),
    )
    expect(mockBasicName).toHaveBeenCalled()
    expect(mockUseProfile).not.toHaveBeenCalled()
    expect(mockUseResolverType).toHaveBeenCalled()
    expect(mockUseResolverIsAuthorized).not.toHaveBeenCalled()
    expect(mockUseLatestResolverProfile).not.toHaveBeenCalled()
  })

  it('should not return hasLatestResolver is true if resolverType is not latest', () => {
    mockUseResolverType.mockReturnValueOnce({ data: { type: 'outdated' } })
    const { result } = renderHook(() => useResolverStatus('test.eth'))
    expect(result.current).toMatchObject(
      makeResult([
        'hasProfile',
        'hasResolver',
        'hasValidResolver',
        'isAuthorized',
        'hasMigratedProfile',
        'isMigratedProfileEqual',
        'isNameWrapperAware',
      ]),
    )
    expect(mockBasicName).toHaveBeenCalled()
    expect(mockUseProfile).toHaveBeenCalled()
    expect(mockUseResolverType).toHaveBeenCalled()
    expect(mockUseResolverIsAuthorized).toHaveBeenCalled()
    expect(mockUseLatestResolverProfile).toHaveBeenCalled()
  })

  it('should not return isMigratedProfileEqual is true if latest resolver profile does not match', () => {
    mockUseResolverType.mockReturnValueOnce({ data: { type: 'outdated' } })
    mockUseLatestResolverProfile.mockReturnValueOnce({
      profile: makeProfile({ texts: [{ key: 'nickname', value: 'Rumpleskilskin' }] }),
      loading: false,
    })
    const { result } = renderHook(() => useResolverStatus('test.eth'))
    expect(result.current).toMatchObject(
      makeResult([
        'hasProfile',
        'hasResolver',
        'hasValidResolver',
        'isAuthorized',
        'hasMigratedProfile',
        'isNameWrapperAware',
      ]),
    )
    expect(mockBasicName).toHaveBeenCalled()
    expect(mockUseProfile).toHaveBeenCalled()
    expect(mockUseResolverType).toHaveBeenCalled()
    expect(mockUseResolverIsAuthorized).toHaveBeenCalled()
    expect(mockUseLatestResolverProfile).toHaveBeenCalled()
  })

  it('should not return hasMigratedProfile if latest resolver profile does not have records', () => {
    mockUseResolverType.mockReturnValueOnce({ data: { type: 'outdated' } })
    mockUseLatestResolverProfile.mockReturnValueOnce({
      data: { records: {}, resolverAddress: NAMEWRAPPER_AWARE_RESOLVERS['1'][0] },
      isLoading: false,
    })
    const { result } = renderHook(() => useResolverStatus('test.eth'))
    expect(result.current).toMatchObject(
      makeResult([
        'hasProfile',
        'hasResolver',
        'hasValidResolver',
        'isAuthorized',
        'isNameWrapperAware',
      ]),
    )
    expect(mockBasicName).toHaveBeenCalled()
    expect(mockUseProfile).toHaveBeenCalled()
    expect(mockUseResolverType).toHaveBeenCalled()
    expect(mockUseResolverIsAuthorized).toHaveBeenCalled()
    expect(mockUseLatestResolverProfile).toHaveBeenCalled()
  })

  it('should not call mockUseLatestResolverProfile if skipCompare option is true', () => {
    mockUseResolverType.mockReturnValueOnce({ data: { type: 'outdated' } })
    const { result } = renderHook(() => useResolverStatus('test.eth', { skipCompare: true }))
    expect(result.current).toMatchObject(
      makeResult([
        'hasProfile',
        'hasResolver',
        'hasValidResolver',
        'isAuthorized',
        'isNameWrapperAware',
      ]),
    )
    expect(mockBasicName).toHaveBeenCalled()
    expect(mockUseProfile).toHaveBeenCalled()
    expect(mockUseResolverType).toHaveBeenCalled()
    expect(mockUseResolverIsAuthorized).toHaveBeenCalled()
    expect(mockUseLatestResolverProfile).not.toHaveBeenCalled()
  })
})
