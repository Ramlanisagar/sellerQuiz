import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { generateCertificate } from './certificate';

const username = localStorage.getItem('username') || 'Student';
export default function StudentDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState({});

  useEffect(() => {
    async function fetchData() {
      const quizzesRes = await API.get('/quizzes');
      setQuizzes(quizzesRes.data);

      const attemptsRes = await API.get('/attempts');
      setAttempts(attemptsRes.data);
    }
    fetchData();
  }, []);

  // Safe way to get attempts for a quiz (handles old object and new array)
  const getQuizAttempts = (quizId) => {
    const quizData = attempts[quizId];
    if (!quizData) return [];

    if (Array.isArray(quizData)) {
      return quizData;
    }

    // Old format: single object → convert to array
    if (typeof quizData === 'object' && quizData !== null) {
      return [{
        score: quizData.score,
        passed: quizData.passed,
        timestamp: quizData.timestamp || new Date().toISOString(),
        date: quizData.date || 'Unknown',
        time: quizData.time || '',
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
      const oldestRecent = new Date(Math.max(...recentAttempts.map(a => new Date(a.timestamp))));
      const blockUntil = new Date(oldestRecent.getTime() + 24 * 60 * 60 * 1000);
      return { blocked: true, blockUntil };
    }

    return { blocked: false, remaining: 3 - recentAttempts.length };
  };

  return (
    <div className="container">
      <h1 className="text-center mb-5">Welcome to QuizMaster</h1>

      <div className="row justify-content-center">
        {quizzes.length === 0 ? (
          <div className="col-12 text-center"><p>No active quizzes available.</p></div>
        ) : (
          quizzes.map(q => {
            const allAttempts = getQuizAttempts(q.id);
            const latest = latestAttempt(q.id);
            const limitInfo = getRemainingAttempts(q.id);

            return (
              <div key={q.id} className="col-12 col-md-6 col-lg-4 mb-4">
                <div className="card shadow-sm mx-auto" style={{ maxWidth: '420px' }}>
                  <div className="card-body d-flex flex-column">
                    <h4 className="card-title">{q.title}</h4>

                    {latest ? (
                      <div className="mb-3">
                        <span className={`badge ${latest.passed ? 'bg-success' : 'bg-danger'} fs-6`}>
                          Latest: {latest.score}% • {latest.passed ? 'Passed' : 'Failed'}
                        </span>
                        <p className="text-muted small mt-2">
                          Total Attempts: <strong>{allAttempts.length}</strong>
                        </p>
                      </div>
                    ) : (
                      <span className="badge bg-secondary mb-3">Not Attempted</span>
                    )}

                    {/* Attempt Limit Info */}
                    {limitInfo.blocked ? (
                      <div className="alert alert-warning py-2 small">
                        <strong>Attempt limit reached (3/3)</strong><br />
                        Next attempt available: <strong>{limitInfo.blockUntil.toLocaleString()}</strong>
                      </div>
                    ) : (
                      <p className="text-success mb-2">
                        Attempts remaining today: <strong>{limitInfo.remaining}/3</strong>
                      </p>
                    )}
                    <div className="mt-auto">
                      {latest?.passed ? (
                        <button
                          className="btn btn-success w-100"
                          onClick={() =>
                            generateCertificate({
                              username,
                              quizTitle: q.title,
                              score: latest.score,
                              date: latest.date || new Date().toLocaleDateString()
                            })
                          }
                        >
                          🎓 Download Certificate
                        </button>
                      ) : limitInfo.blocked ? (
                        <button className="btn btn-secondary w-100" disabled>
                          Blocked for 24 hours
                        </button>
                      ) : (
                        <Link to={`/quiz/${q.id}`} className="btn btn-primary w-100">
                          {allAttempts.length === 0 ? 'Start Quiz' : 'Re-attempt Quiz'}
                        </Link>
                      )}
                    </div>
{/* 
                    <div className="mt-auto">
                      {limitInfo.blocked ? (
                        <button className="btn btn-secondary w-100" disabled>
                          Blocked for 24 hours
                        </button>
                      ) : (
                        <Link to={`/quiz/${q.id}`} className="btn btn-primary w-100">
                          {allAttempts.length === 0 ? 'Start Quiz' : 'Re-attempt Quiz'}
                        </Link>
                      )}
                    </div> */}

                    {/* History */}
                    {allAttempts.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-muted small cursor-pointer">
                          View History ({allAttempts.length})
                        </summary>
                        <ul className="list-group list-group-flush mt-2">
                          {allAttempts.slice().reverse().map((attempt, idx) => (
                            <li key={idx} className="list-group-item py-2 small">
                              Attempt {attempt.attemptNumber}: {attempt.score}% 
                              {' '}• <strong>{attempt.passed ? 'Pass' : 'Fail'}</strong>
                              <br />
                              <small className="text-muted">{attempt.date} at {attempt.time}</small>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}