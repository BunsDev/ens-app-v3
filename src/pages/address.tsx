import { useRouter } from 'next/router'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { Address } from 'viem'

import { Name } from '@ensdomains/ensjs/subgraph'
import { Button, Spinner } from '@ensdomains/thorin'

import FastForwardSVG from '@app/assets/FastForward.svg'
import { TaggedNameItem } from '@app/components/@atoms/NameDetailItem/TaggedNameItem'
import { NameTableFooter } from '@app/components/@molecules/NameTableFooter/NameTableFooter'
import { ProfileSnippet } from '@app/components/ProfileSnippet'
import NoProfileSnippet from '@app/components/address/NoProfileSnippet'
import { TabWrapper } from '@app/components/pages/profile/TabWrapper'
import { useNamesForAddressPaginated } from '@app/hooks/ensjs/subgraph/useNamesForAddress'
import { usePrimaryProfile } from '@app/hooks/usePrimaryProfile'
import { Content } from '@app/layouts/Content'
import { ContentGrid } from '@app/layouts/ContentGrid'
import { useTransactionFlow } from '@app/transaction-flow/TransactionFlowProvider'
import { shortenAddress } from '@app/utils/utils'

import {
  NameTableHeader,
  NameTableMode,
  SortDirection,
  SortType,
} from '../components/@molecules/NameTableHeader/NameTableHeader'
import { useAccountSafely } from '../hooks/account/useAccountSafely'
import { useChainId } from '../hooks/chain/useChainId'
import { useQueryParameterState } from '../hooks/useQueryParameterState'

const DetailsContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    gap: ${theme.space['2']};
  `,
)

const TabWrapperWithButtons = styled(TabWrapper)(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: normal;
    justify-content: flex-start;
    width: 100%;
    max-width: 100%;
    background: ${theme.colors.backgroundPrimary};
  `,
)

const EmptyDetailContainer = styled.div(
  ({ theme }) => css`
    padding: ${theme.space['4']};
    display: flex;
    justify-content: center;
    align-items: center;
  `,
)

const Page = () => {
  const { t } = useTranslation('address')
  const router = useRouter()
  const { isReady, query } = router
  const { address: _address } = useAccountSafely()

  const address = query.address as Address
  const chainId = useChainId()
  const isSelf = _address === address

  const [mode, setMode] = useState<NameTableMode>('view')
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const handleClickName = (name: string) => () => {
    if (selectedNames.includes(name)) {
      setSelectedNames(selectedNames.filter((n) => n !== name))
    } else {
      setSelectedNames([...selectedNames, name])
    }
  }

  const [sortType, setSortType] = useQueryParameterState<SortType>('sort', 'expiryDate')
  const [sortDirection, setSortDirection] = useQueryParameterState<SortDirection>(
    'direction',
    'asc',
  )
  const [searchQuery, setSearchQuery] = useQueryParameterState<string>('search', '')

  const { data: primaryProfile, isLoading: isPrimaryProfileLoading } = usePrimaryProfile({
    address,
  })

  const getTextRecord = (key: string) => primaryProfile?.texts?.find((x) => x.key === key)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const {
    data: namesData,
    page: namesPage,
    pageCount,
    nameCount,
    isLoading: isNamesLoading,
    status: namesStatus,
  } = useNamesForAddressPaginated({
    address,
    orderBy: sortType || 'expiryDate',
    orderDirection: sortDirection,
    pageSize,
    // TODO (tate): add search query to getNamesForAddress in ensjs
    // search: searchQuery,
  })

  const isNameDisabled = useCallback(
    (name: Name) => {
      if (mode !== 'select') return false
      return !name.expiryDate
    },
    [mode],
  )

  const { prepareDataInput, getTransactionFlowStage } = useTransactionFlow()
  const showExtendNamesInput = prepareDataInput('ExtendNames')
  const transactionKey = `extend-names-${selectedNames.join('-')}`
  const handleExtend = () => {
    if (selectedNames.length === 0) return
    showExtendNamesInput(transactionKey, {
      names: selectedNames,
      isSelf,
    })
  }

  const stage = getTransactionFlowStage(transactionKey)
  useEffect(() => {
    if (stage === 'completed') {
      setSelectedNames([])
      setMode('view')
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const loading = !isReady || isNamesLoading || isPrimaryProfileLoading || !namesData

  const hasErrors = namesStatus === 'error'

  const error = hasErrors ? t('errors.names') : ''

  return (
    <Content title={shortenAddress(address)} copyValue={address} loading={loading}>
      {{
        warning: error
          ? {
              type: 'warning',
              message: error,
            }
          : undefined,
        leading: (
          <DetailsContainer>
            {primaryProfile?.name ? (
              <ProfileSnippet
                name={primaryProfile.name}
                network={chainId}
                button="viewProfile"
                getTextRecord={getTextRecord}
              />
            ) : (
              <NoProfileSnippet />
            )}
          </DetailsContainer>
        ),
        trailing: (
          <TabWrapperWithButtons>
            <NameTableHeader
              selectable={!!_address}
              mode={mode}
              sortType={sortType}
              sortTypeOptionValues={['expiryDate', 'labelName', 'createdAt']}
              sortDirection={sortDirection}
              searchQuery={searchQuery}
              selectedCount={selectedNames.length}
              onModeChange={(m) => {
                setMode(m)
                setSelectedNames([])
              }}
              onSortTypeChange={setSortType}
              onSortDirectionChange={setSortDirection}
              onSearchChange={setSearchQuery}
            >
              {mode === 'select' && (
                <Button
                  size="small"
                  onClick={handleExtend}
                  data-testid="extend-names-button"
                  prefix={<FastForwardSVG />}
                  disabled={selectedNames.length === 0}
                >
                  {t('action.extend', { ns: 'common' })}
                </Button>
              )}
            </NameTableHeader>
            <div>
              {/* eslint-disable no-nested-ternary */}
              {loading ? (
                <EmptyDetailContainer>
                  <Spinner color="accent" />
                </EmptyDetailContainer>
              ) : pageCount === 0 ? (
                <EmptyDetailContainer>{t('noResults')}</EmptyDetailContainer>
              ) : namesData ? (
                namesPage.map((name) => (
                  <TaggedNameItem
                    key={name.id}
                    {...name}
                    network={chainId}
                    mode={mode}
                    selected={selectedNames?.includes(name.name ?? '')}
                    disabled={isNameDisabled(name)}
                    onClick={name.name ? handleClickName(name.name) : undefined}
                  />
                ))
              ) : null}
            </div>
            <NameTableFooter
              current={page}
              onChange={setPage}
              total={nameCount}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </TabWrapperWithButtons>
        ),
      }}
    </Content>
  )
}

Page.getLayout = function getLayout(page: ReactElement) {
  return <ContentGrid>{page}</ContentGrid>
}

export default Page
