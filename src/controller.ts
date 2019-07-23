import express from 'express'
import bodyParser from 'body-parser'
import {Peer} from './peer'

const port = Number(process.env.WEB_PORT) || 5000

const succeed = (res: express.Response, payload: any): express.Response => res.json({
  code: 0,
  message: 'ok',
  payload
})

const fail = (res: express.Response, message: string): express.Response => res.json({
  code: -1,
  message
})

const createController = (peer: Peer) => {
  const app = express()

  app.use(bodyParser.json())

  app.get('/blocks', (req, res) => succeed(res, {
    blocks: peer.getAll()
  }))

  app.listen(port, () => console.log(`Listen on: ${port}`))
}

export {
  createController
}
