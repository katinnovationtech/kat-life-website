import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Auth.css';
import API_URL from '../config';

const PRODUCTS = ['OSTAYA™ Wellness Skorts', 'OSTAYA™ Wellness Shorts', 'Both'];
const COLORS = ['White', 'Black', 'Grey', 'Royal Blue', 'Navy Blue'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COUNTRIES = [
  'Canada',
  'United States',
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
  'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana',
  'Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon',
  'Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica',
  'Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic',
  'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
  'Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada',
  'Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India',
  'Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
  'Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya',
  'Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali',
  'Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco',
  'Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands',
  'New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman',
  'Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines',
  'Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia',
  'Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia',
  'Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands',
  'Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname',
  'Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo',
  'Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','Uruguay','Uzbekistan','Vanuatu','Vatican City',
  'Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

function PreorderGuest() {
  const { state } = useLocation();
  const { updateCartCount } = useCart();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    country: 'Canada',
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
    if (!form.city.trim()) e.city = 'City is required.';
    if (!form.country) e.country = 'Please select a country.';
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
      const session_id = localStorage.getItem('cartSessionId');
      const res = await fetch(`${API_URL}/api/preorder/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, session_id }),
      });
      const data = await res.json();
      if (data.success) {
        updateCartCount();
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
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className={`auth-input${errors.city ? ' auth-input--error' : ''}`}
                    placeholder="Enter your city"
                    value={form.city}
                    onChange={handleChange}
                  />
                  {errors.city && <p className="auth-field-error">{errors.city}</p>}
                </div>

                <div className="auth-field">
                  <label htmlFor="country">Country</label>
                  <div className="auth-select-wrap">
                    <select
                      id="country"
                      name="country"
                      className={`auth-select${errors.country ? ' auth-input--error' : ''}`}
                      value={form.country}
                      onChange={handleChange}
                    >
                      <option value="">Select a country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {errors.country && <p className="auth-field-error">{errors.country}</p>}
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
