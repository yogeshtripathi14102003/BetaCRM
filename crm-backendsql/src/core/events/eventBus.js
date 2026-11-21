const { EventEmitter } = require('events');
const logger = require('../logger');

// Listener fail ho to request/doosre listeners par asar nahi padta
class SafeEventBus extends EventEmitter {
  on(event, handler) {
    return super.on(event, (...args) => {
      Promise.resolve()
        .then(() => handler(...args))
        .catch((err) => logger.error({ err, event }, 'event handler failed'));
    });
  }
}

module.exports = new SafeEventBus();
