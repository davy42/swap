import test from 'ava'
import ethereum, { Ethereum } from 'instances/ethereum'
import ethSwap, { EthSwap } from 'swaps/ethSwap'
import reputation, { Reputation } from 'swaps/reputation'


const ratingAddress   = '0xa8f36d62425a085dc3d19448751db49ba2f68afb'
const ratingABI       = [ { "constant": false, "inputs": [ { "name": "_userAddress", "type": "address" }, { "name": "_delta", "type": "int256" } ], "name": "change", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "name": "_ownerAddress", "type": "address" } ], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "constant": true, "inputs": [ { "name": "_userAddress", "type": "address" } ], "name": "get", "outputs": [ { "name": "", "type": "int256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "getMy", "outputs": [ { "name": "", "type": "int256" } ], "payable": false, "stateMutability": "view", "type": "function" } ]

const ratingContract  = ethereum.getContract(ratingABI, ratingAddress)

const swapsAddress    = '0x94028d45550a959198480df89efc1ea60ef394c5'
const swapsABI        = [ { "constant": false, "inputs": [ { "name": "_user", "type": "address" } ], "name": "changeRating", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_participantAddress", "type": "address" } ], "name": "close", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_secretHash", "type": "bytes20" }, { "name": "_participantAddress", "type": "address" }, { "name": "_lockTime", "type": "uint256" } ], "name": "create", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_participantAddress", "type": "address" } ], "name": "refund", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "_ratingContractAddress", "type": "address" } ], "name": "setRatingAddress", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [ { "name": "participantAddress", "type": "address" } ], "name": "sign", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "constant": false, "inputs": [ { "name": "_secret", "type": "bytes32" }, { "name": "_ownerAddress", "type": "address" } ], "name": "withdraw", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [ { "name": "_participantAddress", "type": "address" } ], "name": "checkIfSigned", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "_ownerAddress", "type": "address" } ], "name": "getBalance", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "_participantAddress", "type": "address" } ], "name": "getSecret", "outputs": [ { "name": "", "type": "bytes32" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "_ownerAddress", "type": "address" } ], "name": "getSecretHash", "outputs": [ { "name": "", "type": "bytes20" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "_ownerAddress", "type": "address" }, { "name": "_participantAddress", "type": "address" } ], "name": "unsafeGetSecret", "outputs": [ { "name": "", "type": "bytes32" } ], "payable": false, "stateMutability": "view", "type": "function" } ]

// const ethSwap         = new EthSwap(swapsAddress, swapsABI)


const secret      = 'c0809ce9f484fdcdfb2d5aabd609768ce0374ee97a1a5618ce4cd3f16c00a078'
const secretHash  = 'c0933f9be51a284acb6b1a6617a48d795bdeaa80'
const lockTime    = 1841171580000

const ethOwnerPrivateKey = '0xabc5e7f8e9936c6ee35ff083f9a4e419ee07010105d4d18904690189bba91bf2'
const btcOwnerPrivateKey = '0xefb8db8d46d7bcc7f20fbd66f9175cbd9c11c31bf6db384de162ded2564ca432'

// const btcOwnerBitcoin = new Ethereum()
// const ethOwnerBitcoin = new Ethereum()

const ethOwnerData = ethereum.login(ethOwnerPrivateKey)
const btcOwnerData = ethereum.login(btcOwnerPrivateKey)


test('sign + create + withdraw + getSecret', async (t) => {
  const [ ethOwnerReputation, btcOwnerReputation ] = await Promise.all([
    reputation.get(ethOwnerData.address),
    reputation.get(btcOwnerData.address),
    // BTC Owner signs
    // 0x52b0ed6638D4Edf4e074D266E3D5fc05A5650DfF
    ethSwap.sign({
      myAddress: btcOwnerData.address,
      participantAddress: ethOwnerData.address,
    }),
    // ETH Owner signs
    // 0xf610609b0592c292d04C59d44244bb6CB41C59bd
    ethSwap.sign({
      myAddress: ethOwnerData.address,
      participantAddress: btcOwnerData.address,
    }),
  ])

  console.log('initial reputation', ethOwnerReputation, btcOwnerReputation)

  // ETH Owner creates a swap
  // 0xc0933f9be51a284acb6b1a6617a48d795bdeaa80, "0xf610609b0592c292d04C59d44244bb6CB41C59bd", 1841171580000
  await ethSwap.create({
    myAddress: ethOwnerData.address,
    participantAddress: btcOwnerData.address,
    secretHash,
    amount: 0.02,
    // _lockTime: lockTime,
  })

  // BTC Owner withdraw
  // 0xc0809ce9f484fdcdfb2d5aabd609768ce0374ee97a1a5618ce4cd3f16c00a078, "0x52b0ed6638D4Edf4e074D266E3D5fc05A5650DfF"
  await ethSwap.withdraw({
    myAddress: btcOwnerData.address,
    ownerAddress: ethOwnerData.address,
    secret,
  })

  // ETH Owner receive the secret
  // 0xf610609b0592c292d04C59d44244bb6CB41C59bd
  const secretKey = await ethSwap.getSecret({
    myAddress: ethOwnerData.address,
    participantAddress: btcOwnerData.address,
  })

  // ETH Owner close Swap to receive reputation
  // 0xf610609b0592c292d04C59d44244bb6CB41C59bd
  await ethSwap.close({
    myAddress: ethOwnerData.address,
    participantAddress: btcOwnerData.address,
  })

  const [ ethOwnerNewReputation, btcOwnerNewReputation ] = await Promise.all([
    reputation.get(ethOwnerData.address),
    reputation.get(btcOwnerData.address),
  ])

  console.log('new reputation', ethOwnerNewReputation, btcOwnerNewReputation)

  const ethOwnerReputationDiff = ethOwnerNewReputation - ethOwnerReputation
  const btcOwnerReputationDiff = btcOwnerNewReputation - btcOwnerReputation

  t.is(ethOwnerReputationDiff, 1)
  t.is(btcOwnerReputationDiff, 1)
  t.is(secretKey, `0x${secret}`)
})
