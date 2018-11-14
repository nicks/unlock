/* eslint no-console: 0 */  // TODO: remove me when this is clean

import React from 'react'
import { LOCATION_CHANGE } from 'react-router-redux'
import { CREATE_LOCK, SET_LOCK, WITHDRAW_FROM_LOCK, resetLock } from '../actions/lock'
import { PURCHASE_KEY, addKey } from '../actions/key'
import { SET_ACCOUNT, LOAD_ACCOUNT, CREATE_ACCOUNT, setAccount, resetAccountBalance } from '../actions/accounts'
import { setNetwork } from '../actions/network'
import { setError } from '../actions/error'
import { SET_PROVIDER } from '../actions/provider'
import { REFRESH_TRANSACTION, addTransaction, refreshTransaction, updateTransaction, deleteTransaction } from '../actions/transaction'

import Web3Service from '../services/web3Service'

// This middleware listen to redux events and invokes the services APIs.
export default function lockMiddleware ({ getState, dispatch }) {

  const web3Service = new Web3Service()

  return function (next) {
    return function (action) {
      if (!web3Service.ready) {
        // We return to make sure other middleware actions are not processed
        return web3Service.connect({
          provider: getState().provider,
        }).then((networkId) => {
          // we dispatch again first.
          dispatch(action)
          // We then set the network
          dispatch(setNetwork(networkId))
          // and refresh or load the account
          return web3Service.refreshOrGetAccount(getState().account)
        }).then((account) => {
          // Set the refreshed account
          dispatch(setAccount(account))
          // We refresh transactions
          Object.values(getState().transactions).forEach((transaction) => dispatch(refreshTransaction(transaction)))
          // We refresh keys
          Object.values(getState().keys).forEach((key) => web3Service.refreshKey(key))
          // We refresh locks
          Object.values(getState().locks).forEach((lock) => web3Service.refreshLock(lock))
        }).catch((error) => {
          // we could not connect
          // TODO: show error to user
          console.error('Failed to connect to web3 service: ')
          console.error(error)
        })
      }

      if (action.type === LOAD_ACCOUNT) {
        web3Service.loadAccount(action.privateKey)
          .then((account) => {
            return dispatch(setAccount(account))
          })
      } else if (action.type === CREATE_ACCOUNT) {
        web3Service.createAccount()
          .then((account) => {
            return dispatch(setAccount(account))
          })
      } else if (action.type === SET_PROVIDER) {
        web3Service.connect({
          provider: action.provider,
        }).then((networkId) => {
          dispatch(setNetwork(networkId))
          return web3Service.refreshOrGetAccount(getState().account)
        }).catch(() => {
          // we could not connect
          // TODO: show error to user
        })
      } else if (action.type === CREATE_LOCK) {
        // Create a lock
        web3Service.createLock(action.lock, getState().account, (transaction, lock) => {
          dispatch(addTransaction(transaction))
          dispatch(resetLock(lock)) // Update the lock accordingly
        }).then(() => {
          // Lock has been deployed and confirmed, we can update the balance
          return web3Service.getAddressBalance(getState().account.address)
        }).then((balance) => {
          dispatch(resetAccountBalance(balance))
        }).catch((error) => {
          // TODO: Since there was an error creating the lock, should also delete that lock!
          dispatch(setError(
            <p>
              There was an error creating your lock.
              {' '}
              {error.message}
            </p>)
          )
        })
      } else if (action.type === PURCHASE_KEY) {
        const account = getState().account
        const lock = Object.values(getState().locks).find((lock) => lock.address === action.key.lockAddress)
        web3Service.purchaseKey(action.key, account, lock, (transaction) => {
          dispatch(addTransaction(transaction))
        }).then(() => {
          return web3Service.getAddressBalance(account.address)
        }).then((balance) => {
          dispatch(resetAccountBalance(balance))
        })
      } else if (action.type === REFRESH_TRANSACTION) {
        web3Service.refreshTransaction(action.transaction)
          .then((transaction) => {
            dispatch(updateTransaction(transaction))
          })
          .catch((error) => {
            console.error(error)
            dispatch(deleteTransaction(action.transaction))
          })
      } else if (action.type === WITHDRAW_FROM_LOCK) {
        const account = getState().account
        web3Service.withdrawFromLock(action.lock, account)
          .then(() => {
            return Promise.all([
              web3Service.getAddressBalance(account.address),
              web3Service.getAddressBalance(action.lock.address),
            ])
          }).then(([accountBalance, lockBalance]) => {
            account.balance = accountBalance
            action.lock.balance = lockBalance
            dispatch(resetAccountBalance(account.balance))
            dispatch(resetLock(action.lock))
          })
      }

      next(action)

      if (action.type === LOCATION_CHANGE) {
        // Location was changed, get the matching lock
        const match = action.payload.pathname.match(/\/lock\/(0x[a-fA-F0-9]{40})$/)
        if (match) {
          web3Service.getLock(match[1]).then((lock) => {
            dispatch(resetLock(lock)) // update the lock
          })
        }
      } else if (action.type === SET_ACCOUNT) {
        const lock = getState().network.lock
        if (lock && lock.address) {
          // TODO(julien): isn't lock always set anyway?
          web3Service.getKey(lock.address, action.account)
            .then((key) => {
              dispatch(addKey(key))
            })
            .catch(() => {
              // The key does not exist
            })
        }
      } else if (action.type === SET_LOCK) {
        // Lock was changed, get the matching key
        web3Service.getKey(action.lock.address, getState().account)
          .then((key) => {
            dispatch(addKey(key))
          })
          .catch(() => {
            // The key does not exist
          })
      }

    }
  }
}
