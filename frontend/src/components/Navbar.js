import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, logout }) {
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/seller-login'); // Redirect to seller login as default
  };

  // Determine display name: Seller ID (uppercase) if seller, else username
  const sellerId = localStorage.getItem('sellerId');
  const displayName = sellerId ? sellerId.toUpperCase() : (user.username || 'User');
  const userRole = user.role || 'unknown';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark shadow-sm" style={{ background: 'linear-gradient(to right, #232F3E, #131A22)' }}>
      <div className="container-fluid">
        {/* Logo + Brand */}
        <Link className="navbar-brand d-flex align-items-center" to="/dashboard">
          <img
            src="/light-on.png"
            alt="QuizMaster Logo"
            width="50"
            height="50"
            className="me-3 rounded"
          />
          <span style={{ fontSize: '1.6rem', fontWeight: '700', color: '#FF9900' }}>
            QuizMaster
          </span>
        </Link>

        {/* Right Side: User Info + Actions */}
        <div className="d-flex align-items-center order-lg-2">
          {/* User Greeting */}
          <div className="text-light me-4 text-center text-lg-start">
            <div className="small text-muted">Welcome back</div>
            <div>
              <strong className="text-warning">{displayName}</strong>
              <span className="ms-2 text-info small">({userRole})</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            className="btn btn-warning text-dark fw-bold px-4 shadow-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* Optional: Dashboard Link (centered on larger screens) */}
        <div className="navbar-collapse collapse order-lg-1 justify-content-center">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link
                className="nav-link text-light fw-medium fs-5"
                to="/dashboard"
              >
                {userRole === 'seller' ? 'Seller Dashboard' :
                 userRole === 'admin' ? 'Admin Panel' :
                 userRole === 'manager' ? 'Manager Dashboard' :
                 'My Dashboard'}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}