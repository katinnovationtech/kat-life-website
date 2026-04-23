import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CartContext } from '../context/CartContext';
import './Shop.css';
import API_URL from '../config';

const COLOR_MAP = {
  'White':      '#FFFFFF',
  'Black':      '#000000',
  'Grey':       '#808080',
  'Royal Blue': '#4169E1',
  'Navy Blue':  '#001F5B',
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const SORT_OPTIONS = [
  { value: 'default',    label: 'Featured' },
  { value: 'name-asc',  label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'price-asc', label: 'Price: Low–High' },
  { value: 'price-desc',label: 'Price: High–Low' },
];

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

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }) {
  const { updateCartCount } = useContext(CartContext);
  const navigate = useNavigate();

  const variants = product.variants || [];
  const [variantIdx, setVariantIdx] = useState(0);
  const [imgKey, setImgKey] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');
  const [overlayOpen, setOverlayOpen] = useState(false);

  const currentVariant = variants[variantIdx] || variants[0];

  const changeVariant = (newIdx) => {
    setVariantIdx(newIdx);
    setImgKey((k) => k + 1);
  };

  const prevColor = (e) => {
    e.preventDefault();
    e.stopPropagation();
    changeVariant((variantIdx - 1 + variants.length) % variants.length);
  };

  const nextColor = (e) => {
    e.preventDefault();
    e.stopPropagation();
    changeVariant((variantIdx + 1) % variants.length);
  };

  const handleSwatchClick = (idx) => {
    if (idx !== variantIdx) changeVariant(idx);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!selectedSize || adding || !currentVariant) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: getSessionId(),
          product_id: currentVariant.id,
          size: selectedSize,
          color: currentVariant.color,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        updateCartCount();
        setAddedMsg('Added to bag!');
        setTimeout(() => {
          setAddedMsg('');
          setSelectedSize(null);
          setOverlayOpen(false);
        }, 2000);
      }
    } catch {
      setAddedMsg('Error adding item');
      setTimeout(() => setAddedMsg(''), 2000);
    } finally {
      setAdding(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/shop/${currentVariant.id}`, {
      state: { selectedColor: currentVariant.color },
    });
  };

  if (!currentVariant) return null;

  return (
    <div className="product-card">
      <div
        className="product-card__img-wrap"
        onTouchStart={() => setOverlayOpen((o) => !o)}
      >
        <div
          className="product-card__img-link"
          onClick={handleCardClick}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
          aria-label={`View ${product.name} in ${currentVariant.color}`}
        >
          <img
            key={imgKey}
            src={currentVariant.image_url}
            alt={`${product.name} in ${currentVariant.color}`}
            className="product-card__img product-card__img--fade"
            loading="lazy"
          />
        </div>

        {variants.length > 1 && (
          <>
            <button
              className="product-card__arrow product-card__arrow--left"
              onClick={prevColor}
              aria-label="Previous color"
            >
              ‹
            </button>
            <button
              className="product-card__arrow product-card__arrow--right"
              onClick={nextColor}
              aria-label="Next color"
            >
              ›
            </button>
          </>
        )}

        <div className={`product-card__overlay${overlayOpen ? ' overlay--open' : ''}`}>
          {addedMsg ? (
            <div className="product-card__added-msg">{addedMsg}</div>
          ) : (
            <div className="product-card__quick-add">
              <p className="product-card__quick-add-label">QUICK ADD</p>

              <p className="product-card__selector-label">COLOR</p>
              <div className="product-card__color-swatches">
                {variants.map((v, i) => (
                  <button
                    key={v.id}
                    className={`product-card__color-swatch${i === variantIdx ? ' selected' : ''}`}
                    style={{
                      background: COLOR_MAP[v.color] || v.color,
                      ...(v.color === 'White' ? { boxShadow: '0 0 0 1px rgba(255,255,255,0.5), inset 0 0 0 1px rgba(0,0,0,0.15)' } : {}),
                    }}
                    title={v.color}
                    onClick={(e) => { e.preventDefault(); changeVariant(i); }}
                    aria-label={v.color}
                  />
                ))}
              </div>

              <p className="product-card__selector-label">SIZE</p>
              <div className="product-card__sizes">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    className={`product-card__size-btn${selectedSize === s ? ' active' : ''}`}
                    onClick={(e) => { e.preventDefault(); setSelectedSize(s); }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                className={`product-card__add-btn${!selectedSize ? ' disabled' : ''}`}
                onClick={handleQuickAdd}
                disabled={!selectedSize || adding}
              >
                {adding ? 'Adding…' : 'ADD TO BAG'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="product-card__info">
        <div className="product-card__swatches">
          {variants.map((v, i) => (
            <button
              key={v.id}
              className={`product-card__swatch-btn${i === variantIdx ? ' active' : ''}`}
              style={{
                background: COLOR_MAP[v.color] || v.color,
                ...(v.color === 'White' ? { outline: '1.5px solid #ccc' } : {}),
              }}
              title={v.color}
              onClick={() => handleSwatchClick(i)}
              aria-label={v.color}
            />
          ))}
        </div>

        <p className="product-card__color-hint">← Hover to explore colors →</p>

        <div
          className="product-card__text-link"
          onClick={handleCardClick}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
          style={{ cursor: 'pointer' }}
        >
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__color">{currentVariant.color}</p>
          <p className="product-card__price">
            {currentVariant.price > 0
              ? `CAD$ ${currentVariant.price.toFixed(2)}`
              : 'CAD$ —'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Shop Page ────────────────────────────────────────────────────────────────

function Shop() {
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/products`).then((r) => r.json()),
      fetch(`${API_URL}/api/product-types`).then((r) => r.json()),
    ])
      .then(([prodData, typeData]) => {
        if (prodData.success) setProducts(prodData.data);
        else setError('Failed to load products.');
        if (typeData.success) setProductTypes(typeData.data);
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    if (filterType === 'all') return true;
    return p.product_type_slug === filterType || p.product_type_id === filterType;
  });

  const sorted = [...filtered].sort((a, b) => {
    const priceA = a.variants?.[0]?.price ?? 0;
    const priceB = b.variants?.[0]?.price ?? 0;
    switch (sortBy) {
      case 'name-asc':   return a.name.localeCompare(b.name);
      case 'name-desc':  return b.name.localeCompare(a.name);
      case 'price-asc':  return priceA - priceB;
      case 'price-desc': return priceB - priceA;
      default:           return 0;
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
                <button
                  className={`shop-filter-option${filterType === 'all' ? ' active' : ''}`}
                  onClick={() => { setFilterType('all'); setFilterOpen(false); }}
                >
                  All Products
                </button>
                {productTypes.map((t) => (
                  <button
                    key={t.id}
                    className={`shop-filter-option${filterType === t.slug ? ' active' : ''}`}
                    onClick={() => { setFilterType(t.slug); setFilterOpen(false); }}
                  >
                    {t.name}
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

          {!loading && !error && sorted.length > 0 && (
            <p className="shop-desktop-hint">
              💡 Hover over a product to explore available colors
            </p>
          )}

          {loading && (
            <div className="shop-loading">
              {[...Array(2)].map((_, i) => (
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
              {sorted.map((p) => (
                <ProductCard key={p.base_product} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Shop;
