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
    res.succeed(peer.mine(data))
  })

  app.listen(port, () => console.log(`Listen on: ${port}`))
}

export {
  createController
}
