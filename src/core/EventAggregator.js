class Event {

  /**
   *
   * @param name {string}
   */
  constructor(name) {
    this.name = name
    this.handlers = []
  }

  /**
   * Add handler to current Event
   *
   * @param handler {function}
   */
  addHandler(handler) {
    this.handlers.push(handler.bind({
      unsubscribe: () => {
        this.removeHandler(handler)
      },
    }))
  }

  /**
   * Remove handler from current Event
   *
   * @param handler {function}
   * @returns {Array.<T>|*}
   */
  removeHandler(handler) {
    const handlerIndex = this.handlers.indexOf(handler)

    this.handlers.splice(handlerIndex, 1);
  }

  /**
   * Call all handlers in all priorities of current Event
   *
   * @param eventArgs {...array}
   */
  call(...eventArgs) {
    this.handlers.forEach((handler) => handler(...eventArgs))
  }
}

class EventAggregator {

  constructor() {
    this.events = {}
  }

  /**
   * Get Event by name
   *
   * @param name
   * @returns {*}
   */
  getEvent(name) {
    let event = this.events[name]

    if (!event) {
      event = new Event(name)
      this.events[name] = event
    }

    return event
  }

  /**
   *
   * @param name {string}
   * @param handler {function}
   * @returns {{ event: *, handler: * }}
   */
  subscribe(name, handler) {
    const event = this.getEvent(name)

    event.addHandler(handler)

    return { event, handler }
  }

  /**
   *
   * @param eventName {string}
   * @param handler {function}
   */
  unsubscribe(eventName, handler) {
    const event = this.getEvent(eventName)

    event.removeHandler(handler)
  }

  /**
   *
   * @param name {string}
   * @param eventArgs {...array}
   */
  dispatch(name, ...eventArgs) {
    const event = this.getEvent(name)

    if (event) {
      event.call(...eventArgs)
    }
  }
}


export default EventAggregator
