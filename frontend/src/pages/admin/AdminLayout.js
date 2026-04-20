import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './AdminLayout.css';
import API_URL from '../../config';

const NAV = [
  { to: '/admin/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/admin/preorders', icon: '🛍', label: 'Pre-Orders' },
  { to: '/admin/inventory', icon: '📦', label: 'Inventory' },
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/newsletter', icon: '✉', label: 'Newsletter' },
  { to: '/admin/messages', icon: '💬', label: 'Messages' },
];

function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('adminUser') || '{}'); } catch { return {}; }
  })();

  const handleLogout = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* Overlay */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-text">KAT <span>Life</span></div>
          <div className="admin-sidebar-logo-sub">Admin Portal</div>
        </div>

        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar">
            {(adminUser.username || 'A')[0].toUpperCase()}
          </div>
          <div className="admin-sidebar-username">{adminUser.username || 'Admin'}</div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <span className="admin-nav-icon">⎋</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <div className="admin-topbar">
          <button className="admin-menu-toggle" onClick={() => setSidebarOpen((v) => !v)}>
            ☰
          </button>
          <div className="admin-topbar-title">{title}</div>
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

export default AdminLayout;
