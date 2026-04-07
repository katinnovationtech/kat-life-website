import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Auth.css';

const PRODUCTS = ['OSTAYA™ Wellness Skorts', 'OSTAYA™ Wellness Shorts', 'Both'];
const COLORS = ['White', 'Black', 'Grey', 'Royal Blue', 'Navy Blue'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

function PreorderGuest() {
  const { state } = useLocation();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    product_interest: state?.productInterest || '',
    color: state?.color || '',
    size: state?.size || '',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required.';
    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Please enter a valid email address.';
    }
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    if (!form.product_interest) e.product_interest = 'Please select a product.';
    if (!form.color) e.color = 'Please select a color.';
    if (!form.size) e.size = 'Please select a size.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGlobalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/preorder/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setGlobalError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setGlobalError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const firstName = form.full_name.trim().split(' ')[0];

  return (
    <div className="auth-page">
      <div className="auth-center">
        <Link to="/" className="auth-logo">
          <span className="auth-logo__kat">KAT</span>
          <span className="auth-logo__life"> Life</span>
        </Link>

        <div className="auth-card">
          {success ? (
            <div className="auth-success">
              <div className="auth-success__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="auth-success__title">You're on the list!</h2>
              <p className="auth-success__sub">
                Thank you {firstName}. We've received your pre-order and will notify you at{' '}
                <strong>{form.email}</strong> when OSTAYA™ is ready to ship.
              </p>
              <Link to="/shop" className="auth-btn auth-btn--sm" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                Go Back to Shop
              </Link>
            </div>
          ) : (
            <>
              <h1 className="auth-title">Pre-Order as Guest</h1>
              <p className="auth-subtitle">
                Reserve your OSTAYA™ product. We'll notify you when it's ready to ship.
              </p>

              {globalError && <div className="auth-error-banner">{globalError}</div>}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                  <label htmlFor="full_name">Full Name</label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    className={`auth-input${errors.full_name ? ' auth-input--error' : ''}`}
                    placeholder="Enter your full name"
                    value={form.full_name}
                    onChange={handleChange}
                  />
                  {errors.full_name && <p className="auth-field-error">{errors.full_name}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="auth-field-error">{errors.email}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className={`auth-input${errors.phone ? ' auth-input--error' : ''}`}
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && <p className="auth-field-error">{errors.phone}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="product_interest">Product Interest</label>
                  <div className="auth-select-wrap">
                    <select
                      id="product_interest"
                      name="product_interest"
                      className={`auth-select${errors.product_interest ? ' auth-input--error' : ''}`}
                      value={form.product_interest}
                      onChange={handleChange}
                    >
                      <option value="">Select a product</option>
                      {PRODUCTS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  {errors.product_interest && <p className="auth-field-error">{errors.product_interest}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="color">Preferred Color</label>
                  <div className="auth-select-wrap">
                    <select
                      id="color"
                      name="color"
                      className={`auth-select${errors.color ? ' auth-input--error' : ''}`}
                      value={form.color}
                      onChange={handleChange}
                    >
                      <option value="">Select a color</option>
                      {COLORS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {errors.color && <p className="auth-field-error">{errors.color}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="size">Preferred Size</label>
                  <div className="auth-select-wrap">
                    <select
                      id="size"
                      name="size"
                      className={`auth-select${errors.size ? ' auth-input--error' : ''}`}
                      value={form.size}
                      onChange={handleChange}
                    >
                      <option value="">Select a size</option>
                      {SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {errors.size && <p className="auth-field-error">{errors.size}</p>}
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Submitting…' : 'CONFIRM PRE-ORDER'}
                </button>

                <p className="auth-terms-note">
                  By confirming you agree to our{' '}
                  <a href="#terms">Terms and Conditions</a>
                </p>
              </form>

              <p className="auth-footer-text">
                Already have an account?{' '}
                <Link to="/login">Login here</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreorderGuest;
