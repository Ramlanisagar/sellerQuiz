import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import jsPDF from 'jspdf';
import { useRef } from 'react';


export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(null);
  const [attemptLimitReached, setAttemptLimitReached] = useState(false);
  const [nextAvailableTime, setNextAvailableTime] = useState('');
  // const [currentSection, setCurrentSection] = useState('');
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const startCalledRef = useRef(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [passingMark, setPassingMark] = useState(null);


  // const PASSING_MARK = 60;

  // Determine display name: Seller ID (uppercase) if seller, else username
  const sellerId = localStorage.getItem('sellerId');
  const username = localStorage.getItem('username') || 'User';
  const displayName = sellerId ? sellerId.toUpperCase() : username;

  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    Hour: '2-digit',
    minute: '2-digit'
  });

  const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

useEffect(() => {
  async function fetchQuiz() {
    const res = await API.get(`/quizzes/${id}`);
    setQuiz(res.data);
    setPassingMark(res.data.passpercentage); 
  }
  fetchQuiz();
}, [id]);


  useEffect(() => {
    API.get(`/quizzes/${id}`)
      .then(res => {
                const original = res.data.questions;

                const sectionMap = {};
                original.forEach(q => {
                  const section = q.section || 'General';
                  if (!sectionMap[section]) sectionMap[section] = [];
                  sectionMap[section].push(q);
                });

                // Shuffle inside each section
                const orderedQuestions = [];
                Object.keys(sectionMap).forEach(section => {
                  orderedQuestions.push(...shuffleArray(sectionMap[section]));
                });

                setQuiz({ ...res.data, questions: orderedQuestions });
              })
      .catch(err => console.error('Failed to load quiz:', err));
  }, [id]);

useEffect(() => {
  if (!quiz || startCalledRef.current) return;

  startCalledRef.current = true;

  const startAttempt = async () => {
    try {
      const res = await API.post('/attempts/start', { quizId: id });
      setAttemptId(res.data.attemptId || null);
      setAttemptStarted(true);
    } catch (err) {
      console.error('Failed to start attempt', err);
    }
  };

  startAttempt();
}, [quiz, id]);

useEffect(() => {
  const checkSession = async () => {
    try {
      const res = await API.get(`/attempts/status/${id}`);
      if (res.data.status === 'expired') {
        setSessionExpired(true);
      }
    } catch {}
  };


  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      checkSession();
    }
  };

  document.addEventListener('visibilitychange', onVisibility);
  return () => document.removeEventListener('visibilitychange', onVisibility);
}, [id]);


useEffect(() => {
  const handleAbandon = () => {
    if (!showResult && quiz) {
      const data = JSON.stringify({ quizId: id, token: localStorage.getItem('token') });

      navigator.sendBeacon(
        `${process.env.REACT_APP_API_BASE || ''}/api/attempts/abandon`,
        new Blob([data], { type: 'application/json' })
      );
    }
  };

  window.addEventListener('beforeunload', handleAbandon);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      handleAbandon();
    }
  });

  return () => {
    window.removeEventListener('beforeunload', handleAbandon);
  };
}, [id, quiz, showResult]);

 

  // Check attempt limit after showing result
  useEffect(() => {
    const checkLimit = async () => {
      try {
        const res = await API.get('/attempts');
        const userAttempts = res.data[id] || [];

        const attemptsArray = Array.isArray(userAttempts)
          ? userAttempts
          : (typeof userAttempts === 'object' && userAttempts !== null)
          ? [userAttempts]
          : [];

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recent = attemptsArray.filter(
          a => new Date(a.timestamp || a.date) > twentyFourHoursAgo
        );

        if (recent.length >= 3) {
          const oldestTimestamp = Math.min(
            ...recent.map(a => new Date(a.timestamp || a.date).getTime())
          );
          const next = new Date(oldestTimestamp + 24 * 60 * 60 * 1000);
          setAttemptLimitReached(true);
          setNextAvailableTime(next.toLocaleString());
        }
      } catch (err) {
        console.error('Error checking attempt limit:', err);
      }
    };

    if (showResult && quiz) {
      checkLimit();
    }
  }, [showResult, id, quiz]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];



  const handleChange = (value) => {
    setAnswers({ ...answers, [currentQuestionIndex]: value });
  };

  const handleMultiSelect = (option, checked) => {
    const current = answers[currentQuestionIndex] || [];
    if (checked) {
      setAnswers({ ...answers, [currentQuestionIndex]: [...current, option] });
    } else {
      setAnswers({
        ...answers,
        [currentQuestionIndex]: current.filter(v => v !== option)
      });
    }
  };

  const goNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      const userAns = answers[idx];
      const correctAns = q.correct;

      if (q.type === 'multi_select') {
        const userSorted = (userAns || []).sort();
        const correctSorted = Array.isArray(correctAns)
          ? correctAns.sort()
          : correctAns.split(',').map(c => c.trim()).sort();
        if (JSON.stringify(userSorted) === JSON.stringify(correctSorted)) correct++;
      } else if (String(userAns)?.trim() === String(correctAns)?.trim()) {
        correct++;
      }
    });

    const percentage = quiz.questions.length > 0
      ? (correct / quiz.questions.length) * 100
      : 0;
    return percentage.toFixed(2);
  };

  const submitQuiz = async () => {
  if (Object.keys(answers).length < totalQuestions) {
    // setSubmitClicked(true);
    return;
  } 
   
    attemptsLeft > 0 && setAttemptsLeft(attemptsLeft - 1);
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResult(true);

    try {
      await API.post('/attempts', { quizId: id, score: finalScore,attemptId });
    } catch (err) {
          if (err.response?.status === 410) {
      alert('Your quiz session has expired. Please start again.');
      navigate('/dashboard');
      return;
    }
      console.error('Failed to save attempt:', err);
      // Optionally show user feedback
    }
  };

  const generateCertificate = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Golden border
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(4);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');
    doc.setLineWidth(2);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');

    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 215, 0);
    doc.text('Certificate of Achievement', pageWidth / 2, 45, { align: 'center' });

    doc.setFontSize(90);
    doc.text('Trophy', pageWidth / 2, 85, { align: 'center' });

    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', pageWidth / 2, 110, { align: 'center' });

    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 100, 200);
    doc.text(displayName, pageWidth / 2, 130, { align: 'center' });

    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('has successfully completed the quiz', pageWidth / 2, 150, { align: 'center' });
    doc.text(`"${quiz.title}"`, pageWidth / 2, 165, { align: 'center' });
    doc.text(`with an outstanding score of ${score}%`, pageWidth / 2, 180, { align: 'center' });

    doc.setFontSize(18);
    doc.text(`Date: ${currentDate}`, pageWidth / 2, 205, { align: 'center' });

    doc.setFontSize(16);
    doc.text('_________________________', pageWidth / 2, 230, { align: 'center' });
    doc.text('Quiz Administrator', pageWidth / 2, 240, { align: 'center' });

    const fileName = `Certificate_${displayName}_${quiz.title.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const reattemptQuiz = async () => {
    await API.post('/attempts/start', { quizId: id });
    setAnswers({});
    setCurrentQuestionIndex(0);
    setScore(null);
    setShowResult(false);
    setAttemptLimitReached(false);
  };

  const attemptedCount = Object.keys(answers).length;
  const totalQuestions = quiz?.questions.length || 0;

if (sessionExpired) {
  return (
    <>
      <div className="quiz-page">

        {/* TOP HEADER (SAME AS QUIZ) */}
        <div className="quiz-header">
          <img
            src="/amazon-logo-dark.png"
            alt="amazon"
            className="quiz-logo"
          />

          <div className="quiz-title">
            Welcome, <b>{displayName}</b> 👋
          </div>

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

        {/* SESSION EXPIRED CONTENT */}
        <div className="quiz-layout" style={{ gridTemplateColumns: '1fr' }}>
          <div
            className="quiz-card"
            style={{
              maxWidth: 520,
              margin: '80px auto',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: 48,
                marginBottom: 12
              }}
            >
              ⏱️
            </div>

            <h2 style={{ marginBottom: 10 }}>
              Session expired
            </h2>

            <p style={{ color: '#555', marginBottom: 24 }}>
              Your quiz session has expired due to inactivity.
              <br />
              Please re-attempt the Quiz.
            </p>

            <button
              className="btn primary"
              onClick={() => navigate('/dashboard')}
            >
              Back to dashboard
            </button>
          </div>
        </div>

      </div>
    </>
  );
}



  if (!quiz) {
    return (
      <div className="text-center mt-5">
        <h3>Loading quiz...</h3>
      </div>
    );
  }

if(showResult) {
  const passed = parseFloat(score) >= Number(passingMark);


  return (
  <>
    <div className="quiz-page">

      {/* TOP HEADER (DARK GRADIENT LIKE DASHBOARD) */}
      <div className="quiz-header">
        <img
          src="/amazon-logo-dark.png"
          alt="amazon"
          className="quiz-logo"
        />

        <div className="quiz-title">
          Welcome, <b>{displayName}</b> 👋
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
      </div>

      {/* RESULT CONTENT */}
      <div className="quiz-layout" style={{ gridTemplateColumns: '1fr' }}>
        <div className="quiz-card" style={{ textAlign: 'center' }}>

          <h2 style={{ marginBottom: 12 }}>
            {passed
              ? '🎉 Congratulations! You’ve passed'
              : 'You didn’t pass this attempt'}
          </h2>

          <p style={{ fontSize: 16, marginBottom: 12 }}>
            Score: <strong>{score}%</strong>
          </p>

          {passed && !attemptLimitReached && (
            <p style={{ color: '#067d62', marginBottom: 16 }}>
              To claim credits, please complete a minimum of 4 videos in this learning path. If you have already completed the required videos, you will receive an email with the steps to avail the credits.
            </p>
          )}

          {!passed && !attemptLimitReached && (
            <p style={{ color: '#b12704', marginBottom: 16 }}>
              You have <strong>{attemptsLeft}</strong> attempt(s) remaining.
              <br />
              We recommend revisiting the learning path videos before retrying.
            </p>
          )}

          {!passed && attemptLimitReached && (
            <p style={{ color: '#b12704', fontWeight: 600, marginBottom: 16 }}>
              You’ve used all 3 attempts for today.
              <br />
              You can retake this Quiz after
              <br />
              <strong>{nextAvailableTime}</strong>
            </p>
          )}

          {/* ACTION BUTTONS */}
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            {/* {passed && (
              <button
                className="btn submit"
                onClick={generateCertificate}
              >
                Download Certificate
              </button>
            )} */}

            {!passed && !attemptLimitReached && (
              <button
                className="btn primary"
                onClick={reattemptQuiz}
              >
                Re-attempt Assessment
              </button>
            )}

            <button
              className="btn secondary"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>

        </div>
      </div>
    </div>
  </>
);

}

  // Quiz Taking Interface
return (
  <>
    <div className="quiz-page">

      {/* TOP HEADER (DARK GRADIENT LIKE DASHBOARD) */}
      <div className="quiz-header">
        <img
          src="/amazon-logo-dark.png"
          alt="amazon"
          className="quiz-logo"
        />

        <div className="quiz-title">
          Welcome, <b>{displayName}</b> 👋
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* <div className="quiz-timer">
            ⏱ {timeRemaining}
          </div> */}

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
      </div>

      {/* QUIZ TITLE + PROGRESS (LIGHT GRADIENT BOX) */}
      <div className="quiz-header-card">
        <h2 style={{ display: 'flex', justifyContent: 'center' }}>{quiz.title}</h2>

        <div className="quiz-progress">
          <div
            className="quiz-progress-fill"
            style={{
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`
            }}
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="quiz-layout">

        {/* LEFT – QUESTIONS PALETTE */}
        <div className="quiz-palette">
          <h4>Questions</h4>

          <div className="palette-grid">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <button
                key={i}
                className={`palette-item
                  ${i === currentQuestionIndex ? 'active' : ''}
                  ${answers[i] ? 'answered' : ''}
                `}
                onClick={() => setCurrentQuestionIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20, fontSize: 14 }}>
            <b>
              {Object.keys(answers).length.toString().padStart(2, '0')}
            </b>{' '}
            of {totalQuestions.toString().padStart(2, '0')} Answered
          </div>

          <div
            style={{
              marginTop: 8,
              height: 6,
              background: '#eee',
              borderRadius: 6
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(Object.keys(answers).length / totalQuestions) * 100}%`,
                background: '#ff9900',
                borderRadius: 6
              }}
            />
          </div>
        </div>

        {/* RIGHT – QUESTION CARD */}
        <div className="quiz-card">
          <div className="quiz-question">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>

          <div className="quiz-question">
            {currentQuestion.text}
          </div>

          <div className="quiz-options">
            {/* SINGLE SELECT */}
            {currentQuestion.type === 'single_select' &&
              currentQuestion.options.map((opt, idx) => (
                <label key={idx} className="option-card">
                  <input
                    type="radio"
                    checked={answers[currentQuestionIndex] === opt}
                    onChange={() => handleChange(opt)}
                  />
                  {opt}
                </label>
              ))}

            {/* MULTI SELECT */}
            {currentQuestion.type === 'multi_select' &&
              currentQuestion.options.map((opt, idx) => (
                <label key={idx} className="option-card">
                  <input
                    type="checkbox"
                    checked={(answers[currentQuestionIndex] || []).includes(opt)}
                    onChange={(e) =>
                      handleMultiSelect(opt, e.target.checked)
                    }
                  />
                  {opt}
                </label>
              ))}

            {/* TEXT / INTEGER */}
            {['text', 'integer'].includes(currentQuestion.type) && (
              <textarea
                className="quiz-textarea"
                placeholder="Enter your answer"
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => handleChange(e.target.value)}
              />
            )}
          </div>
          {showSubmitWarning && (
            <div className="quiz-modal-overlay">
              <div className="quiz-modal">
                <h3>Incomplete Submission</h3>

                <p>
                  Please attempt <strong>all questions</strong> before submitting
                  the assessment.
                </p>

                <button
                  className="btn primary"
                  onClick={() => setShowSubmitWarning(false)}
                >
                  OK, Continue Quiz
                </button>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="quiz-actions">
            <button
              className="btn secondary"
              disabled={currentQuestionIndex === 0}
              onClick={goPrev}
            >
              Previous
            </button>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <button
                  className="btn submit"
                  onClick={() => {
                    if (Object.keys(answers).length < totalQuestions) {
                      setShowSubmitWarning(true);
                    } else {
                      submitQuiz();
                    }
                  }}
                >
                  Submit
                </button>

            ) : (
              <button
                className="btn primary"
                onClick={goNext}
              >
                Next →
              </button>
            )}


          </div>
        </div>
      </div>
    </div>
  </>
);

}
