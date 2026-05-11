import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartCount, updateCartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  }, [location]);

  // Refresh cart count whenever the page changes
  useEffect(() => {
    updateCartCount();
  }, [location, updateCartCount]);

  const toggleMenu = () => {
    setMenuOpen((prev) => {
      document.body.style.overflow = !prev ? 'hidden' : '';
      return !prev;
    });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="navbar__inner">
          {/* Logo */}
          {/* Logo */}
          <Link to="/shop" className="navbar__logo">
            <img src="/images/KatLifeLogo.png" alt="KAT LIFE Logo" />
          </Link>

          {/* Center nav links */}
          <ul className="navbar__links">
            <li><Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link></li>
            <li><Link to="/about" className={isActive('/about') ? 'active' : ''}>About</Link></li>
            <li><Link to="/shop" className={isActive('/shop') ? 'active' : ''}>Shop</Link></li>
            <li><Link to="/contact" className={isActive('/contact') ? 'active' : ''}>Contact</Link></li>
            <li><Link to="/login" className={isActive('/login') ? 'active' : ''}>Sign In</Link></li>
          </ul>

          {/* Right icons */}
          <div className="navbar__actions">
            <button className="navbar__icon-btn" aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            <button
              className="navbar__icon-btn navbar__cart-btn"
              aria-label="Shopping bag"
              onClick={() => navigate('/cart')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {cartCount > 0 && (
                <span className="navbar__cart-badge">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Hamburger */}
            <button className="navbar__hamburger" onClick={toggleMenu} aria-label="Toggle menu" aria-expanded={menuOpen}>
              <span className={`hamburger-line${menuOpen ? ' open' : ''}`}></span>
              <span className={`hamburger-line${menuOpen ? ' open' : ''}`}></span>
              <span className={`hamburger-line${menuOpen ? ' open' : ''}`}></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      <div className={`mobile-menu${menuOpen ? ' mobile-menu--open' : ''}`}>
        <button className="mobile-menu__close" onClick={toggleMenu} aria-label="Close menu">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <nav className="mobile-menu__nav">
          <Link to="/" className="mobile-menu__link">Home</Link>
          <Link to="/about" className="mobile-menu__link">About</Link>
          <Link to="/shop" className="mobile-menu__link">Shop</Link>
          <Link to="/contact" className="mobile-menu__link">Contact</Link>
          <Link to="/cart" className="mobile-menu__link">
            Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </Link>
          <Link to="/login" className="mobile-menu__link">Sign In</Link>
        </nav>
      </div>
    </>
  );
}

export default Navbar;
