/**
 * XState Machine Examples
 */

/**
 * Order Processing Machine
 * States: pending, processing, shipped, delivered, cancelled, refunded
 */
const orderMachine = {
  id: 'order',
  initial: 'pending',
  states: {
    pending: {
      on: {
        SUBMIT: 'processing',
        CANCEL: 'cancelled'
      }
    },
    processing: {
      on: {
        SHIP: 'shipped',
        FAIL: 'failed',
        CANCEL: 'cancelled'
      }
    },
    shipped: {
      on: {
        DELIVER: 'delivered',
        LOST: 'lost'
      }
    },
    delivered: {
      on: {
        RETURN: 'returned',
        REVIEW: 'reviewed'
      },
      type: 'final'
    },
    cancelled: {
      on: {
        RESTORE: 'pending'
      }
    },
    failed: {
      on: {
        RETRY: 'processing',
        ABANDON: 'cancelled'
      }
    },
    lost: {
      on: {
        REFUND: 'refunded',
        REPLACE: 'pending'
      }
    },
    returned: {
      on: {
        REFUND: 'refunded',
        EXCHANGE: 'pending'
      }
    },
    reviewed: {
      type: 'final'
    },
    refunded: {
      type: 'final'
    }
  }
};

/**
 * Authentication Flow Machine
 * States: loggedOut, authenticating, loggedIn, mfaRequired, locked, error
 */
const authMachine = {
  id: 'auth',
  initial: 'loggedOut',
  states: {
    loggedOut: {
      on: {
        LOGIN: 'authenticating'
      }
    },
    authenticating: {
      on: {
        SUCCESS: 'loggedIn',
        MFA_REQUIRED: 'mfaRequired',
        FAILURE: 'error'
      }
    },
    mfaRequired: {
      on: {
        MFA_SUCCESS: 'loggedIn',
        MFA_FAILURE: 'error',
        TIMEOUT: 'loggedOut'
      }
    },
    loggedIn: {
      on: {
        LOGOUT: 'loggedOut',
        SESSION_EXPIRED: 'loggedOut',
        LOCK_ACCOUNT: 'locked'
      }
    },
    locked: {
      on: {
        UNLOCK: 'loggedOut',
        RESET: 'authenticating'
      }
    },
    error: {
      on: {
        RETRY: 'authenticating',
        RESET: 'loggedOut'
      }
    }
  }
};

/**
 * Payment Machine
 * States: idle, validating, processing, success, failed
 */
const paymentMachine = {
  id: 'payment',
  initial: 'idle',
  states: {
    idle: {
      on: {
        SUBMIT: 'validating'
      }
    },
    validating: {
      on: {
        VALID: 'processing',
        INVALID: 'validationFailed'
      }
    },
    validationFailed: {
      on: {
        CORRECT: 'validating'
      }
    },
    processing: {
      on: {
        APPROVED: 'success',
        DECLINED: 'failed',
        ERROR: 'error'
      }
    },
    success: {
      type: 'final'
    },
    failed: {
      on: {
        RETRY: 'idle',
        CANCEL: 'cancelled'
      }
    },
    error: {
      on: {
        RETRY: 'processing'
      }
    },
    cancelled: {
      type: 'final'
    }
  }
};

// Export
module.exports = {
  orderMachine,
  authMachine,
  paymentMachine
};

// XState createMachine call pattern (for AST detection)
function createMachineExample() {
  const example = createMachine({
    id: 'example',
    initial: 'start',
    states: {
      start: {
        on: { NEXT: 'end' }
      },
      end: {
        type: 'final'
      }
    }
  });

  return example;
}

// Older XState Machine() call pattern
function MachineExample() {
  const machine = Machine({
    id: 'legacy',
    initial: 'idle',
    states: {
      idle: { on: { START: 'running' } },
      running: { on: { STOP: 'idle' } },
      stopped: { type: 'final' }
    }
  });

  return machine;
}
