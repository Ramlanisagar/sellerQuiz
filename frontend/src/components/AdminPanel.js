import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

export default function AdminPanel() {
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const res = await API.get('/quizzes/admin');
    const quizzesData = res.data;

    // Get attempt counts
    const attemptsRes = await fetch('/api/attempts/all', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json()).catch(() => ({}));

    const enhanced = quizzesData.map(quiz => {
      let attemptCount = 0;
      Object.values(attemptsRes).forEach(userAttempts => {
        if (userAttempts[quiz.id]) attemptCount++;
      });
      return { ...quiz, attemptCount };
    });

    setQuizzes(enhanced);
  };

  const toggleActive = async (quiz) => {
    const res = await API.put(`/quizzes/${quiz.id}`, { active: !quiz.active });
    setQuizzes(quizzes.map(q => q.id === quiz.id ? { ...res.data, attemptCount: quiz.attemptCount } : q));
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm('Delete this quiz permanently?')) return;
    await API.delete(`/quizzes/${id}`);
    setQuizzes(quizzes.filter(q => q.id !== id));
  };

  const downloadResults = (quizId, quizTitle) => {
    const token = localStorage.getItem('token');
    fetch(`/api/quizzes/${quizId}/results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quizTitle.replace(/[^a-z0-9]/gi, '_')}_Results.xlsx`;
      a.click();
      a.remove();
    })
    .catch(() => alert('No results yet'));
  };

  return (
<>
  {/* AMAZON SELLER CENTRAL TOP BAR */}
  <div className="asc-topbar">
  <div className="asc-topbar-inner">

    {/* LEFT BLOCK */}
    <div className="asc-topbar-left">
      <img
        src="/image.png"
        alt="Amazon Seller Central"
        className="asc-logo"
      />

        <span
          style={{
            background: '#fff',
            color: '#0f2a2e',
            fontSize: 12,
            padding: '3px 8px',
            borderRadius: 2,
            fontWeight: 600
          }}
        >
          ADMIN | IN
        </span>
    </div>

    {/* RIGHT BLOCK */}
    <div className="asc-topbar-right">
      <span>EN</span>
              <span
          style={{ cursor: 'pointer' }}
          onClick={() =>
            window.location.href =
              'https://sellercentral.amazon.in/help/hub/reference/external/login-help'
          }
        >
          Help
        </span>
              <button
          className="asc-logout"
          onClick={() => {
            localStorage.clear();
            window.location.href = '/Admin';
          }}
        >
          Logout
        </button>
    </div>

  </div>
</div>


  {/* PAGE */}
  <div className="asc-page">

    {/* SNAPSHOT */}
    <div className="asc-card">
      <div className="asc-card-body">
        <div className="asc-snapshot">
          <div>
            <div className="asc-snap-title">Total Quizzes</div>
            <div className="asc-snap-value">{quizzes.length}</div>
          </div>
          <div>
            <div className="asc-snap-title">Active Quizzes</div>
            <div className="asc-snap-value">
              {quizzes.filter(q => q.active !== false).length}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* CREATE QUIZ ACTION */}
<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
  <Link
    to="/create-quiz"
    className="asc-btn"
    style={{ textDecoration: 'none' }}
  >
    + Create New Quiz
  </Link>
</div>

    {/* QUIZ LIST */}
    {quizzes.length === 0 ? (
      <div className="asc-card">
        <div className="asc-card-body">
          No quizzes yet. Click “Create New Quiz” to get started.
        </div>
      </div>
    ) : (
      quizzes.map(quiz => (
        <div key={quiz.id} className="asc-card">
          <div className="asc-card-header">{quiz.title}</div>

          <div className="asc-card-body">
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              {quiz.questions.length} Questions
            </div>

            <div style={{ marginBottom: 8 }}>
              <span
                style={{
                  color: quiz.active !== false ? '#067d62' : '#777',
                  fontWeight: 600
                }}
              >
                {quiz.active !== false ? '✓ Active' : '✗ Inactive'}
              </span>
            </div>

            <div style={{ marginBottom: 10 }}>
              Seller Attempted:{' '}
              <strong>{quiz.attemptCount}</strong>
            </div>

            {/* ACTIONS */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                to={`/create-quiz/${quiz.id}`}
                className="asc-btn"
                style={{ textDecoration: 'none' }}
              >
                Edit
              </Link>

              <button
                className="asc-btn"
                onClick={() => toggleActive(quiz)}
              >
                {quiz.active !== false ? 'Deactivate' : 'Activate'}
              </button>

              <button
                className="asc-btn"
                onClick={() => downloadResults(quiz.id, quiz.title)}
              >
                Export as CSV
              </button>

              <button
                className="asc-btn"
                style={{ background: '#b12704' }}
                onClick={() => deleteQuiz(quiz.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))
    )}
  </div>
</>
);
}