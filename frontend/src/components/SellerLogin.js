import React, { useState } from 'react';

import API from '../api';


export default function SellerLogin() {
  const [sellerId, setSellerId] = useState('');
  // const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Trim whitespace from inputs
    const trimmedSellerId = sellerId.trim();
    // const trimmedUsername = username.trim();

    if (!trimmedSellerId) {
      setError('Merchant Token ID is required');
      return;
    }

    // if (!trimmedUsername) {
    //   setError('Username is required');
    //   return;
    // }

    // Check length: 12 to 16 characters
    if (trimmedSellerId.length < 12 || trimmedSellerId.length > 15) {
      setError('Please enter a valid Merchant Token ID');
      return;
    }

    // Check alphanumeric only
    if (!/^[a-zA-Z0-9]+$/.test(trimmedSellerId)) {
      setError('Please enter a valid Merchant Token ID');
      return;
    }

    // Convert to lowercase for case-insensitive storage
    const lowerSellerId = trimmedSellerId.toLowerCase();
    // const lowerUsername = trimmedUsername.toLowerCase();

    try {
      const res = await API.post('/seller-login', {
        sellerId: lowerSellerId,
        // username: lowerUsername,
      });

      // Save authentication data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      // localStorage.setItem('username', res.data.username);
      localStorage.setItem('sellerId', res.data.sellerId);

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
  <div className="sc-wrapper">

    {/* LOGO */}
    <img
      className="sc-logo"
      src="/amazon-logo-login.png"
      alt="Seller Central"
    />

    {/* TWO COLUMN CONTAINER */}
    <div
      style={{
        display: 'flex',
        gap: 32,
        marginTop: 24,
        alignItems: 'flex-start'
      }}
    >

      {/* LEFT – SIGN IN CARD */}
      <div className="sc-card">
        <div
          className="sc-title"
          style={{ fontSize: 24, fontWeight: 400, marginBottom: 18 }}
        >
          Sign in
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <div className="sc-label">Merchant Token ID</div>
            <input
              className={`sc-input ${error ? 'error' : ''}`}
              value={sellerId}
              onChange={e => setSellerId(e.target.value)}
            />
          </div>

          {error && <div className="sc-error">⚠ {error}</div>}

          <button className="sc-primary-btn" type="submit">
            Continue
          </button>
        </form>

        <p style={{ fontSize: 12, marginTop: 14 }}>
          By continuing, you agree to Amazon&apos;s{' '}
          <a
            href="https://www.amazon.in/gp/help/customer/display.html?nodeId=200545940"
            target="_blank"
            rel="noreferrer"
          >
            Conditions of Use
          </a>{' '}
          and{' '}
          <a
            href="https://www.amazon.in/gp/help/customer/display.html?nodeId=200534380"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Notice
          </a>.
        </p>

        <button
          className="sc-secondary-btn"
          style={{ marginTop: 12, marginBottom: 16 }}
          onClick={() =>
            window.location.href =
              'https://sellercentral.amazon.in/sw/AccountInfo/MerchantToken/step/MerchantToken'
          }
        >
          Find Your Merchant Token ID
        </button>

        {/* HELP */}
        <div className="sc-help" onClick={() => setOpen(!open)}>
          Need help? ▾
          {open && (
            <div className="sc-help-dropdown">
              <a
                href="https://sellercentral.amazon.in/help/hub/reference/external/login-help"
                target="_blank"
                rel="noreferrer"
              >
                Seller account issues
              </a>
              <a
                href="https://sellercentral.amazon.in/help/hub/reference/external/sign-in-other-issues"
                target="_blank"
                rel="noreferrer"
              >
                Other issues with sign-in
              </a>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT – ASSESSMENT GUIDELINES */}
      <div className="sc-card">
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 16,
            marginLeft: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          📋 Quiz Guidelines
        </div>

        <ul class="guidelines-list"> 
          
          <li><b>🚫 Fair use:</b> Attempts may be restricted or results voided for misuse or abnormal activity.</li>
          <li><b>🔁 Attempts:</b> Up to 3 attempts per 24 hours. If you reach the limit, try again after the cooldown resets.</li>
          <li><b>🎯 Passing Criteria:</b> You must score 60% or higher to pass.</li>
          <li><b>🔒 Session:</b> Session expires on inactivity</li>
          <li><b>🏆 Certificate/Credits: </b>  Issued only after passing the quiz with minimum 60% score and completing a minimum of 4 videos in the learning-path video are verified.</li>
        </ul>

        <p style={{ fontSize: 12, color: '#555', marginTop: 16 }}>
          These rules apply to all assessments in the Amazon Seller Learning
          Program.
        </p>
      </div>
    </div>

    {/* FOOTER */}
    <div className="sc-footer">
      © 1996-2025 Amazon.com, Inc. or its affiliates
    </div>
  </div>
);

}