import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

export default function QuizForm() {
  const { id } = useParams(); // If id exists → Edit mode
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [quesToShow, setquesToShow] = useState('');
  const [passpercentage, setpasspercentage] = useState('');
  const [questions, setQuestions] = useState([
    {
      section: '',
      text: '',
      type: 'single_select',
      options: '',
      correct: ''
    }
  ]);
  const [isEdit, setIsEdit] = useState(false);

  /* =========================
     FETCH QUIZ (EDIT MODE)
     ========================= */
  useEffect(() => {
    if (id) {
      setIsEdit(true);
      API.get(`/quizzes/${id}`).then(res => {
        const quiz = res.data;
        setTitle(quiz.title);
        setquesToShow(quiz.questionsToShow);
        setpasspercentage(quiz.passpercentage);
        setQuestions(
          quiz.questions.map(q => ({
            section: q.section || '',
            text: q.text,
            type: q.type,
            options: q.options ? q.options.join('; ') : '',
            correct: Array.isArray(q.correct)
              ? q.correct.join('; ')
              : q.correct
          }))
        );
      });
    }
  }, [id]);

  /* =========================
     QUESTION HANDLERS
     ========================= */
  const addQuestion = () => {
    const lastSection = questions[questions.length - 1]?.section || '';
    setQuestions([
      ...questions,
      {
        section: lastSection,
        text: '',
        type: 'single_select',
        options: '',
        correct: ''
      }
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  /* =========================
     SUBMIT QUIZ
     ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedQuestions = questions.map(q => ({
      section: q.section.trim(),
      text: q.text.trim(),
      type: q.type,
      options: q.options
        ? q.options.split(';').map(o => o.trim()).filter(Boolean)
        : [],
      correct:
        q.type === 'multi_select'
          ? q.correct.split(';').map(c => c.trim()).filter(Boolean)
          : q.correct.trim()
    }));

    if (isEdit) {
      await API.put(`/quizzes/${id}`, {
        title,
        questionsToShow: Number(quesToShow),
        passpercentage: Number(passpercentage),
        questions: formattedQuestions
      });
      alert('Quiz updated successfully!');
    } else {
      await API.post('/quizzes', {
        title,
        questionsToShow: Number(quesToShow),
        passpercentage: Number(passpercentage),
        questions: formattedQuestions
      });
      alert('Quiz created successfully!');
    }

    navigate('/'); // Back to Admin Dashboard
  };

  return (
    <>
      {/* ================= TOP BAR ================= */}
      <div className="asc-topbar">
        <div className="asc-topbar-inner">

          <div className="asc-topbar-left">
            <img src="/image.png" alt="Amazon Seller Central" className="asc-logo" />
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
                window.location.href = '/login';
              }}
            >
              Logout
            </button>
          </div>

        </div>
      </div>

      {/* ================= PAGE ================= */}
      <div className="asc-page">
        <form onSubmit={handleSubmit}>
          <div className="asc-card">

            <div className="asc-card-header">
              {isEdit ? 'Edit Quiz' : 'Create New Quiz'}
            </div>

            <div className="asc-card-body">

              {/* QUIZ TITLE */}
              <div style={{ marginBottom: 20 }}>
                <label className="asc-snap-title">Quiz title</label>
                <input
                  className="asc-search"
                  style={{ marginTop: 6, width: '100%' }}
                  placeholder="Enter quiz title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* QUestions To Show */}
              <div style={{ marginBottom: 20 }}>
                <label className="asc-snap-title">Questions to Show Seller</label>
                <input
                  className="asc-search"
                  style={{ marginTop: 6, width: '100%' }}
                  placeholder="Enter number of questions to show to seller"
                  value={quesToShow}
                  onChange={e => setquesToShow(e.target.value)}
                  required
                />
              </div>

              {/* Passing percentage */}
              <div style={{ marginBottom: 20 }}>
                <label className="asc-snap-title">Passing Percentage</label>
                <input
                  className="asc-search"
                  style={{ marginTop: 6, width: '100%' }}
                  placeholder="Enter passing percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={passpercentage}
                  onChange={e => setpasspercentage(e.target.value)}
                />
                <p style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                  Minimum score required to pass and get certificate.<br />
                  Default: 60% if not set.
                </p>
              </div>

              {/* QUESTIONS */}
              <h3 style={{ fontSize: 14, marginBottom: 12 }}>Questions</h3>

              {questions.map((q, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid #d5d9d9',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 16,
                    background: '#fff',
                    position: 'relative'
                  }}
                >

                  {/* SECTION */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="asc-snap-title">Section</label>
                    <input
                      className="asc-search"
                      style={{ marginTop: 6, width: '100%' }}
                      placeholder="e.g. Section A"
                      value={q.section}
                      onChange={e => updateQuestion(i, 'section', e.target.value)}
                      required
                    />
                  </div>

                  {/* QUESTION */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="asc-snap-title">
                      Question {i + 1}
                    </label>
                    <input
                      className="asc-search"
                      style={{ marginTop: 6, width: '100%' }}
                      placeholder="Enter question text"
                      value={q.text}
                      onChange={e => updateQuestion(i, 'text', e.target.value)}
                      required
                    />
                  </div>

                  {/* TYPE */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="asc-snap-title">Type</label>
                    <select
                      className="asc-search"
                      style={{ marginTop: 6, width: '100%' }}
                      value={q.type}
                      onChange={e => updateQuestion(i, 'type', e.target.value)}
                    >
                      <option value="single_select">Single select</option>
                      <option value="multi_select">Multi select</option>
                      <option value="integer">Integer</option>
                      <option value="text">Text</option>
                    </select>
                  </div>

                  {/* OPTIONS */}
                  {(q.type === 'single_select' || q.type === 'multi_select') && (
                    <div style={{ marginBottom: 12 }}>
                      <label className="asc-snap-title">
                        Options (Please separate options with a semicolon ";")
                      </label>
                      <input
                        className="asc-search"
                        style={{ marginTop: 6, width: '100%' }}
                        placeholder="Option A; Option B; Option C"
                        value={q.options}
                        onChange={e => updateQuestion(i, 'options', e.target.value)}
                      />
                    </div>
                  )}

                  {/* CORRECT */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="asc-snap-title">Correct answer</label>
                    <input
                      className="asc-search"
                      style={{ marginTop: 6, width: '100%' }}
                      placeholder={
                        q.type === 'multi_select'
                          ? 'Option A, Option C'
                          : 'Enter correct answer'
                      }
                      value={q.correct}
                      onChange={e => updateQuestion(i, 'correct', e.target.value)}
                      required
                    />
                  </div>

                  {/* DELETE */}
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      title="Delete question"
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'transparent',
                        border: 'none',
                        color: '#b12704',
                        fontSize: 16,
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {/* ACTIONS */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 20
                }}
              >
                <button
                  type="button"
                  className="asc-btn"
                  onClick={addQuestion}
                >
                  + Add question
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="asc-btn"
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="asc-btn"
                    style={{ background: '#067d62' }}
                  >
                    {isEdit ? 'Update quiz' : 'Create quiz'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </>
  );
}
