import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserLogin() {
  const navigate = useNavigate();

  const [sellerId, setSellerId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const validateSellerId = (id) => {
    const regex = /^[a-zA-Z0-9]{12,16}$/;
    return regex.test(id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!sellerId || !name) {
      setError('All fields are required.');
      return;
    }

    if (!validateSellerId(sellerId)) {
      setError('Seller ID must be alphanumeric and 12–16 characters long.');
      return;
    }

    // Store user details (used later in quiz & certificate)
    localStorage.setItem('sellerId', sellerId);
    localStorage.setItem('username', name);

    // Redirect to Student Dashboard
    navigate('/student-dashboard');
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow border-0">
            <div className="card-body p-5">
              <h3 className="text-center mb-4 fw-bold">
                Start Quiz
              </h3>

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Seller ID</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter Seller ID"
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                  />

                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Name</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100"
                >
                  Start Quiz
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
