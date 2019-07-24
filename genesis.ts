import crypto from 'crypto'

const calculateHash = (index: number, prevHash: string, timestamp: number, data: string) => {
  const content = `${index}${''}${timestamp}${data}`
  const hash = crypto.createHmac('sha256', '')
    .update(content)
    .digest('hex')
  return hash
}

console.log(calculateHash(0, '', 1563851243, 'the genesis block'))
// 94d9a6070318a3e7d0fa3ab7723a27af189d835876b8d5138d777cefbbbf3d4d
