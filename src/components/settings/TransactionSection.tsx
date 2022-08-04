import { useChainName } from '@app/hooks/useChainName'
import { useTransactionFlow } from '@app/transaction-flow/TransactionFlowProvider'
import { makeEtherscanLink } from '@app/utils/utils'
import { Button, Spinner, Typography } from '@ensdomains/thorin'
import { useClearRecentTransactions, useRecentTransactions } from '@rainbow-me/rainbowkit'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { Card } from '../Card'
import { Outlink } from '../Outlink'
import { SectionContainer, SectionHeading } from './Section'

const TransactionSectionHeadingContainer = styled.div(
  () => css`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  `,
)

const TransactionSectionHeading = styled(SectionHeading)<{
  $hasTransactions: boolean
}>(
  ({ theme, $hasTransactions }) => css`
    position: relative;
    ${$hasTransactions &&
    css`
      &::after {
        content: '';
        position: absolute;
        height: ${theme.space['3']};
        width: ${theme.space['3']};
        background-color: ${theme.colors.red};
        border-radius: ${theme.radii.full};
        top: ${theme.space['2']};
      }
    `}
  `,
)

const TransactionSectionContainer = styled.div<{ $transactionLength: number }>(
  ({ theme, $transactionLength }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: ${theme.colors.foregroundSecondary};
    width: 100%;
    height: ${theme.space['13']};
    border-radius: ${theme.radii.extraLarge};
    overflow: hidden;
    transition: 0.2s all ease-in-out, 0s justify-content 0s linear, 0s color 0s linear;
    ${$transactionLength &&
    css`
      ${TransactionSectionHeading} {
        color: transparent;
      }
      justify-content: flex-end;
      height: calc(${$transactionLength} * ${theme.space['18']});
      background-color: transparent;
      border: 1px solid ${theme.colors.borderTertiary};
    `}
  `,
)

const RecentTransactionsMessage = styled(Typography)(
  ({ theme }) => css`
    color: ${theme.colors.textTertiary};
  `,
)

const TransactionContainer = styled(Card)(
  ({ theme }) => css`
    width: 100%;
    min-height: ${theme.space['18']};
    padding: 0 ${theme.space['3']};
    flex-direction: row;
    justify-content: space-between;
    gap: ${theme.space['3']};
    flex-gap: ${theme.space['3']};
    border: none;
    border-bottom: 1px solid ${theme.colors.borderTertiary};
    border-radius: ${theme.radii.none};
    &:last-of-type {
      border: none;
    }
  `,
)

const TransactionInfoContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding-left: ${theme.space['1']};
    gap: ${theme.space['0.5']};
  `,
)

const StyledOutlink = styled(Outlink)<{ $error: boolean }>(
  ({ theme, $error }) =>
    $error &&
    css`
      color: ${theme.colors.red};
    `,
)

const ContinueContainer = styled.div(
  ({ theme }) => css`
    max-width: ${theme.space['48']};
    width: ${theme.space.full};
  `,
)

const ViewMoreInner = styled(Typography)(
  ({ theme }) => css`
    width: 100%;
    text-align: center;
    color: ${theme.colors.textSecondary};
  `,
)

export const TransactionSection = () => {
  const { t: tc } = useTranslation()
  const { t } = useTranslation('settings')

  const chainName = useChainName()
  const transactions = useRecentTransactions()
  const clearTransactions = useClearRecentTransactions()
  const [viewAmt, setViewAmt] = useState(5)

  const { getResumable, resumeTransactionFlow } = useTransactionFlow()

  return (
    <SectionContainer data-testid="transaction-section" $name="transactions">
      <TransactionSectionHeadingContainer>
        <TransactionSectionHeading
          $hasTransactions={transactions.filter((x) => x.status === 'pending').length > 0}
          variant="large"
          weight="bold"
        >
          {t('section.transaction.title')}
        </TransactionSectionHeading>
        <div>
          <Button
            size="small"
            shadowless
            variant="secondary"
            onClick={() => clearTransactions()}
            disabled={transactions.length === 0}
            data-testid="transaction-clear-button"
          >
            {tc('action.clear')}
          </Button>
        </div>
      </TransactionSectionHeadingContainer>
      <TransactionSectionContainer $transactionLength={transactions.length}>
        {transactions.length > 0 ? (
          <>
            {transactions.slice(0, viewAmt - 1).map((transaction) => {
              const { action, key } = JSON.parse(transaction.description)
              const resumable = key && getResumable(key)
              return (
                <TransactionContainer data-testid={`transaction-${transaction.status}`} key={transaction.hash}>
                  {transaction.status === 'pending' && <Spinner data-testid="pending-spinner" color="accent" />}
                  <TransactionInfoContainer>
                    <Typography weight="bold">{tc(`transaction.description.${action}`)}</Typography>
                    <StyledOutlink
                      $error={transaction.status === 'failed'}
                      href={makeEtherscanLink(transaction.hash, chainName)}
                      target="_blank"
                    >
                      {tc(`transaction.status.${transaction.status}.regular`)}
                    </StyledOutlink>
                  </TransactionInfoContainer>
                  <ContinueContainer>
                    {resumable && (
                      <Button shadowless size="small" variant="primary" onClick={() => resumeTransactionFlow(key)}>
                        Continue
                      </Button>
                    )}
                  </ContinueContainer>
                </TransactionContainer>
              )
            })}
            {transactions.length > viewAmt && (
              <TransactionContainer
                onClick={() => setViewAmt((curr) => curr + 5)}
                data-testid="transaction-view-more-button"
              >
                <ViewMoreInner weight="bold">{tc('transaction.viewMore')}</ViewMoreInner>
              </TransactionContainer>
            )}
          </>
        ) : (
          <RecentTransactionsMessage weight="bold">
            {t('section.transaction.noRecentTransactions')}
          </RecentTransactionsMessage>
        )}
      </TransactionSectionContainer>
    </SectionContainer>
  )
}
