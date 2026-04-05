/**
 * Redux reducer fixture - Shopping cart state machine
 * Demonstrates reducer pattern with switch statement for state transitions
 */

// Action Types
const ADD_ITEM = 'cart/ADD_ITEM';
const REMOVE_ITEM = 'cart/REMOVE_ITEM';
const CHECKOUT = 'cart/CHECKOUT';
const CONFIRM = 'cart/CONFIRM';
const RESET = 'cart/RESET';
const CLEAR_CART = 'cart/CLEAR_CART';

// Action Creators
export const addItem = (item) => ({
  type: ADD_ITEM,
  payload: item
});

export const removeItem = (itemId) => ({
  type: REMOVE_ITEM,
  payload: { id: itemId }
});

export const checkout = () => ({
  type: CHECKOUT
});

export const confirm = (paymentDetails) => ({
  type: CONFIRM,
  payload: paymentDetails
});

export const reset = () => ({
  type: RESET
});

export const clearCart = () => ({
  type: CLEAR_CART
});

// Initial State
const initialState = {
  status: 'empty', // 'empty' | 'has-items' | 'checkout' | 'confirmed'
  items: [],
  total: 0,
  paymentInfo: null
};

/**
 * Cart reducer - State machine with 4 states
 * States: 'empty', 'has-items', 'checkout', 'confirmed'
 */
export function cartReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_ITEM: {
      // Transition: empty/has-items -> has-items
      const newItems = [...state.items, action.payload];
      const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);

      return {
        ...state,
        status: 'has-items',
        items: newItems,
        total: newTotal
      };
    }

    case REMOVE_ITEM: {
      // Transition: has-items -> has-items (or empty if last item)
      const newItems = state.items.filter(item => item.id !== action.payload.id);
      const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);

      return {
        ...state,
        status: newItems.length > 0 ? 'has-items' : 'empty',
        items: newItems,
        total: newTotal
      };
    }

    case CHECKOUT: {
      // Transition: has-items -> checkout
      // Security note: This should validate items exist before allowing checkout
      if (state.items.length === 0) {
        return state; // Invalid transition - no items to checkout
      }

      return {
        ...state,
        status: 'checkout'
      };
    }

    case CONFIRM: {
      // Transition: checkout -> confirmed
      // Security note: This should validate payment before confirming
      if (state.status !== 'checkout') {
        return state; // Invalid transition - must be in checkout state
      }

      return {
        ...state,
        status: 'confirmed',
        paymentInfo: action.payload
      };
    }

    case RESET: {
      // Transition: confirmed -> empty
      return {
        ...initialState
      };
    }

    case CLEAR_CART: {
      // Transition: has-items/empty -> empty
      return {
        ...state,
        status: 'empty',
        items: [],
        total: 0
      };
    }

    default:
      return state;
  }
}

// State machine visualization:
// empty --(ADD_ITEM)--> has-items --(REMOVE_ITEM* [last])--> empty
//       <--(REMOVE_ITEM)--|
//                     |
//                     +--(CHECKOUT)--> checkout --(CONFIRM)--> confirmed --(RESET)--> empty
//                                  <--(invalid)--|
//
// * Security considerations:
// * - CHECKOUT requires items.length > 0 (enforced in reducer)
// * - CONFIRM requires status === 'checkout' (enforced in reducer)
// * - Direct state modification outside actions would bypass validation

export default cartReducer;
