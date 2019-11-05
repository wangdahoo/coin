import ECDSA from 'elliptic'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { UnspentTxOut, TxIn, TxOut, Transaction, getTransactionId, signTxIn } from './transaction'
import _ from 'lodash'

const ec = new ECDSA.ec('secp256k1')
const PRIVATE_KEY_LOCATION = '../wallet/private_key'

const generatePrivatekey = (): string => {
  const keyPair = ec.genKeyPair()
  const privateKey = keyPair.getPrivate()
  return privateKey.toString(16)
}

const initWallet = () => {
  if (existsSync(PRIVATE_KEY_LOCATION)) {
    return
  }
  const privateKey = generatePrivatekey()

  writeFileSync(PRIVATE_KEY_LOCATION, privateKey)
  console.log('new wallet with private key created')
}

const getPrivateFromWallet = (): string => {
  const buffer = readFileSync(PRIVATE_KEY_LOCATION, 'utf8')
  return buffer.toString()
}

const getPublicFromWallet = (): string => {
  const privateKey = getPrivateFromWallet()
  const key = ec.keyFromPrivate(privateKey, 'hex')
  return key.getPublic(false, 'hex')
}

const getBalance = (address: string, unspentTxOuts: UnspentTxOut[]): number => {
  return _(unspentTxOuts)
    .filter((uTxO: UnspentTxOut) => uTxO.address === address)
    .map((uTxO: UnspentTxOut) => uTxO.amount)
    .sum()
}

const findTxOutsForAmount = (amount: number, myUnspentTxOuts: UnspentTxOut[]) => {
  let currentAmount = 0
  const includedUnspentTxOuts = []
  for (const myUnspentTxOut of myUnspentTxOuts) {
    includedUnspentTxOuts.push(myUnspentTxOut)
    currentAmount += myUnspentTxOut.amount
    if (currentAmount >= amount) {
      const leftOverAmount = currentAmount - amount
      return {includedUnspentTxOuts, leftOverAmount}
    }
  }

  throw new Error('not enough coins to send trasaction')
}

const toUnsignedTxIn = (unspentTxOut: UnspentTxOut) => {
  const txIn: TxIn = new TxIn()
  txIn.txOutId = unspentTxOut.id
  txIn.txOutIndex = unspentTxOut.index
  return txIn
}

const createTxOuts = (receiverAddress: string, sendorAddress: string, amount: number, leftOverAmount: number) => {
  const receiverTxOut: TxOut = new TxOut(receiverAddress, amount)

  if (leftOverAmount === 0) {
    return [receiverTxOut]
  } else {
    const sendorTxOut: TxOut = new TxOut(sendorAddress, leftOverAmount)
    return [receiverTxOut, sendorTxOut]
  }
}

const createTransation = (receiverAddress: string, amount: number, privateKey: string,
  unspentTxOuts: UnspentTxOut[], txPool: Transaction[]): Transaction => {
  const myAddress: string = getPublicFromWallet()
  const myUnspentTxOuts: UnspentTxOut[] = unspentTxOuts.filter(uTxO => uTxO.address === myAddress)
  const {includedUnspentTxOuts, leftOverAmount} = findTxOutsForAmount(amount, myUnspentTxOuts)
  const unsignedTxIns: TxIn[] = includedUnspentTxOuts.map(toUnsignedTxIn)

  const tx = new Transaction()
  tx.txIns = unsignedTxIns
  tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount)
  tx.id = getTransactionId(tx)

  tx.txIns = tx.txIns.map((txIn, index: number) => {
    txIn.signature = signTxIn(tx, index, privateKey, unspentTxOuts)
    return txIn
  })

  return tx
}

export {
  getPublicFromWallet,
  getBalance,
  createTransation
}
