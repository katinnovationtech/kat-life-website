import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (light exercise 1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately Active (moderate exercise 3-5 days/week)' },
  { value: 'very_active', label: 'Very Active (hard exercise 6-7 days/week)' },
];

const HEALTH_GOAL_OPTIONS = [
  { value: 'bone_health', label: 'Bone Health & Density' },
  { value: 'posture', label: 'Posture Improvement' },
  { value: 'recovery', label: 'Active Recovery' },
  { value: 'general_wellness', label: 'General Wellness' },
  { value: 'athletic', label: 'Athletic Performance' },
];

const HEALTH_CONCERNS_OPTIONS = [
  'Back Pain',
  'Joint Discomfort',
  'Posture Issues',
  'Bone Density Concerns',
  'Muscle Fatigue',
  'None of the above',
];

const AGE_OPTIONS = [
  { value: 'under_25', label: 'Under 25' },
  { value: '25_34', label: '25 - 34' },
  { value: '35_44', label: '35 - 44' },
  { value: '45_54', label: '45 - 54' },
  { value: '55_plus', label: '55 and above' },
];

const HOW_HEARD_OPTIONS = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'friend_family', label: 'Friend or Family' },
  { value: 'doctor', label: 'Doctor Recommendation' },
  { value: 'online_search', label: 'Online Search' },
  { value: 'other', label: 'Other' },
];

const strengthRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'At least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'At least one number', test: (p) => /[0-9]/.test(p) },
  { label: 'At least one special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    activity_level: '',
    primary_health_goal: '',
    age_range: '',
    how_heard: '',
    terms_accepted: false,
  });
  const [healthConcerns, setHealthConcerns] = useState([]);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGlobalError('');
  };

  const handleHealthConcernChange = (option) => {
    setErrors((prev) => ({ ...prev, health_concerns: '' }));
    if (option === 'None of the above') {
      setHealthConcerns((prev) =>
        prev.includes('None of the above') ? [] : ['None of the above']
      );
    } else {
      setHealthConcerns((prev) => {
        const without = prev.filter((o) => o !== 'None of the above');
        return without.includes(option)
          ? without.filter((o) => o !== option)
          : [...without, option];
      });
    }
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required.';
    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Please enter a valid email address.';
    }
    if (!form.password) {
      e.password = 'Password is required.';
    } else {
      const failed = strengthRules.filter((r) => !r.test(form.password));
      if (failed.length > 0) e.password = 'Password does not meet all requirements.';
    }
    if (!form.confirm_password) {
      e.confirm_password = 'Please confirm your password.';
    } else if (form.password !== form.confirm_password) {
      e.confirm_password = 'Passwords do not match.';
    }
    if (!form.activity_level) e.activity_level = 'Please select your activity level.';
    if (!form.primary_health_goal) e.primary_health_goal = 'Please select your primary health goal.';
    if (healthConcerns.length === 0) e.health_concerns = 'Please select at least one option.';
    if (!form.age_range) e.age_range = 'Please select your age range.';
    if (!form.how_heard) e.how_heard = 'Please tell us how you heard about us.';
    if (!form.terms_accepted) e.terms_accepted = 'You must accept the Terms and Conditions.';
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          confirm_password: form.confirm_password,
          terms_accepted: form.terms_accepted,
          activity_level: form.activity_level,
          primary_health_goal: form.primary_health_goal,
          health_concerns: healthConcerns,
          age_range: form.age_range,
          how_heard: form.how_heard,
        }),
      });
      const data = await res.json();
      if (data.success) {
        navigate('/verify-email');
      } else {
        if (data.field) {
          setErrors((prev) => ({ ...prev, [data.field]: data.error }));
        } else {
          setGlobalError(data.error || 'Something went wrong. Please try again.');
        }
      }
    } catch {
      setGlobalError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* Header */}
      <div className="auth-split__header">
        <Link to="/" className="auth-logo" style={{ marginBottom: 0 }}>
          <span className="auth-logo__kat">KAT</span>
          <span className="auth-logo__life"> Life</span>
        </Link>
        <div className="auth-split__header-right">
          Already a member? <Link to="/login">Login here</Link>
        </div>
      </div>
      <div className="auth-split__divider" />

      <div className="auth-split__body">
        {/* Left image panel */}
        <div className="auth-split__left">
          <p className="auth-split__left-placeholder">Image coming soon</p>
        </div>

        {/* Right form panel */}
        <div className="auth-split__right">
          <h1 className="auth-title">Sign Up</h1>
          <p className="auth-subtitle">Be a member to get news, updates from Kat Life</p>

          <div className="auth-discount-banner">
            🎉 Sign up today and get 25% off when products launch!
          </div>

          {globalError && <div className="auth-error-banner">{globalError}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                className={`auth-input${errors.username ? ' auth-input--error' : ''}`}
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
              {errors.username && <p className="auth-field-error">{errors.username}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && <p className="auth-field-error">{errors.email}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`auth-input${errors.password ? ' auth-input--error' : ''}`}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="auth-field-error">{errors.password}</p>}
              {/* Strength checklist */}
              <div className="auth-strength">
                {strengthRules.map((rule) => {
                  const met = rule.test(form.password);
                  return (
                    <div key={rule.label} className={`auth-strength__item${met ? ' auth-strength__item--met' : ''}`}>
                      <span className="auth-strength__dot">
                        {met && <span className="auth-strength__check">✓</span>}
                      </span>
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirm_password">Confirm Password</label>
              <div className="auth-input-wrap">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  className={`auth-input${errors.confirm_password ? ' auth-input--error' : ''}`}
                  placeholder="Repeat your password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirm_password && <p className="auth-field-error">{errors.confirm_password}</p>}
            </div>

            {/* ---- Health Questions Section ---- */}
            <div className="signup-wellness-section">
              <hr className="signup-wellness-divider" />
              <h3 className="signup-wellness-heading">Help us understand your wellness needs</h3>
            </div>

            <div className="auth-field">
              <label htmlFor="activity_level">Activity Level</label>
              <div className="auth-select-wrap">
                <select
                  id="activity_level"
                  name="activity_level"
                  className={`auth-select${errors.activity_level ? ' auth-input--error' : ''}`}
                  value={form.activity_level}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select your activity level</option>
                  {ACTIVITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {errors.activity_level && <p className="auth-field-error">{errors.activity_level}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="primary_health_goal">Primary Health Goal</label>
              <div className="auth-select-wrap">
                <select
                  id="primary_health_goal"
                  name="primary_health_goal"
                  className={`auth-select${errors.primary_health_goal ? ' auth-input--error' : ''}`}
                  value={form.primary_health_goal}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select your primary goal</option>
                  {HEALTH_GOAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {errors.primary_health_goal && <p className="auth-field-error">{errors.primary_health_goal}</p>}
            </div>

            <div className="auth-field">
              <label>Do you experience any of the following?</label>
              <div className="signup-concerns-grid">
                {HEALTH_CONCERNS_OPTIONS.map((option) => (
                  <label key={option} className="signup-concern-item">
                    <input
                      type="checkbox"
                      checked={healthConcerns.includes(option)}
                      onChange={() => handleHealthConcernChange(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {errors.health_concerns && <p className="auth-field-error">{errors.health_concerns}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="age_range">Age Range</label>
              <div className="auth-select-wrap">
                <select
                  id="age_range"
                  name="age_range"
                  className={`auth-select${errors.age_range ? ' auth-input--error' : ''}`}
                  value={form.age_range}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select your age range</option>
                  {AGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {errors.age_range && <p className="auth-field-error">{errors.age_range}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="how_heard">How did you hear about us?</label>
              <div className="auth-select-wrap">
                <select
                  id="how_heard"
                  name="how_heard"
                  className={`auth-select${errors.how_heard ? ' auth-input--error' : ''}`}
                  value={form.how_heard}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select an option</option>
                  {HOW_HEARD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {errors.how_heard && <p className="auth-field-error">{errors.how_heard}</p>}
            </div>

            {/* ---- Terms ---- */}
            <div className="auth-checkbox">
              <input
                type="checkbox"
                id="terms_accepted"
                name="terms_accepted"
                checked={form.terms_accepted}
                onChange={handleChange}
              />
              <label htmlFor="terms_accepted">
                By signing up I agree to the <a href="#terms">Terms and Conditions</a>
              </label>
            </div>
            {errors.terms_accepted && <p className="auth-field-error" style={{ marginTop: '-16px', marginBottom: '16px' }}>{errors.terms_accepted}</p>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating Account…' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-or">or sign up with</div>
          <div className="auth-social">
            <button className="auth-social__btn" aria-label="Sign up with Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </button>
            <button className="auth-social__btn" aria-label="Sign up with Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </button>
            <button className="auth-social__btn" aria-label="Sign up with Gmail">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </button>
          </div>

          <p className="auth-footer-text">
            Already a member? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
