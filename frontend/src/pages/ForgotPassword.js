import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

function ForgotPassword() {
  const [form, setForm] = useState({ email: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGlobalError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Please enter a valid email address.';
    }
    return e;
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
      const res = await fetch('/api/auth/forgot-password', {
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
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="auth-success__title">Check your email!</h2>
              <p className="auth-success__sub">
                We've sent a password reset link to <strong>{form.email}</strong>. Please check your inbox.
              </p>
              <Link
                to="/login"
                className="auth-btn auth-btn--outline auth-btn--sm"
                style={{ textDecoration: 'none', display: 'inline-flex' }}
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="auth-title">Forgot Password?</h1>
              <p className="auth-subtitle">
                Enter your email address and we'll send you a reset link.
              </p>

              {globalError && <div className="auth-error-banner">{globalError}</div>}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                  {errors.email && <p className="auth-field-error">{errors.email}</p>}
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Password'}
                </button>
              </form>

              <Link to="/login" className="auth-italic-link">
                Back to Login Page
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
