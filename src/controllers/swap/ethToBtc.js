import alight from 'alight'
import { localStorage } from 'helpers'
import { EA, room, ethereum } from 'instances'
import { ethSwap, btcSwap } from 'swaps'


const ethToBtc = {
  scope: {},
}

alight.controllers.ethToBtc = (scope) => {
  console.log('ETH to BTC controller!')

  const order = scope.$parent.data.order
  const swapData = localStorage.getItem(`swap:${order.id}`) || {}

  window.swapData = swapData

  scope.data = {
    order,
    step: 0,

    // step 1
    secretHash: null,
    btcScriptData: null,

    // step 2
    address: ethereum.data.address,
    balance: ethereum.data.balance,
    notEnoughMoney: false,
    checkingBalance: false,

    // step 3
    ethReceipt: null,
    ethSwapCreationTransactionUrl: null,

    // step 4
  }

  function checkBalance() {
    console.log('Checking if there is enough money on balance')

    scope.data.notEnoughMoney = ethereum.data.balance < order.currency2Amount
    scope.$scan()

    if (scope.data.notEnoughMoney) {
      console.log('Not enough money')
    }
    else {
      console.log('There is enough money for swap')
    }

    return !scope.data.notEnoughMoney
  }

  scope.updateBalance = async () => {
    scope.data.checkingBalance = true
    scope.$scan()

    const balance = await ethereum.getBalance()

    scope.data.balance = balance
    scope.$scan()

    const isEnough = checkBalance()

    if (isEnough) {
      scope.goNextStep()
    }
  }

  scope.goNextStep = async () => {
    scope.data.step++;
    scope.$scan()

    console.log('\n-------------------------------------------\n\n')
    console.log(`\nSTEP ${scope.data.step}\n\n`)

    if (scope.data.step === 1) {
      console.log('Waiting until owner creates secretHash and BTC Swap script')

      EA.subscribe('room:swap:btcScriptCreated', async function ({ orderId, secretHash, btcScriptData }) {
        if (order.id === orderId) {
          console.log('Owner created secretHash', secretHash)
          console.log('Owner created btcScript', btcScriptData)

          this.unsubscribe()

          // localStorage.updateItem(`swap:${order.id}`, {
          //   secretHash,
          // })

          scope.data.secretHash = secretHash
          scope.data.btcScriptData = btcScriptData
          scope.$scan()
        }
      })
    }
    else if (scope.data.step === 2) {
      const isEnough = checkBalance()

      if (isEnough) {
        scope.goNextStep()
      }
    }
    else if (scope.data.step === 3) {
      const receipt = await ethSwap.create({
        secretHash: scope.data.secretHash,
      }, (transactionUrl) => {
        scope.data.ethSwapCreationTransactionUrl = transactionUrl
        scope.$scan()
      })

      scope.ethReceipt = receipt
      scope.$scan()

      room.sendMessageToPeer(swapData.participant.peer, [
        {
          event: 'swap:ethSwapCreated',
          data: {
            orderId: order.id,
          },
        },
      ])

      scope.goNextStep()
    }
    else if (scope.data.step === 4) {
      EA.subscribe('room:swap:ethWithdrawDone', function ({ orderId }) {
        if (order.id === orderId) {
          this.unsubscribe()

          scope.goNextStep()
        }
      })
    }
    else if (scope.data.step === 5) {
      ethSwap.getSecret()
        .then((secret) => {
          const scriptData = btcSwap.createScript({
            btcOwnerSecretHash: scope.data.btcScriptData.secretHash,
            btcOwnerPublicKey: scope.data.btcScriptData.btcOwnerPublicKey,
            ethOwnerPublicKey: scope.data.btcScriptData.ethOwnerPublicKey,
            lockTime: scope.data.btcScriptData.lockTime,
          })

          btcSwap.withdraw({
            script: scriptData.script,
            secret,
            lockTime: scope.data.btcScriptData.lockTime,
          })
        })
    }
    else if (scope.data.step === 6) {

    }
  }

  scope.goNextStep()

  ethToBtc.scope = scope
}


export default ethToBtc
