import { orderStatuses, localStorage } from 'helpers'
import EA from './EA'
import room from './room'
import orders from './orders'


class MyOrders {

  constructor() {

    this.onMount()
  }

  onMount() {
    let myOrders = localStorage.getItem('myOrders') || []

    // TODO remove this filter
    myOrders = myOrders.filter(({ currency1 }) => currency1 === undefined)
    localStorage.setItem('myOrders', myOrders)

    myOrders.forEach((order) => {
      orders.append(order)
      
      // TODO create swaps
      
    })

    EA.dispatch('myOrders:onMount')

    room.subscribe('newPeer', ({ peer }) => {
      const myOrders = orders.getOwnedByMe()

      console.log(`Send my orders to ${peer}`, myOrders)

      if (myOrders.length) {
        room.sendMessage(peer, myOrders.map((order) => ({
          event: 'newOrder',
          data: order,
        })))
      }
    })
  }

  append(data, cb) {
    let removedOrder

    // TODO ductape to store only 1 order from any user
    orders.getOwnedByMe().forEach((order) => {
      removedOrder = JSON.parse(JSON.stringify(order))

      this.remove(order.id)
    })

    orders.append(data)
    this.saveToLocalStorage()
    cb(removedOrder)
  }

  remove(id, cb) {
    if (orders.checkIfOwnedByMe(id)) {
      orders.removeByKey(id)
      this.saveToLocalStorage()
      cb && cb()
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('myOrders', orders.getOwnedByMe())
  }

  getProcessingOrders() {
    const myOrders = orders.getOwnedByMe()

    return myOrders.length ? myOrders.filter(({ status }) => status === orderStatuses.processing) : []
  }
}


export default new MyOrders()
