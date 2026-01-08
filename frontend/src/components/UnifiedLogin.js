
import React, { useState } from 'react';
import API from '../api';

export default function UnifiedLogin() {
  const [mode, setMode] = useState('seller'); // seller | admin
  const [sellerId, setSellerId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  // ✅ NEW: handle mode switch properly
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setSellerId('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let payload = {};
      let endpoint = '';

      if (mode === 'seller') {
        const trimmedSellerId = sellerId.trim();

        if (!trimmedSellerId) {
          setError('Seller ID is required');
          return;
        }

        if (trimmedSellerId.length < 12 || trimmedSellerId.length > 16) {
          setError('Seller ID must be between 12 and 16 characters long');
          return;
        }

        if (!/^[a-zA-Z0-9]+$/.test(trimmedSellerId)) {
          setError(
            'Seller ID must contain only letters and numbers (no spaces or special characters)'
          );
          return;
        }

        endpoint = '/seller-login';
        payload = { sellerId: trimmedSellerId.toLowerCase() };
      } else {
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        if (!trimmedUsername || !trimmedPassword) {
          setError('Username and Password cannot be empty');
          return;
        }

        endpoint = '/login';
        payload = {
          username: trimmedUsername,
          password: trimmedPassword
        };
      }

      const res = await API.post(endpoint, payload);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);

      if (res.data.sellerId) {
        localStorage.setItem('sellerId', res.data.sellerId);
      }
      if (res.data.username) {
        localStorage.setItem('username', res.data.username);
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="sc-wrapper">
      <img
        className="sc-logo"
        src="/amazon-seller-central.webp"
        alt="Seller Central"
        style={{ height: 44, width: 220 }}
      />

      <div className="sc-card">
        <div className="sc-title"
          style={{
                fontSize: '24px',
                fontWeight: 400,
                marginBottom: 18
            }}>Sign in</div>

        {/* ROLE SWITCH */}
        <div style={{ display: 'flex', marginBottom: 16 }}>
          <button
            type="button"
            className="sc-secondary-btn"
            style={{
              flex: 1,
              background: mode === 'seller' ? '#e7f3f5' : '#fff'
            }}
            onClick={() => handleModeSwitch('seller')}
          >
            Seller
          </button>

          <button
            type="button"
            className="sc-secondary-btn"
            style={{
              flex: 1,
              background: mode === 'admin' ? '#e7f3f5' : '#fff'
            }}
            onClick={() => handleModeSwitch('admin')}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'seller' && (
            <>
              <div className="sc-label">Seller ID</div>
              <input
                className="sc-input"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
              />
            </>
          )}


          {mode === 'admin' && (
            <>
              <div className="sc-label">Username</div>
              <input
                className="sc-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <div className="sc-label" style={{ marginTop: 12 }}>
                Password
              </div>
              <input
                type="password"
                className="sc-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          )}

          {error && <div className="sc-error">⚠ {error}</div>}

          <button className="sc-primary-btn" type="submit">
            Continue
          </button>
        </form>
            {mode === 'seller' && (
            <button
                type="button"
                className="sc-secondary-btn"
                style={{ marginTop: 14 }}
                onClick={() =>
                window.location.href = 'https://sellercentral.amazon.in/gp/on-board/configuration/single-section/merchant-token.html?ref_=macs_aimertok_cont_acinfohm&mons_sel_mcid=AJ0NXA3GIYH9M&mons_sel_mkid=A21TJRUUN4KGV'
                }
            >
                Register now
            </button>
            )}

        <p style={{ fontSize: 12, marginTop: 14 }}>
          By continuing, you agree to Amazon’s{' '}
          <a href="https://www.amazon.in/gp/help/customer/display.html?nodeId=200545940">
            Conditions of Use
          </a>{' '}
          and{' '}
          <a href="https://www.amazon.in/gp/help/customer/display.html?nodeId=200534380">
            Privacy Notice
          </a>.
        </p>

        {/* HELP DROPDOWN */}
        <div className="sc-help" onClick={() => setOpen(!open)}>
          Need help? ▾
          {open && (
            <div className="sc-help-dropdown">
              <a
                href="https://sellercentral.amazon.in/help/hub/reference/external/login-help"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", padding: "6px 8px" }}
              >
                Seller account issues
              </a>
              <a
                href="https://sellercentral.amazon.in/help/hub/reference/external/sign-in-other-issues"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", padding: "6px 8px" }}
              >
                Other issues with sign-in
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="sc-footer">
        © 2025 Amazon.com, Inc. or its affiliates
      </div>
    </div>
  );
}
