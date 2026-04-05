/**
 * Cart Reducer - Redux state machine example
 * States: empty, has-items, checkout, payment, complete
 * Actions: ADD_ITEM, REMOVE_ITEM, CHECKOUT, PAYMENT_SUCCESS, PAYMENT_FAILED, CLEAR_CART
 */

const initialState = {
  items: [],
  status: 'empty',
  total: 0,
  error: null
};

function cartReducer(state = initialState, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        status: 'has-items',
        total: state.total + (action.payload.price * action.payload.quantity)
      };

    case 'REMOVE_ITEM':
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return {
        ...state,
        items: updatedItems,
        status: updatedItems.length === 0 ? 'empty' : 'has-items',
        total: newTotal
      };

    case 'CHECKOUT':
      return {
        ...state,
        status: 'checkout'
      };

    case 'PROCESS_PAYMENT':
      return {
        ...state,
        status: 'payment'
      };

    case 'PAYMENT_SUCCESS':
      return {
        ...state,
        status: 'complete',
        items: [],
        total: 0
      };

    case 'PAYMENT_FAILED':
      return {
        ...state,
        status: 'has-items',
        error: action.payload
      };

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

/**
 * Auth Reducer - Authentication state machine
 * States: logged-out, authenticating, logged-in, error
 */
const authInitialState = {
  user: null,
  isAuthenticated: false,
  status: 'logged-out',
  error: null
};

function authReducer(state = authInitialState, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        status: 'authenticating',
        error: null
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        status: 'logged-in'
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        status: 'error',
        error: action.payload
      };

    case 'LOGOUT':
      return authInitialState;

    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    default:
      return state;
  }
}

/**
 * Order Reducer - Order workflow state machine
 * States: pending, confirmed, shipped, delivered, cancelled
 */
const orderInitialState = {
  orders: [],
  currentOrder: null,
  status: 'pending'
};

function orderReducer(state = orderInitialState, action) {
  switch (action.type) {
    case 'CREATE_ORDER':
      return {
        ...state,
        currentOrder: action.payload,
        status: 'pending'
      };

    case 'CONFIRM_ORDER':
      return {
        ...state,
        status: 'confirmed'
      };

    case 'SHIP_ORDER':
      return {
        ...state,
        status: 'shipped'
      };

    case 'DELIVER_ORDER':
      return {
        ...state,
        status: 'delivered',
        orders: state.currentOrder
          ? [...state.orders, { ...state.currentOrder, status: 'delivered' }]
          : state.orders
      };

    case 'CANCEL_ORDER':
      return {
        ...state,
        status: 'cancelled'
      };

    default:
      return state;
  }
}

module.exports = { cartReducer, authReducer, orderReducer };
