import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

function VerifyEmail() {
  return (
    <div className="auth-page">
      <div className="auth-center">
        <Link to="/" className="auth-logo">
          <span className="auth-logo__kat">KAT</span>
          <span className="auth-logo__life"> Life</span>
        </Link>

        <div className="auth-card">
          <div className="auth-success">
            <div className="auth-success__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="auth-success__title">Thank you for Signing Up!</h1>
            <p className="auth-success__sub">
              We sent a verification link to your email. Please check your inbox to activate your account.
            </p>
            <Link
              to="/login"
              className="auth-btn auth-btn--outline auth-btn--sm"
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              Go Back to Login
            </Link>
            <a href="#resend" className="auth-italic-link" style={{ marginTop: '14px' }}>
              Resend Code
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
