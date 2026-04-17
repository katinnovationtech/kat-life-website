import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const COLOR_MAP = {
  'White':      '#f5f5f5',
  'Black':      '#1a1a1a',
  'Grey':       '#9e9e9e',
  'Royal Blue': '#4169e1',
  'Navy Blue':  '#001f5b',
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const TABS = ['Details', 'Fit & Fabric', 'Shipping & Returns'];

const TAB_CONTENT = {
  'Details': `The OSTAYA™ Wellness garment is engineered with our proprietary ActiveCore™ technology, integrating micro-electrode panels strategically placed to deliver gentle, non-invasive electrical stimulation to your core and surrounding musculature. Crafted from a premium 4-way stretch performance fabric, it moves with you throughout the day.

Key features include moisture-wicking technology, UPF 50+ sun protection, and an ergonomic waistband that ensures secure, all-day comfort. Each garment undergoes rigorous quality testing to ensure optimal stimulation delivery and washability up to 150 cycles.`,

  'Fit & Fabric': `Our OSTAYA™ garments are designed with an athletic, true-to-size fit. We recommend sizing up if you prefer a more relaxed feel. The fabric composition is 78% nylon and 22% elastane, providing exceptional stretch recovery and shape retention.

The four-way stretch construction allows unrestricted movement in every direction. The fabric weight is 220 GSM, offering the perfect balance of support and comfort. Inner liner provides secure, smooth coverage throughout your activity.`,

  'Shipping & Returns': `Standard Shipping: 5–8 business days (free on orders over CAD$ 75)
Express Shipping: 2–3 business days (calculated at checkout)
Overnight Shipping: Next business day (available for select regions)

Returns & Exchanges: We accept returns within 30 days of delivery for unworn, unwashed items in original condition with tags attached. To initiate a return, contact info@katinnovation.com. Exchanges ship within 2 business days of receiving your returned item.`,
};

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

function ProductDetail() {
  const { id } = useParams();
  const { updateCartCount } = useCart();
  const location = useLocation();
  const passedColor = location.state?.selectedColor || null;
  const [product, setProduct]     = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize]   = useState('');
  const [activeTab, setActiveTab] = useState('Details');
  const [addStatus, setAddStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [addMessage, setAddMessage] = useState('');
  const [imgIndex, setImgIndex]   = useState(0);
  const similarRef = useRef(null);

  // Multiple images simulated per product
  const getImages = (p) => p ? [
    p.image_url,
    `https://picsum.photos/seed/${p.type}-${p.color.replace(' ', '')}-2/600/700`,
    `https://picsum.photos/seed/${p.type}-${p.color.replace(' ', '')}-3/600/700`,
  ] : [];

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch(`/api/products/${id}`).then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ])
      .then(([prodData, allData]) => {
        if (prodData.success) {
          setProduct(prodData.data);
          setSelectedColor(passedColor || prodData.data.color);
        } else {
          setError('Product not found.');
        }
        if (allData.success) {
          // /api/products now returns grouped format; flatten variants into individual records
          const flat = allData.data.flatMap((group) =>
            group.variants.map((v) => ({
              ...v,
              name: group.name,
              type: group.type,
              description: group.description,
            }))
          );
          setAllProducts(flat);
        }
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToBag = async () => {
    if (!selectedSize) {
      setAddStatus('error');
      setAddMessage('Please select a size.');
      return;
    }
    setAddStatus('loading');
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: getSessionId(),
          product_id: product.id,
          size: selectedSize,
          color: selectedColor,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAddStatus('success');
        setAddMessage('Added to your bag!');
        updateCartCount();
      } else {
        setAddStatus('error');
        setAddMessage(data.error || 'Could not add to bag.');
      }
    } catch {
      setAddStatus('error');
      setAddMessage('Network error.');
    }
    setTimeout(() => { setAddStatus(null); setAddMessage(''); }, 3000);
  };

  const similar = allProducts.filter(p => p.id !== parseInt(id)).slice(0, 6);

  const scrollSimilar = (dir) => {
    if (similarRef.current) {
      similarRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="pdp-page">
      <Navbar />
      <div className="pdp-skeleton">
        <div className="pdp-skeleton__img" />
        <div className="pdp-skeleton__info">
          {[...Array(5)].map((_, i) => <div key={i} className="pdp-skeleton__line" />)}
        </div>
      </div>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="pdp-page">
      <Navbar />
      <div className="pdp-error">{error} <Link to="/shop">Back to Shop</Link></div>
      <Footer />
    </div>
  );

  const images = getImages(product);
  const colors = Object.keys(COLOR_MAP);

  return (
    <div className="pdp-page">
      <Navbar />

      <div className="pdp-breadcrumb">
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <section className="pdp-main">
        {/* Left: Image carousel */}
        <div className="pdp-gallery">
          <div className="pdp-gallery__main">
            <img
              src={images[imgIndex]}
              alt={product.name}
              className="pdp-gallery__img"
            />
            {images.length > 1 && (
              <>
                <button
                  className="pdp-gallery__arrow pdp-gallery__arrow--left"
                  onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                  aria-label="Previous image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button
                  className="pdp-gallery__arrow pdp-gallery__arrow--right"
                  onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                  aria-label="Next image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <div className="pdp-gallery__dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`pdp-gallery__dot${i === imgIndex ? ' active' : ''}`}
                      onClick={() => setImgIndex(i)}
                      aria-label={`View image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="pdp-gallery__thumbs">
            {images.map((src, i) => (
              <button
                key={i}
                className={`pdp-gallery__thumb${i === imgIndex ? ' active' : ''}`}
                onClick={() => setImgIndex(i)}
              >
                <img src={src} alt={`View ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Product info */}
        <div className="pdp-info">
          <p className="pdp-info__type">{product.type === 'skort' ? 'Wellness Skort' : 'Wellness Short'}</p>
          <h1 className="pdp-info__name">{product.name}</h1>
          <p className="pdp-info__color-label">Color: <strong>{selectedColor}</strong></p>
          <p className="pdp-info__price">
            {product.price > 0 ? `CAD$ ${product.price.toFixed(2)}` : 'CAD$ — (Coming Soon)'}
          </p>

          <div className="pdp-info__notes">
            <div className="pdp-info__note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Free shipping on orders over CAD$ 75
            </div>
            <div className="pdp-info__note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Secure, encrypted checkout
            </div>
          </div>

          {/* Color selector */}
          <div className="pdp-info__section">
            <p className="pdp-info__section-label">Color</p>
            <div className="pdp-colors">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`pdp-color-swatch${selectedColor === c ? ' active' : ''}`}
                  style={{ background: COLOR_MAP[c] }}
                  title={c}
                  onClick={() => setSelectedColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div className="pdp-info__section">
            <div className="pdp-size-header">
              <p className="pdp-info__section-label">Size</p>
              <button className="pdp-size-chart-link">Size Chart</button>
            </div>
            <div className="pdp-sizes">
              {SIZES.map((s) => (
                <button
                  key={s}
                  className={`pdp-size-btn${selectedSize === s ? ' active' : ''}`}
                  onClick={() => { setSelectedSize(s); setAddStatus(null); setAddMessage(''); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Add to bag */}
          <button
            className={`pdp-add-btn${addStatus === 'loading' ? ' loading' : ''}${addStatus === 'success' ? ' success' : ''}`}
            onClick={handleAddToBag}
            disabled={addStatus === 'loading'}
          >
            {addStatus === 'loading' ? 'Adding...' : addStatus === 'success' ? '✓ Added to Bag' : 'ADD TO BAG'}
          </button>

          {addStatus === 'error' && (
            <p className="pdp-add-error">{addMessage}</p>
          )}

          {/* Short description */}
          <p className="pdp-info__desc">{product.description}</p>
        </div>
      </section>

      {/* Tabs */}
      <section className="pdp-tabs-section">
        <div className="pdp-tabs-section__inner">
          <div className="pdp-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`pdp-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="pdp-tab-content">
            {TAB_CONTENT[activeTab]}
          </div>
        </div>
      </section>

      {/* Similar Styles */}
      {similar.length > 0 && (
        <section className="pdp-similar">
          <div className="pdp-similar__inner">
            <div className="pdp-similar__header">
              <h2 className="pdp-similar__title">SIMILAR STYLES</h2>
              <div className="pdp-similar__controls">
                <span className="pdp-similar__counter">1 / {similar.length}</span>
                <button className="pdp-similar__arrow" onClick={() => scrollSimilar(-1)} aria-label="Previous">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button className="pdp-similar__arrow" onClick={() => scrollSimilar(1)} aria-label="Next">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
            <div className="pdp-similar__scroll" ref={similarRef}>
              {similar.map((p) => (
                <Link key={p.id} to={`/shop/${p.id}`} className="pdp-similar-card">
                  <div className="pdp-similar-card__img-wrap">
                    <img src={p.image_url} alt={p.name} loading="lazy" />
                  </div>
                  <p className="pdp-similar-card__name">{p.name}</p>
                  <p className="pdp-similar-card__color">{p.color}</p>
                  <p className="pdp-similar-card__price">
                    {p.price > 0 ? `CAD$ ${p.price.toFixed(2)}` : 'CAD$ —'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

export default ProductDetail;
