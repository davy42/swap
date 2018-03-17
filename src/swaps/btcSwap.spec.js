import test from 'ava'
import crypto from 'swap-crypto'
import { Bitcoin } from 'instances/bitcoin'
import btcSwap from 'swaps/btcSwap'


const secret      = 'c0809ce9f484fdcdfb2d5aabd609768ce0374ee97a1a5618ce4cd3f16c00a078'
const secretHash  = 'c0933f9be51a284acb6b1a6617a48d795bdeaa80'
const lockTime    = 1521171580

const btcOwner = {
  privateKey: 'cRkKzpir8GneA48iQVjSpUGT5mopFRTGDES7Kb43JduzrbhuVncn',
  publicKey: '02b65eed68f383178ee4bf301d1a2d231194eba2a65969187d49a6cdd945ea4f9d',
}
const ethOwner = {
  privateKey: 'cT5n9yx1xw3TcbvpEAuXvzhrTb5du4RAYbAbTqHfZ9nbq6gJQMGn',
  publicKey: '02dfae561eb061072da126f1aed7d47202a36b762e89e913c400cdb682360d9620',
}

const btcOwnerBitcoin = new Bitcoin()
const ethOwnerBitcoin = new Bitcoin()

const btcOwnerData = btcOwnerBitcoin.login(btcOwner.privateKey)
const ethOwnerData = ethOwnerBitcoin.login(ethOwner.privateKey)


// test('check secretHash generated by ripemd160', (t) => {
//   const result = crypto.ripemd160(secret)
//   const expected = secretHash
//
//   t.is(result, expected)
// })
//
// test('create script', (t) => {
//   const result = btcSwap.createScript({
//     secretHash,
//     btcOwnerPublicKey: btcOwner.publicKey,
//     ethOwnerPublicKey: ethOwner.publicKey,
//     lockTime,
//   })
//
//   const expected = {
//     address: '2N6BUwZVN7dwiVFhKK5AyHy152bAptg8jz7',
//     lockTime: 1521171580,
//   }
//
//   t.is(result.address, expected.address)
//   t.is(result.lockTime, expected.lockTime)
// })

test('create + fund + withdraw', async (t) => {
  const { script, lockTime } = btcSwap.createScript({
    secretHash,
    btcOwnerPublicKey: btcOwner.publicKey,
    ethOwnerPublicKey: ethOwner.publicKey,
  })

  log('\nCreate complete')
  log({ script, lockTime })

  const fundResult = await btcSwap.fundScript({ btcData: btcOwnerData, script, lockTime, amount: 0.01 })

  log('\nFund complete')
  log(fundResult)

  const withdrawResult = await btcSwap.withdraw({ btcData: ethOwnerData, script, secret })

  log('\nWithdraw complete')
  log(withdrawResult)
})
