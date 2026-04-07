import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const CODE_LENGTH = 6;

function VerifyCode() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    // Auto-advance
    if (value && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when last digit filled
    if (value && index === CODE_LENGTH - 1) {
      const full = [...newCode].join('');
      if (full.length === CODE_LENGTH) {
        handleConfirm(full);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async (fullCode) => {
    const codeStr = fullCode || code.join('');
    if (codeStr.length < CODE_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    // Simulate verification — in production this would call an API
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 800);
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
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="auth-success__title">Code Verified!</h2>
              <p className="auth-success__sub">Your verification was successful.</p>
              <Link
                to="/change-password"
                className="auth-btn auth-btn--sm"
                style={{ textDecoration: 'none', display: 'inline-flex' }}
              >
                Set New Password
              </Link>
            </div>
          ) : (
            <>
              <h1 className="auth-title">Verify Code</h1>
              <p className="auth-subtitle">Enter the verification code sent to your email</p>

              <p style={{ fontStyle: 'italic', color: '#1a5f7a', fontSize: '0.875rem', marginBottom: '20px', textAlign: 'center' }}>
                Enter Verification Code sent to your email
              </p>

              <div className="auth-otp">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="auth-otp__input"
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              {error && <p className="auth-field-error" style={{ textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

              <button
                className="auth-btn"
                onClick={() => handleConfirm()}
                disabled={loading}
              >
                {loading ? 'Verifying…' : 'CONFIRM'}
              </button>

              <a href="#resend" className="auth-italic-link">Resend Code</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyCode;
