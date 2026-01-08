require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const { time, timeStamp } = require('console');

const app = express();
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

const DATA_DIR = process.env.DATA_DIR ? path.join(__dirname, process.env.DATA_DIR) : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'attempts.json');
const SELLERS_FILE = path.join(DATA_DIR, 'sellers.json');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-2025';
const ATTEMPT_SESSION_TIMEOUT_MS = parseInt(process.env.ATTEMPT_SESSION_TIMEOUT_MS) || 15 * 60 * 1000;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Initialize files
if (!fs.existsSync(USERS_FILE)) {
  const initialUsers = {
    admin: {
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin'
    }
  };
  fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
}

if (!fs.existsSync(QUIZZES_FILE)) {
  fs.writeFileSync(QUIZZES_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(ATTEMPTS_FILE)) {
  fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify({}, null, 2));
}

if (!fs.existsSync(SELLERS_FILE)) {
  fs.writeFileSync(SELLERS_FILE, JSON.stringify([], null, 2));
}

const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

const getNowIST = () => {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    date: now.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
};


function formatToIST(timestamp) {
  if (!timestamp) return '';

  return new Date(timestamp).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] ||
    req.body?.token ||
    req.query?.token;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

const isManager = (req, res, next) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Manager only' });
  next();
};

// Helper: Get the correct user identifier (sellerId or username)
const getUserIdentifier = (user) => {
  return user.role === 'seller' ? user.sellerId : user.username;
};

// ================ AUTH ROUTES ================
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  const users = readJSON(USERS_FILE);
  if (users[username]) return res.status(400).json({ error: 'Username taken' });

  users[username] = { password: bcrypt.hashSync(password, 10), role: 'student' };
  writeJSON(USERS_FILE, users);
  res.json({ message: 'Registered' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_FILE);
  const user = users[username];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role, username });
});

// SELLER LOGIN (auto-register if not exists)
app.post('/api/seller-login', (req, res) => {
  const { sellerId } = req.body;

  if (!sellerId ) {
    return res.status(400).json({ error: 'Seller ID is required' });
  }

  let sellers = readJSON(SELLERS_FILE);

  let seller = sellers.find(
    s => s.sellerId.toLowerCase() === sellerId.toLowerCase() 
  );

  if (!seller) {
    seller = {
      sellerId: sellerId.toLowerCase(),
      // username: username.toLowerCase(),
      createdAt: new Date().toISOString()
    };
    sellers.push(seller);
    writeJSON(SELLERS_FILE, sellers);
  }

  const token = jwt.sign(
    { sellerId: seller.sellerId, role: 'seller' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    role: 'seller',
    sellerId: seller.sellerId
  });
});

// ================ QUIZ ROUTES ================
app.get('/api/quizzes', (req, res) => {
  const quizzes = readJSON(QUIZZES_FILE);
  const activeQuizzes = quizzes.filter(q => q.active !== false).map(q => ({ id: q.id, title: q.title }));
  res.json(activeQuizzes);
});

app.get('/api/quizzes/admin', authenticate, isAdmin, (req, res) => {
  const quizzes = readJSON(QUIZZES_FILE);
  res.json(quizzes);
});

app.get('/api/quizzes/manager', authenticate, isManager, (req, res) => {
  const quizzes = readJSON(QUIZZES_FILE);
  const attempts = readJSON(ATTEMPTS_FILE);

  const activeQuizzes = quizzes.filter(q => q.active !== false).map(quiz => {
    let totalAttempts = 0;
    let uniqueUsers = 0;
    const usersSet = new Set();

    Object.keys(attempts).forEach(userId => {
      if (attempts[userId][quiz.id]) {
        const quizAttempts = Array.isArray(attempts[userId][quiz.id])
          ? attempts[userId][quiz.id]
          : [attempts[userId][quiz.id]];
        totalAttempts += quizAttempts.length;
        usersSet.add(userId);
      }
    });

    uniqueUsers = usersSet.size;

    return {
      id: quiz.id,
      title: quiz.title,
      questionsCount: quiz.questions.length,
      totalAttempts,
      uniqueUsers
    };
  });

  res.json(activeQuizzes);
});

app.get('/api/quizzes/:id', authenticate, (req, res) => {
  const quizzes = readJSON(QUIZZES_FILE);
  const quiz = quizzes.find(q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && quiz.active === false) return res.status(403).json({ error: 'Inactive quiz' });
  if (req.user.role === 'admin') {
    return res.json(quiz);
  }
  if (req.user.role === 'student' || req.user.role === 'seller') {
    let shuffledQuestions = [...quiz.questions].sort(() => Math.random() - 0.5).slice(0, quiz.questionsToShow || 10);
     // Shuffle options inside each question
  shuffledQuestions = shuffledQuestions.map(q => {
    if (Array.isArray(q.options)) {
      return {
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5)
      };
    }
    return q;
  });
    res.json({ ...quiz, questions: shuffledQuestions });
  } else {
    res.json(quiz);
  }
});

app.post('/api/quizzes', authenticate, isAdmin, (req, res) => {
  const { title,questionsToShow, passpercentage, questions } = req.body;
  const quizzes = readJSON(QUIZZES_FILE);
  const newQuiz = { id: Date.now().toString(), title,questionsToShow, passpercentage, questions, active: true };
  quizzes.push(newQuiz);
  writeJSON(QUIZZES_FILE, quizzes);
  res.json(newQuiz);
});

app.put('/api/quizzes/:id', authenticate, isAdmin, (req, res) => {
  const { title,questionsToShow, passpercentage, questions, active } = req.body;
  const quizzes = readJSON(QUIZZES_FILE);
  const index = quizzes.findIndex(q => q.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  if (title) quizzes[index].title = title;
  if (questionsToShow !== undefined) quizzes[index].questionsToShow = questionsToShow;
  if (passpercentage !== undefined) quizzes[index].passpercentage = passpercentage;
  if (questions) quizzes[index].questions = questions;
  if (active !== undefined) quizzes[index].active = active;

  writeJSON(QUIZZES_FILE, quizzes);
  res.json(quizzes[index]);
});

app.delete('/api/quizzes/:id', authenticate, isAdmin, (req, res) => {
  const quizzes = readJSON(QUIZZES_FILE);
  const index = quizzes.findIndex(q => q.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  quizzes.splice(index, 1);
  writeJSON(QUIZZES_FILE, quizzes);
  res.json({ message: 'Deleted' });
});

// ================ ATTEMPTS ROUTES (NOW SUPPORT SELLERS) ================

// GET attempts for current user (student or seller)
app.get('/api/attempts', authenticate, (req, res) => {
  if (req.user.role !== 'student' && req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Students and Sellers only' });
  }

  const userId = getUserIdentifier(req.user);
  const attempts = readJSON(ATTEMPTS_FILE);

  res.json(attempts[userId] || {});
});


// START attempt immediately when quiz opens
app.post('/api/attempts/start', authenticate, (req, res) => {
  if (req.user.role !== 'student' && req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Students and Sellers only' });
  }

  const { quizId } = req.body;
  if (!quizId) return res.status(400).json({ error: 'Quiz ID required' });

  const userId = getUserIdentifier(req.user);
  const attempts = readJSON(ATTEMPTS_FILE);

  if (!attempts[userId]) attempts[userId] = {};
  if (!attempts[userId][quizId]) attempts[userId][quizId] = [];

  const quizAttempts = attempts[userId][quizId];
  // Auto-expire old in-progress attempts
  quizAttempts.forEach(a => {
    if (
      a.status === 'in-progress' &&
      a.startedAt &&
      Date.now() - new Date(a.startedAt).getTime() > ATTEMPT_SESSION_TIMEOUT_MS
    ) {
      a.status = 'completed';
      a.abandoned = true;
      a.passed = false;
      a.score = 0;
    }
  });


  // Do NOT create multiple in-progress attempts
  // const hasActive = quizAttempts.some(a => a.status === 'in-progress');
  // if (hasActive) {
  //   return res.json({ message: 'Attempt already in progress' });
  // }

  const now = getNowIST();

  const newAttempt = {
    score: 0,
    passed: false,
    status: 'in-progress',
    abandoned: false,
    startedAt: now.timestamp,
    timestamp: now.timestamp,
    date: now.date,
    time: now.time,
    attemptNumber: quizAttempts.length + 1
  };

  quizAttempts.push(newAttempt);
  attempts[userId][quizId] = quizAttempts;
  writeJSON(ATTEMPTS_FILE, attempts);

  res.json({
    message: 'Attempt started',
    attemptId: quizAttempts.length
  });
});

app.post('/api/attempts/abandon', authenticate, (req, res) => {
  const { quizId } = req.body;
  if (!quizId) return res.status(400).json({ error: 'quizId required' });

  const userId = getUserIdentifier(req.user);
  const attempts = readJSON(ATTEMPTS_FILE);

  const quizAttempts = attempts[userId]?.[quizId];
  if (!quizAttempts) return res.json({ message: 'No attempt found' });

  const active = quizAttempts.find(a => a.status === 'in-progress');
  if (!active) return res.json({ message: 'No active attempt' });

  active.status = 'completed';
  active.abandoned = true;
  active.passed = false;
  active.score = 0;

  writeJSON(ATTEMPTS_FILE, attempts);

  res.json({ message: 'Attempt abandoned' });
});

// POST new attempt (student or seller)
app.post('/api/attempts', authenticate, (req, res) => {
  if (req.user.role !== 'student' && req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Students and Sellers only' });
  }

  const { quizId, score } = req.body;
  if (!quizId || score === undefined) return res.status(400).json({ error: 'Missing fields' });

  const userId = getUserIdentifier(req.user);
  const attempts = readJSON(ATTEMPTS_FILE);

  // Initialize user attempts
  if (!attempts[userId]) attempts[userId] = {};
  if (!attempts[userId][quizId]) attempts[userId][quizId] = [];

  const quizAttempts = attempts[userId][quizId];

  // Convert legacy single object to array
  if (!Array.isArray(quizAttempts) && typeof quizAttempts === 'object' && quizAttempts !== null) {
    quizAttempts = [{
      score: quizAttempts.score,
      passed: quizAttempts.passed,
      timestamp: quizAttempts.timestamp || new Date().toISOString(),
      date: quizAttempts.date || new Date().toLocaleDateString(),
      time: quizAttempts.time || new Date().toLocaleTimeString(),
      attemptNumber: 1
    }];
    attempts[userId][quizId] = quizAttempts;
  }

  if (!Array.isArray(quizAttempts)) quizAttempts = [];

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentAttempts = quizAttempts.filter(attempt => {
    const attemptTime = new Date(attempt.timestamp || attempt.date);
    return attemptTime > twentyFourHoursAgo;
  });

  if (recentAttempts.length >= 3) {
    const oldestRecentTimestamp = Math.min(...recentAttempts.map(a => new Date(a.timestamp || a.date).getTime()));
    const blockUntil = new Date(oldestRecentTimestamp + 24 * 60 * 60 * 1000);

    return res.status(429).json({
      error: 'Attempt limit reached',
      message: 'You have used all 3 attempts in the last 24 hours.',
      blockedUntil: blockUntil.toLocaleString()
    });
  }

  // const newAttempt = {
  //   score: parseFloat(score),
  //   passed: score >= 60,
  //   status: 'completed',
  //   abandoned: false,
  //   timestamp: now.toISOString(),
  //   date: now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
  //   time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  //   attemptNumber: quizAttempts.length + 1
  // };

  
  const active = quizAttempts.find(a => a.status === 'in-progress');

    if (!active) {
    return res.status(400).json({
      error: 'No active attempt found'
    });
  }

   if (
    active.startedAt &&
    Date.now() - new Date(active.startedAt).getTime() > ATTEMPT_SESSION_TIMEOUT_MS
  ) {
    active.status = 'expired';
    active.abandoned = true;
    active.passed = false;
    active.score = 0;
    active.timestamp = now.toISOString();

    writeJSON(ATTEMPTS_FILE, attempts);

    return res.status(410).json({
      error: 'Session expired',
      message: 'Your quiz session has expired. Please start again.'
    });
  }

  // 🔹 Normal successful submit
  active.status = 'completed';
  active.abandoned = false;
  active.score = parseFloat(score);
  active.passed = active.score >= 60;
  active.timestamp = now.toISOString();
  active.date = now.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  active.time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  writeJSON(ATTEMPTS_FILE, attempts);

  return res.json({
    message: 'Attempt recorded',
    attempt: active
  });
});


app.get('/api/attempts/status/:quizId', authenticate, (req, res) => {
  const { quizId } = req.params;
  const userId = getUserIdentifier(req.user);
  const attempts = readJSON(ATTEMPTS_FILE);

  const quizAttempts = attempts[userId]?.[quizId];
  if (!quizAttempts) {
    return res.json({ status: 'none' });
  }

  const arr = Array.isArray(quizAttempts) ? quizAttempts : [quizAttempts];
  const active = arr.find(a => a.status === 'in-progress');

  if (!active) {
    return res.json({ status: 'expired' });
  }

  if (
    active.startedAt &&
    Date.now() - new Date(active.startedAt).getTime() > ATTEMPT_SESSION_TIMEOUT_MS
  ) {
    return res.json({ status: 'expired' });
  }

  res.json({ status: 'active' });
});


// ================ EXCEL RESULTS DOWNLOAD (SHOWS SELLER ID CORRECTLY) ================
app.get('/api/quizzes/:id/results', authenticate, (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Admin or Manager only' });
  }
  next();
}, async (req, res) => {
  const quizId = req.params.id;
  const quizzes = readJSON(QUIZZES_FILE);
  const quiz = quizzes.find(q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  const attempts = readJSON(ATTEMPTS_FILE);
  const results = [];

  for (const [userId, userAttempts] of Object.entries(attempts)) {
    const quizAttempts = userAttempts[quizId];
    if (!quizAttempts) continue;

    const isSeller = attempts[userId] && userId.length <= 15 && userId.length >= 12 && /^[a-z0-9]+$/.test(userId); // heuristic: sellers use lowercase alphanumeric IDs

    const displayId = isSeller ? userId.toUpperCase() : userId;

    if (Array.isArray(quizAttempts)) {
      quizAttempts.forEach((attempt, index) => {
        results.push({
          userId: displayId,
          type: isSeller ? 'Seller' : 'Student',
          attemptNumber: index + 1,
          score: attempt.score,
          status: attempt.passed ? 'Pass' : 'Fail',
          timestamp: formatToIST(attempt.timestamp || new Date().toISOString()),
          date: attempt.date || 'Unknown',
          time: attempt.time || ''
        });
      });
    } else if (typeof quizAttempts === 'object' && quizAttempts !== null) {
      results.push({
        userId: displayId,
        type: isSeller ? 'Seller' : 'Student',
        attemptNumber: 1,
        score: quizAttempts.score,
        status: quizAttempts.passed ? 'Pass' : 'Fail',
        timestamp: formatToIST(quizAttempts.timestamp || new Date().toISOString()),
        date: quizAttempts.date || 'Unknown',
        time: quizAttempts.time || ''
      });
    }
  }

  results.sort((a, b) => new Date(b.date) - new Date(a.date));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('All Attempts');

  worksheet.columns = [
    { header: 'MCID', key: 'userId', width: 25 },
    { header: 'Attempt #', key: 'attemptNumber', width: 12 },
    { header: 'Score (%)', key: 'score', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Timestamp', key: 'timestamp', width: 20 },
  ];

  results.forEach(row => worksheet.addRow(row));

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F3E' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${quiz.title.replace(/[^a-z0-9]/gi, '_')}_Results.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

// Admin only: Get all raw attempts
app.get('/api/attempts/all', authenticate, isAdmin, (req, res) => {
  const attempts = readJSON(ATTEMPTS_FILE);
  res.json(attempts);
});

// ================= SESSION AUTO-EXPIRY WORKER =================

// Runs every 1 minute to auto-expire abandoned quiz attempts
function startSessionExpiryWorker() {
  return setInterval(() => {
    try {
      const attempts = readJSON(ATTEMPTS_FILE);
      const now = Date.now();
      let changed = false;

      Object.values(attempts).forEach(userAttempts => {
        Object.values(userAttempts).forEach(quizAttempts => {

          if (!Array.isArray(quizAttempts)) {
            quizAttempts = [quizAttempts];
          }
          quizAttempts.forEach(attempt => {
            if (
              attempt.status === 'in-progress' &&
              attempt.startedAt &&
              now - new Date(attempt.startedAt).getTime() > ATTEMPT_SESSION_TIMEOUT_MS
            ) {
              attempt.status = 'expired';
              attempt.abandoned = true;
              attempt.passed = false;
              attempt.score = 0;
              attempt.expiredAt = new Date().toISOString();
              changed = true;
            }
          });
        });
      });

      if (changed) {
        writeJSON(ATTEMPTS_FILE, attempts);
        console.log('Expired abandoned quiz sessions');
      }
    } catch (err) {
      console.error('Session expiry job failed:', err);
    }
  }, 60 * 1000); // every 1 minute
}


// If the file is run directly (node server.js), start the worker and listen.
// When loaded by serverless platforms (e.g. Vercel), export a handler instead
// and do not start background timers.
if (require.main === module) {
  // standalone mode
  startSessionExpiryWorker();
  const PORT = process.env.PORT || 5000;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT} (${NODE_ENV} mode)`));
} else {
  // serverless mode (e.g. Vercel) - export request handler
  module.exports = (req, res) => app(req, res);
}