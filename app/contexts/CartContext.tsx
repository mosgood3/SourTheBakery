'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  description: string;
  image: string;
  maxQuantity?: number; // Maximum quantity available for this item
  pickupId: string; // NEW: Track which pickup this item belongs to
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  currentPickupId: string | null; // NEW: Track current pickup context
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'SET_PICKUP'; payload: string } // NEW: Set current pickup
  | { type: 'LOAD_FROM_STORAGE'; payload: CartState }; // NEW: Load from localStorage

const initialState: CartState = {
  items: [],
  isOpen: false,
  currentPickupId: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        // Check if we can add more (respect maxQuantity)
        const maxQuantity = action.payload.maxQuantity ?? Infinity;
        const newQuantity = Math.min(existingItem.quantity + 1, maxQuantity);

        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: newQuantity, maxQuantity: action.payload.maxQuantity }
              : item
          ),
          // Set current pickup if not set
          currentPickupId: state.currentPickupId || action.payload.pickupId,
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
        // Set current pickup if not set
        currentPickupId: state.currentPickupId || action.payload.pickupId,
      };
    }
    case 'REMOVE_ITEM':
      const newItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: newItems,
        // Clear pickup if cart is now empty
        currentPickupId: newItems.length === 0 ? null : state.currentPickupId,
      };
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? {
              ...item,
              quantity: Math.max(0, Math.min(action.payload.quantity, item.maxQuantity ?? Infinity))
            }
          : item
      ).filter(item => item.quantity > 0);

      return {
        ...state,
        items: updatedItems,
        // Clear pickup if cart is now empty
        currentPickupId: updatedItems.length === 0 ? null : state.currentPickupId,
      };
    }
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        currentPickupId: null,
      };
    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };
    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false,
      };
    case 'SET_PICKUP':
      return {
        ...state,
        currentPickupId: action.payload,
      };
    case 'LOAD_FROM_STORAGE':
      return action.payload;
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => string;
  setCurrentPickup: (pickupId: string) => void; // NEW
  validatePickupSwitch: (newPickupId: string) => boolean; // NEW
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'sourthebakery_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedCart });
      } catch (error) {
        console.error('Failed to load cart from storage:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Don't save isOpen state
    const cartToSave = {
      items: state.items,
      isOpen: false,
      currentPickupId: state.currentPickupId,
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartToSave));
  }, [state.items, state.currentPickupId]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const setCurrentPickup = (pickupId: string) => {
    dispatch({ type: 'SET_PICKUP', payload: pickupId });
  };

  /**
   * Validate if we can switch to a different pickup
   * Returns true if cart is empty or same pickup
   * Returns false if cart has items from different pickup (requires user confirmation)
   */
  const validatePickupSwitch = (newPickupId: string): boolean => {
    // No items in cart, switch is allowed
    if (state.items.length === 0) {
      return true;
    }

    // Same pickup, switch is allowed
    if (state.currentPickupId === newPickupId) {
      return true;
    }

    // Different pickup with items in cart, requires confirmation
    return false;
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    const total = state.items.reduce((total, item) => {
      const price = parseFloat(item.price.replace('$', ''));
      return total + (price * item.quantity);
    }, 0);
    return `$${total.toFixed(2)}`;
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        closeCart,
        getTotalItems,
        getTotalPrice,
        setCurrentPickup,
        validatePickupSwitch,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
