import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Cart.css';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getCartSessionId() {
  let id = localStorage.getItem('cartSessionId');
  if (!id) {
    id = generateUUID();
    localStorage.setItem('cartSessionId', id);
  }
  return id;
}

function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sessionId = getCartSessionId();

  const fetchCart = useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`/api/cart/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setItems(data.data);
        else setError('Could not load your cart. Please try again.');
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
        );
      }
    } catch {}
  };

  const removeItem = async (itemId) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } catch {}
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <h1 className="cart-title">Your Bag</h1>
          <div className="cart-layout">
            <div className="cart-items">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="cart-skeleton-row">
                  <div className="cart-skeleton__img" />
                  <div className="cart-skeleton__info">
                    <div className="cart-skeleton__line cart-skeleton__line--lg" />
                    <div className="cart-skeleton__line" />
                    <div className="cart-skeleton__line cart-skeleton__line--sm" />
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary cart-summary--skeleton">
              <div className="cart-skeleton__line cart-skeleton__line--lg" />
              <div className="cart-skeleton__line" />
              <div className="cart-skeleton__line" />
              <div className="cart-skeleton__line cart-skeleton__line--sm" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <h1 className="cart-title">Your Bag</h1>
          <div className="cart-error">
            <p>{error}</p>
            <button className="cart-retry-btn" onClick={fetchCart}>
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Navbar />
      <div className="cart-container">
        <h1 className="cart-title">Your Bag</h1>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty__icon">
              <svg
                width="72"
                height="72"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className="cart-empty__heading">Your bag is empty</h2>
            <p className="cart-empty__sub">
              Looks like you haven't added anything yet.
            </p>
            <Link to="/shop" className="cart-empty__btn">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div className="cart-items">
              <p className="cart-items__count">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
              {items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <div className="cart-row">
                    <div className="cart-row__img-wrap">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="cart-row__img"
                        loading="lazy"
                      />
                    </div>
                    <div className="cart-row__details">
                      <div className="cart-row__top">
                        <div>
                          <p className="cart-row__name">{item.name}</p>
                          <p className="cart-row__meta">
                            Color: {item.color} | Size: {item.size}
                          </p>
                        </div>
                        <button
                          className="cart-row__remove"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                      <div className="cart-row__bottom">
                        <div className="cart-row__qty">
                          <button
                            className="cart-row__qty-btn"
                            onClick={() =>
                              updateQty(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="cart-row__qty-num">
                            {item.quantity}
                          </span>
                          <button
                            className="cart-row__qty-btn"
                            onClick={() =>
                              updateQty(item.id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <p className="cart-row__price">
                          {item.unit_price > 0
                            ? `CAD$ ${(item.unit_price * item.quantity).toFixed(2)}`
                            : 'CAD$ —'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {idx < items.length - 1 && (
                    <hr className="cart-divider" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Order Summary */}
            <div className="cart-summary">
              <h2 className="cart-summary__title">Order Summary</h2>
              <div className="cart-summary__row">
                <span>Subtotal</span>
                <span>
                  {subtotal > 0 ? `CAD$ ${subtotal.toFixed(2)}` : 'CAD$ —'}
                </span>
              </div>
              <div className="cart-summary__row">
                <span>Shipping</span>
                <span className="cart-summary__shipping">
                  Calculated at checkout
                </span>
              </div>
              <hr className="cart-summary__divider" />
              <div className="cart-summary__row cart-summary__total">
                <span>Total</span>
                <span>
                  {subtotal > 0 ? `CAD$ ${subtotal.toFixed(2)}` : 'CAD$ —'}
                </span>
              </div>
              <button className="cart-checkout-btn">
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Cart;
