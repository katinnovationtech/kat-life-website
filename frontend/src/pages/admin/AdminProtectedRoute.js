import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import API_URL from '../../config';

function AdminProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setChecking(false);
      return;
    }
    fetch(`${API_URL}/api/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setValid(data.success);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f9fc' }}>
        <div style={{ color: '#1a5f7a', fontSize: '1rem' }}>Verifying access…</div>
      </div>
    );
  }

  return valid ? children : <Navigate to="/admin/login" replace />;
}

export default AdminProtectedRoute;
