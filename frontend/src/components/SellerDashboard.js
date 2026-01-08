import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { generateCertificate } from './certificate';

export default function SellerDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState({});

  // Use sellerId if available (from seller login), fallback to username for backward compatibility
  const sellerId = localStorage.getItem('sellerId');
  const username = localStorage.getItem('username') || 'Seller';
  const displayName = sellerId ? sellerId.toUpperCase() : username;
const [remainingTime, setRemainingTime] = useState(null);
const [progress, setProgress] = useState(100);
const activeQuiz = quizzes[0];
useEffect(() => {
  if (!activeQuiz) return;

  const limit = getRemainingAttempts(activeQuiz.id);
  if (!limit.blocked) return;

  const totalMs = 24 * 60 * 60 * 1000; // 24 hours
  const endTime = new Date(limit.blockUntil).getTime();

  const interval = setInterval(() => {
    const now = Date.now();
    const diff = endTime - now;

    if (diff <= 0) {
      clearInterval(interval);
      setRemainingTime(null);
      setProgress(0);
      return;
    }

    const hrs = Math.floor(diff / (60 * 60000));
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    setRemainingTime(
      `${String(hrs).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
    );

    setProgress((diff / totalMs) * 100);
  }, 1000);

  return () => clearInterval(interval);
}, [activeQuiz, attempts]);

  useEffect(() => {
    async function fetchData() {
      try {
        const quizzesRes = await API.get('/quizzes');
        setQuizzes(quizzesRes.data);

        // Fetch attempts - backend should return attempts based on sellerId or username
        const attemptsRes = await API.get('/attempts');
        setAttempts(attemptsRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    }
    fetchData();
  }, []);

  // Safe way to get attempts for a quiz (supports both old object and new array format)
  const getQuizAttempts = (quizId) => {
    const quizData = attempts[quizId];
    if (!quizData) return [];

    if (Array.isArray(quizData)) {
      return quizData;
    }

    // Handle legacy single-object format
    if (typeof quizData === 'object' && quizData !== null) {
      return [{
        score: quizData.score,
        passed: quizData.passed,
        timestamp: quizData.timestamp || new Date().toISOString(),
        date: quizData.date || new Date().toLocaleDateString(),
        time: quizData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attemptNumber: 1
      }];
    }

    return [];
  };

  const latestAttempt = (quizId) => {
    const allAttempts = getQuizAttempts(quizId);
    if (allAttempts.length === 0) return null;
    return allAttempts[allAttempts.length - 1];
  };

  const getRemainingAttempts = (quizId) => {
    const allAttempts = getQuizAttempts(quizId);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentAttempts = allAttempts.filter(a => {
      const attemptTime = new Date(a.timestamp);
      return attemptTime > twentyFourHoursAgo;
    });

    if (recentAttempts.length >= 3) {
      const oldestRecentTimestamp = Math.min(...recentAttempts.map(a => new Date(a.timestamp).getTime()));
      const blockUntil = new Date(oldestRecentTimestamp + 24 * 60 * 60 * 1000);
      return { blocked: true, blockUntil };
    }

    return { blocked: false, remaining: 3 - recentAttempts.length };
  };

 // first quiz (same behavior as old)
const quizAttempts = activeQuiz
  ? getQuizAttempts(activeQuiz.id)
  : [];

const totalAttempts = quizAttempts.length;
const bestScore = quizAttempts.length
  ? Math.max(...quizAttempts.map(a => a.score))
  : 0;

const avgScore = quizAttempts.length
  ? Math.round(
      quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length
    )
  : 0;


return (
  <>
 <div className="page">
      {/* HEADER */}
      <header className="header">
        <img
          className="logo"
          src="amazon-logo-login.png"
          alt="amazon"
        />
        <div className="welcome">Welcome, <b>{displayName}</b> 👋</div>
        <div className="header-actions">
          
          <button
  className="logout-btn"
  onClick={() => {
    localStorage.clear();
    window.location.href = '/seller-login';
  }}
>
  Logout
</button>

        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <h1>
            Master the <span>Amazon Selling!</span>
          </h1>
          <p>Amazon Seller Learning & Rewards Platform</p>

          <div className="stake">Take the quiz to test your knowledge and unlock credits worth 1 LAKH</div>
        </div>
           <img
    src="/hero-asset.png"
    alt="Amazon Seller Quiz"
    className="hero-image"
  />

<div className="hero-right">

  <div
    className="score-circle"
    style={{
      background: `conic-gradient(
        #f59e0b ${
          activeQuiz && latestAttempt(activeQuiz.id)
            ? latestAttempt(activeQuiz.id).score
            : 0
        }%,
        #e5e7eb 0
      )`
    }}
  >
    <div className="score-inner">
      <div className="score">
        {activeQuiz && latestAttempt(activeQuiz.id)
          ? `${latestAttempt(activeQuiz.id).score}%`
          : '--'}
      </div>
      <span>Last Score</span>
    </div>
  </div>
</div>
      </section>

      {/* MAIN GRID */}
      <div className="grid">
        {/* LEFT */}
        <div className="card">
          <h4 style={{ display: 'flex', justifyContent: 'center' }} >Learning Videos</h4>

<div className="video-card">
  <div className="thumb" />
  <div className="video-info">
    <b>Product Listing Optimization</b>

  </div>
</div>


<div className="video-card">
  <div className="thumb" />
  <div className="video-info">
    <b>Product Listing Optimization</b>

  </div>
</div>
<div className="video-card">
  <div className="thumb" />
  <div className="video-info">
    <b>Product Listing Optimization</b>

  </div>
</div>
        
        </div>

        {/* CENTER */}
        <div className="card center">
          <h3> {activeQuiz?.title || '—'}</h3>
          <div className="divider" />
          {activeQuiz && (() => {
  const limit = getRemainingAttempts(activeQuiz.id);
  const latest = latestAttempt(activeQuiz.id);

  if (!latest?.passed && !limit.blocked) {
    return (
      <Link to={`/quiz/${activeQuiz.id}`}
      style={{ textDecoration: 'none' }}>
        <button className="start">
          {latest ? 'RE-ATTEMPT QUIZ' : 'START QUIZ'}
        </button>
      </Link>
    );
  }

  if (latest?.passed) {
    return (
      <button
        className="start"
        // onClick={() =>
        //   generateCertificate({
        //     username: displayName,
        //     quizTitle: activeQuiz.title,
        //     score: latest.score,
        //     date: latest.date
        //   })
        // }
      >
        Congratulations! You Passed 🎉
      </button>
    );
  }

  return null;
})()}

          {activeQuiz && (() => {
  const limit = getRemainingAttempts(activeQuiz.id);
  return limit.blocked ? (
    <p style={{ color: '#b12704' }}>
      Daily limit reached
    </p>
  ) : (
    <p>Attempts Remaining Today: {limit.remaining} / 3</p>
  );
})()}

          <div className="divider" />
          {/* <img src="quiz-logo.png" alt="Quiz Logo" className="quiz-image" /> */}
          {/* <div className="rules">
            <div>⏱ 15 Min Time Limit.</div>
            <div>🏆 Pass with 60%.</div>
            <div>🔁 Daily Max of 3 Attempts.</div>
          </div> */}
          {/* <div className="divider" /> */}
          {activeQuiz && (() => {
  const limit = getRemainingAttempts(activeQuiz.id);
  if (!limit.blocked || !remainingTime) return null;

  return (
    <div className="timer">
      🔒 Try again after {remainingTime} at{' '}        <b>
          {limit.blockUntil.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
                day: '2-digit',
              month: 'short',
              year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </b>
      
    <div className="timer-bar">
        <div
          className="timer-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
    
  );
})()}

        </div>

        {/* RIGHT */}
        <div className="right-column">

  {/* Quiz Performance Box */}
  <div className="card mini-card">
    <h3 className="muted-title" style={{ display: 'flex', justifyContent: 'center' }}>Quiz Performance</h3>

    <div className="table">
      <div style={{
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #e6e6e6",
    fontSize: "14px"
  }}>
        <span>Total Attempts</span>
        <b>{totalAttempts}</b>
      </div>
      <div style={{
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #e6e6e6",
    fontSize: "14px"
  }}>
        <span>Best Score</span>
        <b className="orange">{bestScore}%</b>
      </div>
      <div style={{
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #e6e6e6",
    fontSize: "14px"
  }}>
        <span>Average Score</span>
        <b>{avgScore}%</b>
      </div>
    </div>
  </div>

  {/* Attempt History Box */}
  <div className="card mini-card">
    <h3 className="muted-title" style={{ display: 'flex', justifyContent: 'center' }}>Attempt History</h3>

<div className="table">
  {quizAttempts.slice(0, 3).map((a, i) => {
    const status =
      a.score == null
        ? 'Pending'
        : a.passed
        ? 'Pass'
        : 'Try Again';

    const statusColor =
      status === 'Pass'
        ? '#067d62'
        : status === 'Try Again'
        ? '#b12704'
        : '#f59e0b';

    return (
      <div
        key={i}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 0',
          borderBottom: '1px solid #e6e6e6',
          fontSize: '14px'
        }}
      >
        <span>Attempt {i + 1}</span>

        <b>
          {a.score != null ? `${a.score}%` : '—'}
        </b>

        <span
          style={{
            fontWeight: 600,
            color: statusColor
          }}
        >
          {status}
        </span>
      </div>
    );
  })}
</div>

  </div>
</div>
      </div>
      {/* FOOTER */}
      <footer className="pp-footer">
        🎁 Score (≥60%) and complete minimum 4 videos (verified) to unlock credits worth up to ₹1 lakh
      </footer>
    </div> </>
  );
}