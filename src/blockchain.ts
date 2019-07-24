import crypto from 'crypto'
import { hexToBinary } from './util'

// seconds
const BLOCK_GENERATION_INTERVAL: number = 10

// blocks
const DIFFICULTY_ADJUSTMENT_INTERVAL: number = 10

class Block {
  public index: number
  public hash: string
  public prevHash: string
  public timestamp: number
  public data: string
  public difficulty: number
  public nonce: number

  constructor(index: number, hash: string, prevHash: string,
    timestamp: number, data: string, difficulty: number, nonce: number) {
    this.index = index
    this.hash = hash
    this.prevHash = prevHash
    this.timestamp = timestamp
    this.data = data
    this.difficulty = difficulty
    this.nonce = nonce
  }
}

const genesisBlock: Block = new Block(
  0, '94d9a6070318a3e7d0fa3ab7723a27af189d835876b8d5138d777cefbbbf3d4d', '', 1563851243, 'the genesis block', 0, 0
)

let blockchain: Block[] = [genesisBlock]
const getBlockchain = (): Block[] => blockchain
const setBlockchain = (chain: Block[]) => {
  blockchain = chain
}

const getLatestBlock = (): Block => blockchain[blockchain.length - 1]

const matchDifficulty = (hash: string, difficulty: number): boolean => {
  if (difficulty > 0) {
    return hexToBinary(hash).startsWith('0'.repeat(difficulty))
  }

  return true
}

const findBlock = (index: number, prevHash: string, timestamp: number, data: string, difficulty: number): Block => {
  let nonce = 0

  while (true) {
    const hash: string = calculateHash(index, prevHash, timestamp, data, difficulty, nonce)

    if (matchDifficulty(hash, difficulty)) {
      return new Block(index, hash, prevHash, timestamp, data, difficulty, nonce)
    }

    nonce++
  }
}

const getDifficulty = (): number => {
  const latestBlock: Block = getLatestBlock()
  const difficulty = latestBlock.difficulty

  if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
    const blockchain = getBlockchain()
    const startTime = blockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL].timestamp
    const endTime = latestBlock.timestamp
    const timeSpec = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL

    if (endTime - startTime < timeSpec / 2) {
      return difficulty + 1
    } else if (endTime - startTime > timeSpec * 2) {
      return difficulty - 1
    } else {
      return difficulty
    }
  }

  return difficulty
}

const generateNextBlock = (data: string) => {
  const prevBlock = getLatestBlock()
  const index: number = prevBlock.index + 1
  const timestamp: number = Math.floor(Date.now() / 1000)
  const newBlock: Block = findBlock(index, prevBlock.hash, timestamp, data, getDifficulty())
  addBlock(newBlock)
  return newBlock
}

const calculateHash = (index: number, prevHash: string, timestamp: number, data: string, difficulty: number, nonce: number) => {
  const content = `${index}${prevHash}${timestamp}${data}${difficulty}${nonce}`
  const hash = crypto.createHmac('sha256', '')
    .update(content)
    .digest('hex')
  return hash
}

const isValidHash = (block: Block): boolean => {
  const { index, prevHash, timestamp, data, difficulty, nonce} = block
  return calculateHash(index, prevHash, timestamp, data, difficulty, nonce) === block.hash
}

const isValidBlock = (block: Block, prevBlock: Block): boolean => {
  return prevBlock.index + 1 === block.index &&
    prevBlock.hash === block.prevHash &&
    isValidHash(block)
}

const addBlock = (newBlock: Block) => {
  const prevBlcok = getLatestBlock()
  if (isValidBlock(newBlock, prevBlcok)) {
    blockchain.push(newBlock)
    return true
  }

  return false
}

const isValidChain = (chain: Block[]): boolean => {
  if (JSON.stringify(chain[0]) === JSON.stringify(genesisBlock)) {
    return false
  }

  for (let i = 1; i < chain.length; i++) {
    if (!isValidBlock(chain[i], chain[i - 1])) {
      return false
    }
  }

  return true
}

const replaceChain = (chain: Block[]) => {
  if (isValidChain(chain) && chain.length > getBlockchain().length) {
    setBlockchain(blockchain)
  }
}

const mineBlock = (data: string) => generateNextBlock(data)

export {
  Block,
  getLatestBlock,
  getBlockchain,
  addBlock,
  replaceChain,
  generateNextBlock,
  mineBlock
}
