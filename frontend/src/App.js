import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import API from './api';
import Login from './components/Admin';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import StudentDashboard from './components/StudentDashboard';
import SellerDashboard from './components/SellerDashboard'; // New component
import TakeQuiz from './components/TakeQuiz';
import Navbar from './components/Navbar';
import QuizForm from './components/QuizForm';
import ManagerDashboard from './components/ManagerDashboard';
import SellerLogin from './components/SellerLogin';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const sellerId = localStorage.getItem('sellerId');

    if (token && role) {
      setUser({ token, role, username, sellerId });
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    // After logout, redirect to seller login as default
    window.location.href = '/seller-login';
  };

  // Determine which dashboard to show based on role
  const getDashboard = () => {
    if (!user) return <Navigate to="/seller-login" replace />;

    switch (user.role) {
      case 'admin':
        return <AdminPanel />;
      case 'manager':
        return <ManagerDashboard />;
      case 'seller':
        return <SellerDashboard />;
      case 'student':
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <Router>

      {user && user.role === 'student' &&  (
    <Navbar user={user} logout={logout} />
      )}
        <Routes>
          
          

          {/* Default route: Seller Login */}
          <Route path="/" element={<Navigate to="/seller-login" replace />} />
          
          {/* Seller Login - Main entry point */}
          <Route path="/seller-login" element={user ? <Navigate to="/dashboard" replace /> : <SellerLogin />} />

          {/* Separate Student/Admin Login */}
          <Route path="/Admin" element={user ? <Navigate to="/dashboard" replace /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register setUser={setUser} />} />

          {/* Unified Dashboard Route */}
          <Route path="/dashboard" element={getDashboard()} />

          {/* Take Quiz - Allowed for both students and sellers */}
          <Route
            path="/quiz/:id"
            element={
              user && (user.role === 'student' || user.role === 'seller')
                ? <TakeQuiz />
                : <Navigate to="/seller-login" replace />
            }
          />

          {/* Admin Only Routes */}
          <Route
            path="/create-quiz"
            element={user?.role === 'admin' ? <QuizForm /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/create-quiz/:id"
            element={user?.role === 'admin' ? <QuizForm /> : <Navigate to="/dashboard" replace />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/seller-login" replace />} />
        </Routes>
      {/* </div> */}
    </Router>
  );
}

export default App;