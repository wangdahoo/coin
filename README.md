# coin

> cryptocurrency study.


## Startup

- install dependencies

```bash
yarn
```

- start a peer

```bash
yarn dev
```

- start another peer

```bash
WEB_PORT=5001 PEER_PORT=8001 yarn dev
```

- connect to peer

```bash
curl -H "Content-type:application/json" --data '{"endpoint" : "ws://127.0.0.1:8001"}' http://localhost:5000/peer
```

- mine a block

```bash
curl -H "Content-type:application/json" --data '{"data" : "Not Enough Minerals"}' http://localhost:5000/mine
```
