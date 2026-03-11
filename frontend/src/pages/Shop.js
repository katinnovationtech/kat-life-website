import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Shop.css';

const COLOR_MAP = {
  'White':      '#f5f5f5',
  'Black':      '#1a1a1a',
  'Grey':       '#9e9e9e',
  'Royal Blue': '#4169e1',
  'Navy Blue':  '#001f5b',
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const SORT_OPTIONS = [
  { value: 'default',    label: 'Featured' },
  { value: 'name-asc',  label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'price-asc', label: 'Price: Low–High' },
  { value: 'price-desc',label: 'Price: High–Low' },
];

function ProductCard({ product }) {
  const [quickAddSize, setQuickAddSize] = useState(null);
  const [addedMsg, setAddedMsg] = useState('');

  const handleQuickAdd = async (size) => {
    setQuickAddSize(size);
    const sessionId = getSessionId();
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, product_id: product.id, size, color: product.color, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        setAddedMsg(`Added ${size}!`);
        setTimeout(() => { setAddedMsg(''); setQuickAddSize(null); }, 1500);
      }
    } catch {
      setAddedMsg('Error');
      setTimeout(() => { setAddedMsg(''); setQuickAddSize(null); }, 1500);
    }
  };

  const productColors = Object.entries(COLOR_MAP).slice(0, 4);

  return (
    <div className="product-card">
      <Link to={`/shop/${product.id}`} className="product-card__img-wrap">
        <img
          src={product.image_url}
          alt={`${product.name} in ${product.color}`}
          className="product-card__img"
          loading="lazy"
        />
        <div className="product-card__overlay">
          {addedMsg ? (
            <div className="product-card__added-msg">{addedMsg}</div>
          ) : (
            <div className="product-card__quick-add">
              <p className="product-card__quick-add-label">QUICK ADD</p>
              <div className="product-card__sizes">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    className={`product-card__size-btn${quickAddSize === s ? ' active' : ''}`}
                    onClick={(e) => { e.preventDefault(); handleQuickAdd(s); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Link>
      <div className="product-card__info">
        <div className="product-card__swatches">
          {productColors.map(([name, hex]) => (
            <span
              key={name}
              className="product-card__swatch"
              style={{ background: hex }}
              title={name}
            />
          ))}
        </div>
        <Link to={`/shop/${product.id}`}>
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__color">{product.color}</p>
          <p className="product-card__price">
            {product.price > 0 ? `CAD$ ${product.price.toFixed(2)}` : 'CAD$ —'}
          </p>
        </Link>
      </div>
    </div>
  );
}

function getSessionId() {
  let id = localStorage.getItem('cartSessionId');
  if (!id) {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
    localStorage.setItem('cartSessionId', id);
  }
  return id;
}

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'skort' | 'short'

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProducts(data.data);
        else setError('Failed to load products.');
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => filterType === 'all' || p.type === filterType);

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':  return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'price-asc': return a.price - b.price;
      case 'price-desc':return b.price - a.price;
      default: return a.id - b.id;
    }
  });

  return (
    <div className="shop-page">
      <Navbar />

      {/* Hero */}
      <section className="shop-hero">
        <div className="shop-hero__bg" />
        <div className="shop-hero__content">
          <p className="shop-hero__eyebrow">OSTAYA™ Collection</p>
          <h1 className="shop-hero__heading">SHOP OSTAYA™</h1>
          <p className="shop-hero__tagline">Osteo Support That Activates Your Active Core™</p>
          <p className="shop-hero__desc">
            Your smart, wearable short designed to promote bone vitality and postural alignment
            using gentle, non-invasive electrical stimulation. Seamlessly integrating into daily
            routines, it acts as a wellness supplement for your core.
          </p>
          <a href="#products" className="shop-hero__btn">Shop Now</a>
        </div>
      </section>

      {/* Filter bar */}
      <div className="shop-filter-bar" id="products">
        <div className="shop-filter-bar__inner">
          <div className="shop-filter-left">
            <button
              className="shop-filter-btn"
              onClick={() => setFilterOpen((p) => !p)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filter
            </button>

            {filterOpen && (
              <div className="shop-filter-dropdown">
                {[['all', 'All Products'], ['skort', 'Wellness Skorts'], ['short', 'Wellness Shorts']].map(([val, label]) => (
                  <button
                    key={val}
                    className={`shop-filter-option${filterType === val ? ' active' : ''}`}
                    onClick={() => { setFilterType(val); setFilterOpen(false); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="shop-filter-right">
            <span className="shop-filter-count">{sorted.length} product{sorted.length !== 1 ? 's' : ''}</span>
            <label className="shop-sort-label" htmlFor="sort-select">Sort by</label>
            <select
              id="sort-select"
              className="shop-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products grid */}
      <main className="shop-products">
        <div className="shop-products__inner">
          {loading && (
            <div className="shop-loading">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-card-skeleton">
                  <div className="skeleton-img" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line skeleton-line--short" />
                </div>
              ))}
            </div>
          )}
          {!loading && error && <p className="shop-error">{error}</p>}
          {!loading && !error && (
            <div className="product-grid">
              {sorted.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Shop;
