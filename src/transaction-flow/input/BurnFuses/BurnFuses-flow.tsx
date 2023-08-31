import { ChildFuseReferenceType } from '@root/.yalc/@ensdomains/ensjs/dist/types/utils'
import { Dispatch } from 'react'

import BurnFusesContent from '@app/components/@molecules/BurnFuses/BurnFusesContent'
import { useWrapperData } from '@app/hooks/ensjs/public/useWrapperData'
import { deleteProperties } from '@app/utils/utils'

import { makeTransactionItem } from '../../transaction'
import { TransactionDialogPassthrough, TransactionFlowAction } from '../../types'

type Data = {
  name: string
}

export type Props = {
  data: Data
  onDismiss: () => void
  dispatch: Dispatch<TransactionFlowAction>
} & TransactionDialogPassthrough

export const BurnFuses = ({ data, onDismiss, dispatch }: Props) => {
  const { name } = data
  const { data: wrapperData } = useWrapperData({ name })

  const onSubmit = (selectedFuses: ChildFuseReferenceType['Key'][], permissions: string[]) => {
    dispatch({
      name: 'setTransactions',
      payload: [
        makeTransactionItem('burnFuses', {
          name: name as string,
          selectedFuses,
          permissions,
        }),
      ],
    })
    dispatch({ name: 'setFlowStage', payload: 'transaction' })
  }

  return (
    <BurnFusesContent
      fuseData={
        wrapperData
          ? deleteProperties(wrapperData.fuses.child, 'unnamed', 'CAN_DO_EVERYTHING')
          : undefined
      }
      onDismiss={onDismiss}
      onSubmit={onSubmit}
    />
  )
}

export default BurnFuses
