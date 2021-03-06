import BigInteger from 'bigi'
import request from 'swap-request'
import bitcoin from 'bitcoinjs-lib'
import config from 'helpers/config'
import EA from './EA'


class Bitcoin {

  constructor() {
    this.core = bitcoin
    this.testnet = bitcoin.networks.testnet

    global.bitcoin = this
  }

  getRate() {
    return new Promise((resolve) => {
      request.get('https://noxonfund.com/curs.php')
        .then(({ price_btc }) => {
          resolve(price_btc)
        })
    })
  }

  login(privateKey) {
    let keyPair

    if (privateKey) {
      const hash  = this.core.crypto.sha256(privateKey)
      const d     = BigInteger.fromBuffer(hash)

      keyPair     = new this.core.ECPair(d, null, { network: this.testnet })
    }
    else {
      keyPair     = this.core.ECPair.makeRandom({ network: this.testnet })
      privateKey  = keyPair.toWIF()
    }

    const address     = keyPair.getAddress()
    const account     = new this.core.ECPair.fromWIF(privateKey, this.testnet)
    const publicKey   = account.getPublicKeyBuffer().toString('hex')

    const data = {
      account,
      keyPair,
      address,
      privateKey,
      publicKey,
    }
    console.info('Logged in with Bitcoin', data)
    EA.dispatch('btc:login', data)

    return data
  }

  getBalance(address) {
    return request.get(`${config.api.bitpay}/addr/${address}`)
      .then(({ balance }) => {
        console.log('BTC Balance:', balance)
        EA.dispatch('btc:updateBalance', balance)

        return balance
      })
  }

  getTransaction(address) {

    return new Promise((resolve) => {

        const url = `${config.api.blocktrail}/address/${address}/transactions?api_key=${config.apiKeys.blocktrail}`
        let transactions
        request.get(url).then((res) => {
          if (res.total) {
            transactions = res.data.map((item) => ({
              status: item.block_hash != null ? 1 : 0,
              value: item.outputs[0].value / 1e8,
              address: item.outputs[0].address,
              date: item.time,
              type: address.toLocaleLowerCase() === item.outputs[0].address.toLocaleLowerCase() ? 'in' : 'out'
            }))

            EA.dispatch('btc:updateTransactions', transactions.reverse())
            resolve(transactions)
          }
          else {
            console.log(res.result)
          }
        })

    })
  }

  send(from, to, amount, keyPair) {
    return new Promise((resolve, reject) => {
      const newtx = {
        inputs: [
          {
            addresses: [from],
          },
        ],
        outputs: [
          {
            addresses: [to],
            value: amount * 100000000,
          },
        ],
      }
      console.log('withdraw 0');
      request.post('https://api.blockcypher.com/v1/btc/test3/txs/new', {
        body: JSON.stringify(newtx),
      }).then((d) => {
        console.log('withdraw 1');
          // convert response body to JSON
          let tmptx = d

          // attribute to store public keys
          tmptx.pubkeys = []


          // build signer from WIF
          let keys = new this.core.ECPair.fromWIF(keyPair.toWIF(), this.testnet)

        // iterate and sign each transaction and add it in signatures while store corresponding public key in pubkeys
          tmptx.signatures = tmptx.tosign.map((tosign, n) => {
            tmptx.pubkeys.push(keys.getPublicKeyBuffer().toString('hex'));

            return keys.sign(BigInteger.fromHex(tosign.toString('hex')).toBuffer()).toDER().toString('hex')
          })

          return request.post('https://api.blockcypher.com/v1/btc/test3/txs/send', {
            body: JSON.stringify(tmptx),
          })
        })
        .then((res) => resolve(res)).catch((e) => console.log(e))
    })
  }

  fetchUnspents(address) {
    return request.get(`${config.api.bitpay}/addr/${address}/utxo`)
  }

  broadcastTx(txRaw) {
    return request.post(`${config.api.bitpay}/tx/send`, {
      body: {
        rawtx: txRaw,
      },
    })
  }
}


export default new Bitcoin()

export {
  Bitcoin,
}
