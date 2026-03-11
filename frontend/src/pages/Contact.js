import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Contact.css';

const CHAR_LIMIT = 500;

function Contact() {
  const [form, setForm] = useState({ full_name: '', contact: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [submitMessage, setSubmitMessage] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required.';
    if (!form.contact.trim()) errs.contact = 'Contact is required.';
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!emailRegex.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!form.message.trim()) {
      errs.message = 'Message is required.';
    } else if (form.message.trim().length > CHAR_LIMIT) {
      errs.message = `Message must not exceed ${CHAR_LIMIT} characters.`;
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus('success');
        setSubmitMessage(data.message);
        setForm({ full_name: '', contact: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please check your connection and try again.');
    }
  };

  const remaining = CHAR_LIMIT - form.message.length;

  return (
    <div className="contact-page">
      <Navbar />

      {/* Hero */}
      <div className="contact-hero">
        <div className="contact-hero__bg" />
        <div className="contact-hero__content">
          <p className="contact-hero__eyebrow">Get in Touch</p>
          <h1 className="contact-hero__heading">Let's Talk Fit</h1>
        </div>
      </div>

      {/* Intro text */}
      <div className="contact-intro">
        <div className="contact-intro__inner">
          <p className="contact-intro__sub">Comfort, confidence, and performance, tailored to you.</p>
          <p className="contact-intro__italic">Sizing, styling, or order questions? We've got you.</p>
        </div>
      </div>

      {/* Form section */}
      <section className="contact-form-section">
        <div className="contact-form-section__inner">
          <div className="contact-form-card">
            <h2 className="contact-form-card__title">Send Us a Message</h2>

            {submitStatus === 'success' && (
              <div className="contact-form__success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <p>{submitMessage}</p>
              </div>
            )}

            {submitStatus !== 'success' && (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="contact-form__group">
                  <label className="contact-form__label" htmlFor="full_name">
                    Full Name <span className="required">** Required</span>
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    className={`contact-form__input${errors.full_name ? ' error' : ''}`}
                    placeholder="Jane Smith"
                    value={form.full_name}
                    onChange={handleChange}
                    disabled={submitStatus === 'loading'}
                  />
                  {errors.full_name && <p className="contact-form__error">{errors.full_name}</p>}
                </div>

                <div className="contact-form__group">
                  <label className="contact-form__label" htmlFor="contact">
                    Contact <span className="required">** Required</span>
                  </label>
                  <input
                    id="contact"
                    name="contact"
                    type="text"
                    className={`contact-form__input${errors.contact ? ' error' : ''}`}
                    placeholder="Phone number or preferred contact"
                    value={form.contact}
                    onChange={handleChange}
                    disabled={submitStatus === 'loading'}
                  />
                  {errors.contact && <p className="contact-form__error">{errors.contact}</p>}
                </div>

                <div className="contact-form__group">
                  <label className="contact-form__label" htmlFor="email">
                    Email <span className="required">** Required</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`contact-form__input${errors.email ? ' error' : ''}`}
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={handleChange}
                    disabled={submitStatus === 'loading'}
                  />
                  {errors.email && <p className="contact-form__error">{errors.email}</p>}
                </div>

                <div className="contact-form__group">
                  <div className="contact-form__label-row">
                    <label className="contact-form__label" htmlFor="message">Message</label>
                    <span className={`contact-form__char-count${remaining < 50 ? ' warning' : ''}`}>
                      {remaining} / {CHAR_LIMIT}
                    </span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    className={`contact-form__textarea${errors.message ? ' error' : ''}`}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    disabled={submitStatus === 'loading'}
                    maxLength={CHAR_LIMIT + 50}
                  />
                  {errors.message && <p className="contact-form__error">{errors.message}</p>}
                </div>

                {submitStatus === 'error' && (
                  <p className="contact-form__submit-error">{submitMessage}</p>
                )}

                <div className="contact-form__footer">
                  <button
                    type="submit"
                    className="contact-form__submit"
                    disabled={submitStatus === 'loading'}
                  >
                    {submitStatus === 'loading' ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Map placeholder */}
          <div className="contact-map">
            <div className="contact-map__placeholder">
              <div className="contact-map__pin">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <p>Google Maps integration</p>
              <p className="contact-map__sub">ABC St. Canada</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact info */}
      <section className="contact-info-section">
        <div className="contact-info-section__inner">
          <div className="contact-info-card">
            <div className="contact-info-item">
              <div className="contact-info-item__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <div>
                <p className="contact-info-item__label">Phone</p>
                <a href="tel:+11234567890" className="contact-info-item__value">+1 123-456-7890</a>
              </div>
            </div>

            <div className="contact-info-divider" />

            <div className="contact-info-item">
              <div className="contact-info-item__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <p className="contact-info-item__label">Email</p>
                <a href="mailto:info@katinnovation.com" className="contact-info-item__value">info@katinnovation.com</a>
              </div>
            </div>

            <div className="contact-info-divider" />

            <div className="contact-info-item">
              <div className="contact-info-item__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <p className="contact-info-item__label">Location</p>
                <p className="contact-info-item__value">ABC St. Canada</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Contact;
