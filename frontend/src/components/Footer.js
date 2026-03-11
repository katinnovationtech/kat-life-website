import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState(null); 
  const [subMessage, setSubMessage] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setSubStatus('error');
      setSubMessage('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setSubStatus('error');
      setSubMessage('Please enter a valid email address.');
      return;
    }

    setSubStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSubStatus('success');
        setSubMessage(data.message);
        setEmail('');
      } else {
        setSubStatus('error');
        setSubMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setSubStatus('error');
      setSubMessage('Network error. Please try again.');
    }
  };

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <Link to="/shop" className="footer__logo">
            <span className="footer__logo-kat">KAT</span>
            <span className="footer__logo-life"> Life</span>
          </Link>
          <p className="footer__tagline">Osteo Support That Activates Your Active Core™</p>

          <div className="footer__social">
            {/* Facebook */}
            <a href="#facebook" className="footer__social-link" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#linkedin" className="footer__social-link" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="#instagram" className="footer__social-link" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            {/* X / Twitter */}
            <a href="#twitter" className="footer__social-link" aria-label="X (Twitter)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">About Us</h4>
          <ul className="footer__col-list">
            <li><Link to="/about">Our Story</Link></li>
            <li><Link to="/about">Our Mission</Link></li>
            <li><Link to="/about">Our Vision</Link></li>
            <li><Link to="/about">Our Founder</Link></li>
            <li><Link to="/about">Our Team</Link></li>
            <li><Link to="/shop">Our Product</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">Customer Care</h4>
          <ul className="footer__col-list">
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/shipping">Shipping &amp; Return</Link></li>
            <li><Link to="/faq">FAQ's</Link></li>
          </ul>
        </div>

        <div className="footer__col footer__col--newsletter">
          <h4 className="footer__col-title">Newsletter</h4>
          <p className="footer__newsletter-desc">Subscribe to our newsletter to stay up to date with the latest from KAT Life.</p>
          <form className="footer__subscribe-form" onSubmit={handleSubscribe} noValidate>
            <div className="footer__subscribe-row">
              <input
                type="email"
                className="footer__subscribe-input"
                placeholder="Your email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSubStatus(null); }}
                disabled={subStatus === 'loading'}
                aria-label="Email for newsletter"
              />
              <button
                type="submit"
                className="footer__subscribe-btn"
                disabled={subStatus === 'loading'}
              >
                {subStatus === 'loading' ? '...' : 'Subscribe'}
              </button>
            </div>
            {subStatus === 'success' && <p className="footer__sub-success">{subMessage}</p>}
            {subStatus === 'error' && <p className="footer__sub-error">{subMessage}</p>}
          </form>
        </div>
      </div>

      <div className="footer__bottom">
        <p className="footer__copy">Copyright &copy;2026 KAT Innovation. All rights reserved.</p>
        <div className="footer__bottom-links">
          <Link to="/privacy">Privacy Policy</Link>
          <span>|</span>
          <Link to="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
