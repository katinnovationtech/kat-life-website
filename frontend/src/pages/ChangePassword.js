import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import API_URL from '../config';

function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [show, setShow] = useState({ old: false, new: false, confirm: false });

  const toggleShow = (field) => setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGlobalError('');
  };

  const validate = () => {
    const e = {};
    if (!form.old_password) e.old_password = 'Old password is required.';
    if (!form.new_password) {
      e.new_password = 'New password is required.';
    } else if (form.new_password.length < 8) {
      e.new_password = 'Password must be at least 8 characters.';
    }
    if (!form.confirm_new_password) {
      e.confirm_new_password = 'Please confirm your new password.';
    } else if (form.new_password !== form.confirm_new_password) {
      e.confirm_new_password = 'Passwords do not match.';
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

    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
    if (!user) {
      setGlobalError('You must be logged in to change your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, ...form }),
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

  const EyeIcon = ({ visible }) => visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <div className="auth-page auth-page--light">
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
              <h2 className="auth-success__title">Password Changed!</h2>
              <p className="auth-success__sub">Your password has been updated successfully.</p>
              <Link
                to="/login"
                className="auth-btn auth-btn--sm"
                style={{ textDecoration: 'none', display: 'inline-flex' }}
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="auth-title">Change Password</h1>
              <p className="auth-subtitle">Update your password to keep your account secure.</p>

              {globalError && <div className="auth-error-banner">{globalError}</div>}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                  <label htmlFor="old_password">Old Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="old_password"
                      name="old_password"
                      type={show.old ? 'text' : 'password'}
                      className={`auth-input${errors.old_password ? ' auth-input--error' : ''}`}
                      placeholder="Enter your old password"
                      value={form.old_password}
                      onChange={handleChange}
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => toggleShow('old')} aria-label="Toggle visibility">
                      <EyeIcon visible={show.old} />
                    </button>
                  </div>
                  {errors.old_password && <p className="auth-field-error">{errors.old_password}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="new_password">New Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="new_password"
                      name="new_password"
                      type={show.new ? 'text' : 'password'}
                      className={`auth-input${errors.new_password ? ' auth-input--error' : ''}`}
                      placeholder="Enter your new password"
                      value={form.new_password}
                      onChange={handleChange}
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => toggleShow('new')} aria-label="Toggle visibility">
                      <EyeIcon visible={show.new} />
                    </button>
                  </div>
                  {errors.new_password && <p className="auth-field-error">{errors.new_password}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="confirm_new_password">Confirm New Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="confirm_new_password"
                      name="confirm_new_password"
                      type={show.confirm ? 'text' : 'password'}
                      className={`auth-input${errors.confirm_new_password ? ' auth-input--error' : ''}`}
                      placeholder="Repeat your new password"
                      value={form.confirm_new_password}
                      onChange={handleChange}
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => toggleShow('confirm')} aria-label="Toggle visibility">
                      <EyeIcon visible={show.confirm} />
                    </button>
                  </div>
                  {errors.confirm_new_password && <p className="auth-field-error">{errors.confirm_new_password}</p>}
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Updating…' : 'Change Password'}
                </button>
              </form>

              <a
                href="#cancel"
                className="auth-italic-link"
                onClick={(e) => { e.preventDefault(); navigate(-1); }}
              >
                Cancel Change
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
