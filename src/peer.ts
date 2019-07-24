import WebSocket from 'ws'
import {Server} from 'ws'
import {Block, getLatestBlock, getBlockchain, addBlock, replaceChain, mineBlock} from './blockchain'

const sockets: WebSocket[] = []

const port: number = Number(process.env.PEER_PORT) || 8000
const getEndpoint = () => `ws://${process.env.PEER_ADDRESS || '127.0.0.1'}:${port}`

enum MessageType {
  QUERY_LATEST = 1,
  QUERY_ALL = 2,
  RESPONSE_LATEST = 3,
  RESPONSE_ALL = 4,

  QUERY_IDENTITY = 5,
  RESPONSE_IDENTITY = 6
}

class Message {
  public type: MessageType
  public data: any

  constructor (type: MessageType, data: any) {
    this.type = type
    this.data = data
  }
}

const broadcast = (message: Message) => sockets.forEach(ws => ws.send(JSON.stringify(message)))
const broadcastNewBlock = (newBlock: Block) => broadcast(new Message(MessageType.RESPONSE_LATEST, [newBlock]))
const broadcastQueryAll = () => broadcast(new Message(MessageType.QUERY_ALL, null))

const onMessage = (ws: WebSocket) => {
  const parse = <T>(data: string): T => {
    try {
        return JSON.parse(data)
    } catch (e) {
        console.log(e)
        return null
    }
  }

  ws.on('message', (data: string) => {
    const message: Message = parse<Message>(data)
    if (message === null) {
      console.log('got nonsense ~')
      return
    }

    console.log(`receive message: ${JSON.stringify(message)}`)

    let feedback: Message = null

    switch (message.type) {
      case MessageType.QUERY_LATEST:
        feedback = new Message(MessageType.RESPONSE_LATEST, [getLatestBlock()])
        break
      case MessageType.QUERY_ALL:
        feedback = new Message(MessageType.RESPONSE_ALL, getBlockchain())
        break
      case MessageType.RESPONSE_LATEST:
        handleReceivedBlocks(message.data)
        break
      case MessageType.RESPONSE_ALL:
        handleReceivedBlocks(message.data)
        break
      case MessageType.QUERY_IDENTITY:
        feedback = new Message(MessageType.RESPONSE_IDENTITY, getEndpoint())
        break
      case MessageType.RESPONSE_IDENTITY:
        if (ws.url === undefined) {
          ws.url = message.data
        }
        break
      default:
        console.log('Illegal Message Type')
    }

    if (feedback != null) {
      ws.send(JSON.stringify(feedback))
    }
  })
}

const handleReceivedBlocks = (receivedBlocks: Block[]) => {
  if (receivedBlocks === null || receivedBlocks.length === 0) return

  const receivedLatestBlock: Block = receivedBlocks[receivedBlocks.length - 1]
  const latestBlock: Block = getLatestBlock()

  if (receivedLatestBlock.index > latestBlock.index) {
    console.log(`blockchain possibly behind. we got ${latestBlock.index} and peer got ${receivedLatestBlock.index}`)

    if (receivedBlocks.length === 1) {
      if (receivedLatestBlock.prevHash === latestBlock.hash) {
        if (addBlock(receivedLatestBlock)) {
          broadcastNewBlock(getLatestBlock())
        }
      } else {
        broadcastQueryAll()
      }
    } else {
      replaceChain(receivedBlocks)
    }
  } else {
    console.log('blockchain up to date.')
  }
}

const onError = (ws: WebSocket) => {
  const close = (conn: WebSocket) => {
      console.log(`connection to ${conn.url} closed.`)
      sockets.splice(sockets.indexOf(ws), 1)
  }

  ws.on('close', () => close(ws))

  ws.on('error', err => {
    if (err) console.error(err)
    close(ws)
  })
}

const onConnection = (ws: WebSocket) => {
  sockets.push(ws)
  onMessage(ws)
  onError(ws)

  if (ws.url === undefined) {
    ws.send(JSON.stringify(new Message(MessageType.QUERY_IDENTITY, null)))
  }
}

const createP2PServer = () => {
  const server = new Server({
    port,
  })

  server.on('connection', onConnection)

  return server
}

class Peer {
  private server: Server

  constructor () {
    this.server = createP2PServer()
  }

  getServer () {
    return this.server
  }

  connect (endpoint: string) {
    if (sockets.findIndex(ws => ws.url === endpoint) > -1) return

    const ws = new WebSocket(endpoint)
    ws.on('open', () => {
      onConnection(ws)



      // TODO:
    })
    ws.on('error', () => console.error(`connect to peer ${endpoint} failed.`))
  }

  getAll () {
    return getBlockchain()
  }

  getLatest () {
    return getLatestBlock()
  }

  mine (data: string) {
    const newBlock: Block = mineBlock(data)
    broadcastNewBlock(newBlock)
    return newBlock
  }

  getPeers () {
    return sockets.map(ws => ws.url)
  }
}

export {
  Peer
}
