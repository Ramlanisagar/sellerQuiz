import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  //const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await API.post('/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', res.data.username);
      window.location.href = '/'; // Force reload to update user state
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
<div className="sc-wrapper">
  <img
    className="sc-logo"
    src="/amazon-logo.png"
    alt="Seller Central"
    height="32"
  />

  <div className="sc-card">
    <div className="sc-title">Sign in</div>

    <form onSubmit={handleSubmit}>
      <div>
        <div className="sc-label">Username</div>
        <input
          type="text"
          className={`sc-input ${error ? 'error' : ''}`}
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="sc-label">Password</div>
        <input
          type="password"
          className={`sc-input ${error ? 'error' : ''}`}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <div className="sc-error">⚠ {error}</div>}

      <button className="sc-primary-btn" type="submit">
        Sign In
      </button>
    </form>

    <p style={{ fontSize: 12, marginTop: 14 }}>
      By continuing, you agree to Amazon's{" "}
          <a href="https://www.amazon.in/gp/help/customer/display.html/ref=ap_desktop_footer_cou?ie=UTF8&nodeId=200545940">Conditions of Use</a> and{" "}
          <a href="https://www.amazon.in/gp/help/customer/display.html/ref=ap_desktop_footer_privacy_notice?ie=UTF8&nodeId=200534380">Privacy Notice</a>.
        </p>

    <button
      className="sc-secondary-btn"
      style={{ marginTop: 16 }}
      onClick={() => window.location.href = "/login"}
      type="button"
    >
      Cancel
    </button>

    <div className="sc-help">Need help? ▾</div>
  </div>

  {/* <div className="sc-divider">New to Amazon?</div>

  <button
    className="sc-secondary-btn"
    style={{ width: 360 }}
    onClick={() =>
      window.location.href =
        "https://sellercentral.amazon.in/ap/signin"
    }
    type="button"
  >
    Create your seller account
  </button> */}

  <div className="sc-footer">
    <a>Conditions of Use</a> · <a>Privacy Notice</a> · <a>Help</a>
    <br />© 2025 Amazon.com, Inc. or its affiliates
  </div>
</div>
  );
}
// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import API from '../api';

// export default function Login({ setUser }) {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const submit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await API.post('/login', { username, password });
//       localStorage.setItem('token', res.data.token);
//       localStorage.setItem('role', res.data.role);
//       localStorage.setItem('username', res.data.username);
//       setUser(res.data);
//       navigate('/');
//     } catch (err) {
//       setError(err.response?.data?.error || 'Error');
//     }
//   };

//   return (
//     <div className="row justify-content-center">
//       <div className="col-md-5">
//         <h2>Login</h2>
//         {error && <div className="alert alert-danger">{error}</div>}
//         <form onSubmit={submit}>
//           <input className="form-control mb-3" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
//           <input type="password" className="form-control mb-3" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
//           <button className="btn btn-primary w-100">Login</button>
//         </form>
//         <p className="mt-3">Admin: admin / admin123</p>
//         <Link to="/register">Register as student</Link>
//       </div>
//     </div>
//   );
// }