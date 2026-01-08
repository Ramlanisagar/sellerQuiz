import React, { useEffect, useState } from 'react';
import API from '../api';

export default function ManagerDashboard() {
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    API.get('/quizzes/manager')
      .then(res => setQuizzes(res.data))
      .catch(err => console.error(err));
  }, []);

  const downloadResults = (quizId, quizTitle) => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/quizzes/${quizId}/results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${quizTitle.replace(/[^a-z0-9]/gi, '_')}_Results.xlsx`;
        a.click();
        a.remove();
      })
      .catch(() => alert('No results to download yet'));
  };

  // Calculate unique students and total attempts per quiz
  const getQuizStats = (quizId) => {
    // This data comes from backend route /quizzes/manager which already includes totalAttempts
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return { totalAttempts: 0, uniqueStudents: 0 };

    // We need to fetch full attempts to count unique students
    // Since we don't have it here, we'll use a placeholder or fetch separately
    // For now, assume backend sends uniqueStudents too — we'll fix backend in next step

    return {
      totalAttempts: quiz.totalAttempts || 0,
      uniqueStudents: quiz.uniqueStudents || 0  // Will be added in backend
    };
  };

  if (quizzes.length === 0) {
    return (
      <div className="text-center mt-5 py-5">
        <h3>No active quizzes available</h3>
      </div>
    );
  }

  // Special case: Only 1 quiz → center it big
  if (quizzes.length === 1) {
    const quiz = quizzes[0];
    const stats = getQuizStats(quiz.id);

    return (
      <div className="container mt-5">
        <h1 className="text-center mb-5">Manager Dashboard</h1>

        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="card shadow-lg h-100">
              <div className="card-body text-center p-5">
                <h3 className="card-title mb-4">{quiz.title}</h3>
                <p className="text-muted mb-5">
                  <strong>{quiz.questionsCount}</strong> Questions
                </p>

                <div className="row mb-5">
                  <div className="col-6">
                    <p className="text-muted small mb-1">Total Attempts</p>
                    <h2 className="text-primary">{stats.totalAttempts}</h2>
                  </div>
                  <div className="col-6">
                    <p className="text-muted small mb-1">Unique Students</p>
                    <h2 className="text-success">{stats.uniqueStudents}</h2>
                  </div>
                </div>

                <button 
                  className="btn btn-success btn-lg px-5 py-3"
                  onClick={() => downloadResults(quiz.id, quiz.title)}
                >
                  📊 Download Results (Excel)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple quizzes — normal grid
  return (
    <div>
      <h1 className="text-center mb-5">Manager Dashboard</h1>

      <div className="row">
        {quizzes.map(quiz => {
          const stats = getQuizStats(quiz.id);

          return (
            <div key={quiz.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h4 className="card-title">{quiz.title}</h4>
                  <p className="text-muted">
                    {quiz.questionsCount} Questions
                  </p>

                  <div className="row mb-4 text-center">
                    <div className="col-6">
                      <p className="text-muted small mb-1">Total Attempts</p>
                      <h4 className="text-primary mb-0">{stats.totalAttempts}</h4>
                    </div>
                    <div className="col-6">
                      <p className="text-muted small mb-1">Unique Students</p>
                      <h4 className="text-success mb-0">{stats.uniqueStudents}</h4>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button 
                      className="btn btn-success w-100"
                      onClick={() => downloadResults(quiz.id, quiz.title)}
                    >
                      📊 Download Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}