import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Auth.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Canada', 'United States',
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
  'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Central African Republic', 'Chad',
  'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Brazzaville)',
  'Congo (Democratic Republic)', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
  'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
  'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay',
  'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
  'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'Uruguay',
  'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe',
];

const AGE_OPTIONS = [
  { value: 'under_25', label: 'Under 25' },
  { value: '25_34', label: '25 - 34' },
  { value: '35_44', label: '35 - 44' },
  { value: '45_54', label: '45 - 54' },
  { value: '55_plus', label: '55 and above' },
];

const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const PRIMARY_GOAL_OPTIONS = [
  { value: 'bone_health_support', label: 'Bone Health Support' },
  { value: 'hip_lower_back', label: 'Hip and Lower Back Comfort' },
  { value: 'posture_mobility', label: 'Posture and Mobility' },
  { value: 'weight_management', label: 'Weight Management' },
  { value: 'active_aging', label: 'Active Aging' },
  { value: 'general_wellness', label: 'General Wellness' },
];

const HOW_HEARD_OPTIONS = [
  { value: 'social_media', label: 'Social Media' },
  { value: 'online_search', label: 'Online Search' },
  { value: 'friend_family', label: 'Friend or Family' },
  { value: 'healthcare', label: 'Healthcare Professional' },
  { value: 'event', label: 'Event' },
  { value: 'media', label: 'Media / Article' },
  { value: 'other', label: 'Other' },
];

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (light exercise 1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately Active (moderate exercise 3-5 days/week)' },
  { value: 'very_active', label: 'Very Active (hard exercise 6-7 days/week)' },
];

const MAIN_CONCERNS_OPTIONS = [
  'Lower Back Discomfort',
  'Hip Discomfort',
  'Posture',
  'Weight Management',
  'Muscle Fatigue',
  'Bone Health',
  'Back Discomfort',
  'Joint Discomfort',
  'Bone Density Concerns',
];

const FEET_OPTIONS = [3, 4, 5, 6, 7];
const INCHES_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const strengthRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'At least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'At least one number', test: (p) => /[0-9]/.test(p) },
  { label: 'At least one special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// ─── SVG helpers ──────────────────────────────────────────────────────────────

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

function Signup() {
  const navigate = useNavigate();
  const { updateCartCount } = useCart();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [s1, setS1] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    city: '', country: 'Canada',
    password: '', confirm_password: '',
    terms_accepted: false, consent_contacted: false,
  });

  // Step 2 state
  const [s2, setS2] = useState({
    age_range: '', sex: '',
    height_feet: '5', height_inches: '6',
    weight: '', weight_unit: 'lbs',
    primary_goal: '', how_heard: '', activity_level: '',
  });
  const [mainConcerns, setMainConcerns] = useState([]);

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleS1Change = (e) => {
    const { name, value, type, checked } = e.target;
    setS1((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGlobalError('');
  };

  const handleS2Change = (e) => {
    const { name, value } = e.target;
    setS2((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleConcernChange = (option) => {
    setErrors((prev) => ({ ...prev, main_concerns: '' }));
    setMainConcerns((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const e = {};
    if (!s1.first_name.trim()) e.first_name = 'First name is required.';
    if (!s1.last_name.trim()) e.last_name = 'Last name is required.';
    if (!s1.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.email)) {
      e.email = 'Please enter a valid email address.';
    }
    if (!s1.phone.trim()) e.phone = 'Phone number is required.';
    if (!s1.city.trim()) e.city = 'City is required.';
    if (!s1.country) e.country = 'Please select a country.';
    if (!s1.password) {
      e.password = 'Password is required.';
    } else {
      const failed = strengthRules.filter((r) => !r.test(s1.password));
      if (failed.length > 0) e.password = 'Password does not meet all requirements.';
    }
    if (!s1.confirm_password) {
      e.confirm_password = 'Please confirm your password.';
    } else if (s1.password !== s1.confirm_password) {
      e.confirm_password = 'Passwords do not match.';
    }
    if (!s1.terms_accepted) e.terms_accepted = 'You must accept the Terms and Conditions.';
    if (!s1.consent_contacted) e.consent_contacted = 'This consent is required to proceed.';
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (!s2.age_range) e.age_range = 'Please select your age range.';
    if (!s2.sex) e.sex = 'Please select your sex.';
    if (!s2.weight) e.weight = 'Weight is required.';
    if (!s2.primary_goal) e.primary_goal = 'Please select your primary goal.';
    if (!s2.how_heard) e.how_heard = 'Please tell us how you heard about us.';
    if (!s2.activity_level) e.activity_level = 'Please select your activity level.';
    if (mainConcerns.length === 0) e.main_concerns = 'Please select at least one concern.';
    return e;
  };

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const handleContinue = () => {
    const e = validateStep1();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setErrors({});
    setGlobalError('');
    setStep(1);
    window.scrollTo(0, 0);
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validateStep2();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      return;
    }
    setLoading(true);
    setGlobalError('');
    try {
      const session_id = localStorage.getItem('cartSessionId');
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: s1.first_name,
          last_name: s1.last_name,
          email: s1.email,
          phone: s1.phone,
          city: s1.city,
          country: s1.country,
          password: s1.password,
          confirm_password: s1.confirm_password,
          terms_accepted: s1.terms_accepted,
          consent_contacted: s1.consent_contacted,
          age_range: s2.age_range,
          sex: s2.sex,
          height_feet: s2.height_feet,
          height_inches: s2.height_inches,
          weight: s2.weight,
          weight_unit: s2.weight_unit,
          primary_goal: s2.primary_goal,
          how_heard: s2.how_heard,
          activity_level: s2.activity_level,
          main_concerns: mainConcerns,
          session_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        updateCartCount();
        navigate('/verify-email');
      } else {
        if (data.field) {
          const step1Fields = ['first_name', 'last_name', 'email', 'phone', 'city', 'country', 'password', 'confirm_password', 'terms_accepted', 'consent_contacted'];
          if (step1Fields.includes(data.field)) {
            setStep(1);
          }
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

  // ─── Reusable eye button ─────────────────────────────────────────────────────

  const eyeBtn = (show, toggle) => (
    <button type="button" className="auth-eye-btn" onClick={toggle} aria-label={show ? 'Hide password' : 'Show password'}>
      {show ? <EyeClosed /> : <EyeOpen />}
    </button>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

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
          {/* Step indicator */}
          <div className="auth-step-indicator">
            <span className="auth-step-label">Step {step} of 2</span>
            <div className="auth-progress">
              <div className="auth-progress__bar" style={{ width: step === 1 ? '50%' : '100%' }} />
            </div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              <h1 className="auth-title">Create Your Account</h1>
              <p className="auth-subtitle">Be a member to get news, updates from Kat Life</p>

              {globalError && <div className="auth-error-banner">{globalError}</div>}

              <p className="auth-section-heading">Contact Details</p>

              <div className="auth-two-col">
                <div className="auth-field">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    id="first_name" name="first_name" type="text"
                    className={`auth-input${errors.first_name ? ' auth-input--error' : ''}`}
                    placeholder="Enter first name" value={s1.first_name} onChange={handleS1Change}
                    autoComplete="given-name"
                  />
                  {errors.first_name && <p className="auth-field-error">{errors.first_name}</p>}
                </div>
                <div className="auth-field">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    id="last_name" name="last_name" type="text"
                    className={`auth-input${errors.last_name ? ' auth-input--error' : ''}`}
                    placeholder="Enter last name" value={s1.last_name} onChange={handleS1Change}
                    autoComplete="family-name"
                  />
                  {errors.last_name && <p className="auth-field-error">{errors.last_name}</p>}
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email" name="email" type="email"
                  className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
                  placeholder="Enter your email" value={s1.email} onChange={handleS1Change}
                  autoComplete="email"
                />
                {errors.email && <p className="auth-field-error">{errors.email}</p>}
              </div>

              <div className="auth-field">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone" name="phone" type="tel"
                  className={`auth-input${errors.phone ? ' auth-input--error' : ''}`}
                  placeholder="Enter your phone number" value={s1.phone} onChange={handleS1Change}
                  autoComplete="tel"
                />
                {errors.phone && <p className="auth-field-error">{errors.phone}</p>}
              </div>

              <div className="auth-two-col">
                <div className="auth-field">
                  <label htmlFor="city">City</label>
                  <input
                    id="city" name="city" type="text"
                    className={`auth-input${errors.city ? ' auth-input--error' : ''}`}
                    placeholder="Enter your city" value={s1.city} onChange={handleS1Change}
                    autoComplete="address-level2"
                  />
                  {errors.city && <p className="auth-field-error">{errors.city}</p>}
                </div>
                <div className="auth-field">
                  <label htmlFor="country">Country</label>
                  <div className="auth-select-wrap">
                    <select
                      id="country" name="country"
                      className={`auth-select${errors.country ? ' auth-input--error' : ''}`}
                      value={s1.country} onChange={handleS1Change}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {errors.country && <p className="auth-field-error">{errors.country}</p>}
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`auth-input${errors.password ? ' auth-input--error' : ''}`}
                    placeholder="Create a password" value={s1.password} onChange={handleS1Change}
                    autoComplete="new-password"
                  />
                  {eyeBtn(showPassword, () => setShowPassword((v) => !v))}
                </div>
                {errors.password && <p className="auth-field-error">{errors.password}</p>}
                <div className="auth-strength">
                  {strengthRules.map((rule) => {
                    const met = rule.test(s1.password);
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
                    id="confirm_password" name="confirm_password"
                    type={showConfirm ? 'text' : 'password'}
                    className={`auth-input${errors.confirm_password ? ' auth-input--error' : ''}`}
                    placeholder="Repeat your password" value={s1.confirm_password} onChange={handleS1Change}
                    autoComplete="new-password"
                  />
                  {eyeBtn(showConfirm, () => setShowConfirm((v) => !v))}
                </div>
                {errors.confirm_password && <p className="auth-field-error">{errors.confirm_password}</p>}
              </div>

              <p className="auth-section-heading">Consent</p>

              <div className="auth-checkbox">
                <input
                  type="checkbox" id="terms_accepted" name="terms_accepted"
                  checked={s1.terms_accepted} onChange={handleS1Change}
                />
                <label htmlFor="terms_accepted">
                  I agree to the <a href="#terms">Terms and Conditions</a>
                </label>
              </div>
              {errors.terms_accepted && (
                <p className="auth-field-error" style={{ marginTop: '-16px', marginBottom: '16px' }}>
                  {errors.terms_accepted}
                </p>
              )}

              <div className="auth-checkbox">
                <input
                  type="checkbox" id="consent_contacted" name="consent_contacted"
                  checked={s1.consent_contacted} onChange={handleS1Change}
                />
                <label htmlFor="consent_contacted">
                  I consent to be contacted by KAT Life about my order and related updates
                </label>
              </div>
              {errors.consent_contacted && (
                <p className="auth-field-error" style={{ marginTop: '-16px', marginBottom: '16px' }}>
                  {errors.consent_contacted}
                </p>
              )}

              <button type="button" className="auth-btn" onClick={handleContinue} style={{ marginTop: '8px' }}>
                Continue to Step 2 →
              </button>

              <div className="auth-or">or sign up with</div>
              <div className="auth-social">
                <button className="auth-social__btn" aria-label="Sign up with Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </button>
                <button className="auth-social__btn" aria-label="Sign up with Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </button>
                <button className="auth-social__btn" aria-label="Sign up with Gmail">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </button>
              </div>

              <p className="auth-footer-text">
                Already a member? <Link to="/login">Login here</Link>
              </p>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <h1 className="auth-title">Your Profile</h1>

              <div className="auth-early-banner">
                🎉 Early Access Program: Get 25% off by completing an extended questionnaire and helping us shape the final product experience.
              </div>

              {globalError && <div className="auth-error-banner">{globalError}</div>}

              <p className="auth-section-heading">Basic Profile</p>

              <div className="auth-field">
                <label htmlFor="age_range">Age Range</label>
                <div className="auth-select-wrap">
                  <select
                    id="age_range" name="age_range"
                    className={`auth-select${errors.age_range ? ' auth-input--error' : ''}`}
                    value={s2.age_range} onChange={handleS2Change}
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
                <label htmlFor="sex">Sex</label>
                <div className="auth-select-wrap">
                  <select
                    id="sex" name="sex"
                    className={`auth-select${errors.sex ? ' auth-input--error' : ''}`}
                    value={s2.sex} onChange={handleS2Change}
                  >
                    <option value="" disabled>Select your sex</option>
                    {SEX_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {errors.sex && <p className="auth-field-error">{errors.sex}</p>}
              </div>

              <div className="auth-field">
                <label>Height</label>
                <div className="auth-height-row">
                  <div className="auth-height-col">
                    <div className="auth-select-wrap">
                      <select
                        name="height_feet" className="auth-select"
                        value={s2.height_feet} onChange={handleS2Change}
                      >
                        {FEET_OPTIONS.map((f) => (
                          <option key={f} value={f}>{f} ft</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="auth-height-col">
                    <div className="auth-select-wrap">
                      <select
                        name="height_inches" className="auth-select"
                        value={s2.height_inches} onChange={handleS2Change}
                      >
                        {INCHES_OPTIONS.map((i) => (
                          <option key={i} value={i}>{i} in</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="weight">Weight</label>
                <div className="auth-weight-wrap">
                  <input
                    id="weight" name="weight" type="number" min="1" max="999"
                    className={`auth-input${errors.weight ? ' auth-input--error' : ''}`}
                    placeholder={`Enter weight in ${s2.weight_unit}`}
                    value={s2.weight} onChange={handleS2Change}
                  />
                  <button
                    type="button"
                    className="auth-unit-toggle"
                    onClick={() => setS2((prev) => ({ ...prev, weight_unit: prev.weight_unit === 'lbs' ? 'kg' : 'lbs' }))}
                  >
                    {s2.weight_unit}
                  </button>
                </div>
                {errors.weight && <p className="auth-field-error">{errors.weight}</p>}
              </div>

              <p className="auth-section-heading">Product</p>

              <div className="auth-field">
                <label htmlFor="primary_goal">Primary Goal</label>
                <div className="auth-select-wrap">
                  <select
                    id="primary_goal" name="primary_goal"
                    className={`auth-select${errors.primary_goal ? ' auth-input--error' : ''}`}
                    value={s2.primary_goal} onChange={handleS2Change}
                  >
                    <option value="" disabled>Select your primary goal</option>
                    {PRIMARY_GOAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {errors.primary_goal && <p className="auth-field-error">{errors.primary_goal}</p>}
              </div>

              <div className="auth-field">
                <label htmlFor="how_heard">How did you hear about us?</label>
                <div className="auth-select-wrap">
                  <select
                    id="how_heard" name="how_heard"
                    className={`auth-select${errors.how_heard ? ' auth-input--error' : ''}`}
                    value={s2.how_heard} onChange={handleS2Change}
                  >
                    <option value="" disabled>Select an option</option>
                    {HOW_HEARD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {errors.how_heard && <p className="auth-field-error">{errors.how_heard}</p>}
              </div>

              <p className="auth-section-heading">Usage and Needs</p>

              <div className="auth-field">
                <label htmlFor="activity_level">Activity Level</label>
                <div className="auth-select-wrap">
                  <select
                    id="activity_level" name="activity_level"
                    className={`auth-select${errors.activity_level ? ' auth-input--error' : ''}`}
                    value={s2.activity_level} onChange={handleS2Change}
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
                <label>Main Concerns</label>
                <div className="signup-concerns-grid">
                  {MAIN_CONCERNS_OPTIONS.map((option) => (
                    <label key={option} className="signup-concern-item">
                      <input
                        type="checkbox"
                        checked={mainConcerns.includes(option)}
                        onChange={() => handleConcernChange(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                {errors.main_concerns && <p className="auth-field-error">{errors.main_concerns}</p>}
              </div>

              <div className="auth-step2-actions">
                <button type="button" className="auth-back-link" onClick={handleBack}>
                  ← Back to Step 1
                </button>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Creating Account…' : 'Complete Sign Up'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Signup;
