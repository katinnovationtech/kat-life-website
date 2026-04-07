import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

function EmailVerified() {
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
            <h1 className="auth-success__title">Email Verified</h1>
            <p className="auth-success__sub">
              Your account has been successfully verified. You can now log in.
            </p>
            <Link
              to="/"
              className="auth-btn auth-btn--outline auth-btn--sm"
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              Go Back to Home
            </Link>
            <a
              href="#close"
              className="auth-italic-link"
              onClick={(e) => { e.preventDefault(); window.close(); }}
            >
              Close this tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerified;
