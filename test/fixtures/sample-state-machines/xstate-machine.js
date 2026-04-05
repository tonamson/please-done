/**
 * XState machine fixture - Order workflow state machine
 * Demonstrates XState createMachine pattern with states and transitions
 */

const { createMachine } = require('xstate');

/**
 * Order workflow state machine
 * States: pending -> processing -> (shipped | cancelled) -> delivered
 */
const orderMachine = createMachine({
  id: 'order',
  initial: 'pending',
  context: {
    orderId: null,
    items: [],
    shippingAddress: null,
    paymentStatus: null,
    cancellationReason: null
  },
  states: {
    pending: {
      entry: ['logEntry'],
      on: {
        VALIDATE: {
          target: 'processing',
          actions: ['setOrderId', 'setItems'],
          cond: 'hasValidItems'
        },
        CANCEL: {
          target: 'cancelled',
          actions: ['setCancellationReason'],
          cond: 'canCancel'
        }
      }
    },

    processing: {
      entry: ['logProcessing', 'processPayment'],
      on: {
        PAYMENT_SUCCESS: {
          target: 'shipped',
          actions: ['setPaymentStatus', 'setShippingAddress']
        },
        PAYMENT_FAILED: {
          target: 'cancelled',
          actions: ['setPaymentStatus', 'setCancellationReason']
        },
        SHIP: {
          target: 'shipped',
          actions: ['setShippingAddress']
        },
        CANCEL: {
          target: 'cancelled',
          actions: ['setCancellationReason'],
          cond: 'canCancelFromProcessing'
        }
      }
    },

    shipped: {
      entry: ['notifyShipment'],
      on: {
        DELIVER: {
          target: 'delivered',
          actions: ['confirmDelivery']
        },
        RETURN: {
          target: 'cancelled',
          actions: ['setCancellationReason'],
          cond: 'canReturn'
        }
      }
    },

    delivered: {
      entry: ['notifyDelivery', 'completeOrder'],
      type: 'final',
      on: {
        RETURN: {
          target: 'cancelled',
          actions: ['initiateReturn'],
          cond: 'withinReturnWindow'
        }
      }
    },

    cancelled: {
      entry: ['processRefund', 'notifyCancellation'],
      type: 'final',
      on: {
        RESTART: 'pending'
      }
    }
  }
}, {
  actions: {
    logEntry: (context, event) => {
      console.log('Order entered pending state');
    },
    logProcessing: (context, event) => {
      console.log('Order processing started');
    },
    setOrderId: (context, event) => ({
      orderId: event.orderId
    }),
    setItems: (context, event) => ({
      items: event.items
    }),
    setPaymentStatus: (context, event) => ({
      paymentStatus: event.status
    }),
    setShippingAddress: (context, event) => ({
      shippingAddress: event.address
    }),
    setCancellationReason: (context, event) => ({
      cancellationReason: event.reason
    }),
    processPayment: (context, event) => {
      // Payment processing logic
      console.log('Processing payment...');
    },
    notifyShipment: (context, event) => {
      console.log('Order shipped notification sent');
    },
    notifyDelivery: (context, event) => {
      console.log('Order delivered notification sent');
    },
    confirmDelivery: (context, event) => {
      console.log('Delivery confirmed');
    },
    completeOrder: (context, event) => {
      console.log('Order completed');
    },
    processRefund: (context, event) => {
      console.log('Processing refund...');
    },
    notifyCancellation: (context, event) => {
      console.log('Cancellation notification sent');
    },
    initiateReturn: (context, event) => {
      console.log('Return initiated');
    }
  },
  guards: {
    hasValidItems: (context, event) => {
      return event.items && event.items.length > 0;
    },
    canCancel: (context, event) => {
      // Can cancel if payment not processed yet
      return context.paymentStatus !== 'completed';
    },
    canCancelFromProcessing: (context, event) => {
      // Can cancel from processing if not yet shipped
      return context.paymentStatus !== 'completed' || event.force === true;
    },
    canReturn: (context, event) => {
      // Can return within return window
      return context.shippedAt && Date.now() - context.shippedAt < 30 * 24 * 60 * 60 * 1000;
    },
    withinReturnWindow: (context, event) => {
      // Return window for delivered orders
      return context.deliveredAt && Date.now() - context.deliveredAt < 14 * 24 * 60 * 60 * 1000;
    }
  }
});

// State machine visualization:
//
//                    +--(CANCEL [canCancel])--> cancelled
//                    |
// pending --(VALIDATE [hasValidItems])--> processing --(SHIP)--> shipped --(DELIVER)--> delivered
//       <--(RESTART)-- cancelled <--(RETURN [canReturn])--|                      |
//                    ^                                    <--(RETURN [withinReturnWindow])--
//                    |
//                    +--(PAYMENT_FAILED)--
//
// Security considerations:
// - Guards enforce valid state transitions
// - Cancellation requires conditions to be met
// - Returns have time windows enforced by guards
// - Payment status checked before sensitive transitions

module.exports = { orderMachine };
