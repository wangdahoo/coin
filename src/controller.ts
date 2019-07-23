import express from 'express'
import bodyParser from 'body-parser'
import {Peer} from './peer'

const port = Number(process.env.WEB_PORT) || 5000

const createController = (peer: Peer) => {
  const app = express()

  app.use(bodyParser.json())

  app.use((req, res: any, next) => {
    res.succeed = (payload: any = {}): express.Response => res.json({
      code: 0,
      message: 'ok',
      payload
    })

    res.fail = (message: string): express.Response => res.json({
      code: -1,
      message
    })

    next()
  })

  app.get(['/', '/all'], (req, res: any) => res.succeed({
    blocks: peer.getAll()
  }))

  app.get('/latest', (req, res: any) => res.succeed(peer.getLatest()))

  app.post('/mine', (req, res: any) => {
    const { data } = req.body
    if (data == null || data == '') return res.fail('data cannot be empty')
    res.succeed(peer.mine(data))
  })

  app.post('/peer', (req, res: any) => {
    const { endpoint } = req.body
    if (!/^ws:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{4}$/.test(endpoint)) return res.fail('illegal endpoint')

    peer.connect(endpoint)
    res.succeed()
  })

  app.get('/peers', (req, res: any) => {
    res.succeed({
      peers: peer.getPeers()
    })
  })

  app.listen(port, () => console.log(`Listen on: ${port}`))
}

export {
  createController
}
