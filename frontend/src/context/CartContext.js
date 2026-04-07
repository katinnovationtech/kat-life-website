import React, { createContext, useContext, useState, useCallback } from 'react';

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = useCallback(() => {
    const sessionId = localStorage.getItem('cartSessionId');
    if (!sessionId) {
      setCartCount(0);
      return;
    }
    fetch(`/api/cart/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const total = data.data.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(total);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
