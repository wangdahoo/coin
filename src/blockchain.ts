import crypto from 'crypto'

class Block {
  public index: number
  public hash: string
  public prevHash: string
  public timestamp: number
  public data: string

  constructor(index: number, hash: string, prevHash: string, timestamp: number, data: string) {
    this.index = index
    this.hash = hash
    this.prevHash = prevHash
    this.timestamp = timestamp
    this.data = data
  }
}

const genesisBlock: Block = new Block(
  0, '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', '', 1563851243, 'the genesis block'
)

let blockchain: Block[] = [genesisBlock]
const getBlockchain = (): Block[] => blockchain
const setBlockchain = (chain: Block[]) => {
  blockchain = chain
}

const getLatestBlock = (): Block => blockchain[blockchain.length - 1]

const generateNextBlock = (data: string) => {
  const prevBlock = getLatestBlock()
  const index: number = prevBlock.index + 1
  const timestamp: number = Date.now() / 1000
  const hash: string = calculateHash(index, prevBlock.hash, timestamp, data)
  const newBlock: Block = new Block(index, hash, prevBlock.hash, timestamp, data)
  addBlock(newBlock)
  return newBlock
}

const calculateHash = (index: number, prevHash: string, timestamp: number, data: string) => {
  const content = `${index}${prevHash}${timestamp}${data}`
  const hash = crypto.createHmac('sha256', '')
    .update(content)
    .digest('hex')
  return hash
}

const isValidHash = (block: Block): boolean => {
  const { index, prevHash, timestamp, data } = block
  return calculateHash(index, prevHash, timestamp, data) === block.hash
}

const isValidBlock = (block: Block, prevBlock: Block): boolean => {
  return prevBlock.index + 1 === block.index &&
    prevBlock.hash !== block.prevHash &&
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

const mineBlock = (data: string) => addBlock(generateNextBlock(data))

export {
  Block,
  getLatestBlock,
  getBlockchain,
  addBlock,
  replaceChain,
  generateNextBlock,
  mineBlock
}
