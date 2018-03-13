import alight from 'alight'
import { EA } from 'instances'
import {orders} from "../instances";


const app = {
  scope: {},
}

alight.controllers.app = function (scope) {
  console.log('App controller!')

  scope.data = {
    initialized: false,
    activeRoute: {},
  }


  const loggedWith = {
    eth: false,
    btc: false,
  }

  function checkIfInitialized() {
    if (loggedWith.eth && loggedWith.btc) {
      // put call to the end of call stack
      setTimeout(() => {
        console.log('App initialized!')

        scope.data.initialized = true
        scope.$scan()

        EA.dispatchEvent('app:ready')
      }, 0)
    }
  }

  EA.once('eth:login', () => {
    loggedWith.eth = true

    checkIfInitialized()
  })

  EA.once('btc:login', () => {
    loggedWith.btc = true

    checkIfInitialized()
  })

  EA.once('route:change', (params) => {
    scope.data.activeRoute = params
    scope.$scan()
  })

  

  app.scope = scope
}


export default app
