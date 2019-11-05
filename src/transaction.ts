import crypto from 'crypto'
import ECDSA from 'elliptic'
import {toHexString} from './util'
import _ from 'lodash'

const ec = new ECDSA.ec('secp256k1')

class UnspentTxOut {
  public readonly id: string
  public readonly index: number
  public readonly address: string
  public readonly amount: number

  constructor(id: string, index: number, address: string, amount: number) {
    this.id = id
    this.index = index
    this.address = address
    this.amount = amount
  }
}

class TxIn {
  public txOutId: string
  public txOutIndex: number
  public signature: string
}

class TxOut {
  public address: string // ECDSA public-key
  public amount: number

  constructor(address: string, amount: number) {
    this.address = address
    this.amount = amount
  }
}

class Transaction {
  public id: string
  public txIns: TxIn[]
  public txOuts: TxOut[]
}

const getTransactionId = (transaction: Transaction): string => {
  const txInContent: string = transaction.txIns
    .map((txIn: TxIn) => txIn.txOutId + txIn.txOutIndex)
    .reduce((a, b) => a + b, '')

  const txOutContent: string = transaction.txOuts
    .map((txOut: TxOut) => txOut.address + txOut.amount)
    .reduce((a, b) => a + b, '')

  return crypto.createHmac('sha256', '')
    .update(txInContent + txOutContent)
    .digest('hex')
}

let unspentTxOuts: UnspentTxOut[] = []

const findUnspentTxOut = (txOutId: string, txOutIndex: number, aUnspentTxOuts: UnspentTxOut[]) => {
  return _(aUnspentTxOuts).find(uTxO => uTxO.id === txOutId && uTxO.index === txOutIndex)
}

const signTxIn = (transaction: Transaction, txInIndex: number, privateKey: string, aUnspentTxOuts: UnspentTxOut[]): string => {
  const txIn: TxIn = transaction.txIns[txInIndex]
  const dataToSign = transaction.id

  const referencedUnspentTxOut: UnspentTxOut = findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts)
  if (referencedUnspentTxOut == null) {
    throw new Error('could not find referencedUnspentTxOut')
  }

  const referencedAddress = referencedUnspentTxOut.address
  const publicKey = ec.keyFromPrivate(privateKey, 'hex').getPublic(false, 'hex')

  if (publicKey !== referencedAddress) {
    throw new Error('trying to sign an input with private' +
    ' key that does not match the address that is referenced in txIn')
  }

  const key = ec.keyFromPrivate(privateKey, 'hex')
  const signature: string = toHexString(key.sign(dataToSign).toDER())
  return signature
}

const updateUnspentTxOuts = (aTransactions: Transaction[], aUnspentTxOuts: UnspentTxOut[]): UnspentTxOut[] => {
  const newUnspentTxOuts: UnspentTxOut[] = aTransactions
    .map(t => {
      // TxOut 的 index 是怎么确定的
      return t.txOuts.map((txOut, index) => new UnspentTxOut(t.id, index, txOut.address, txOut.amount))
    })
    .reduce((a, b) => a.concat(b), [])

  const consumedUnspentTxOuts: UnspentTxOut[] = aTransactions
    .map(t => {
      return t.txIns.map(txIn => new UnspentTxOut(txIn.txOutId, txIn.txOutIndex, '', 0))
    })
    .reduce((a, b) => a.concat(b), [])

  return aUnspentTxOuts
    .filter(uTxO => !findUnspentTxOut(uTxO.id, uTxO.index, consumedUnspentTxOuts))
    .concat(newUnspentTxOuts)
}

// valid address is a valid ecdsa public key in the 04 + X-coordinate + Y-coordinate format
const isValidAddress = (address: string): boolean => {
  if (address.length !== 130) {
      console.log('invalid public key length')
      return false
  } else if (address.match('^[a-fA-F0-9]+$') === null) {
      console.log('public key must contain only hex characters')
      return false
  } else if (!address.startsWith('04')) {
      console.log('public key must start with 04')
      return false
  }
  return true
}

export {
  UnspentTxOut,
  TxOut,
  TxIn,
  Transaction,

  getTransactionId,
  signTxIn
}
