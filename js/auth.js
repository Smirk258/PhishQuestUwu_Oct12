// Authentication Module for PhishQuest
// Works with login.php, Register.php, save-progress.php and logout.php when USE_SERVER is true (see app.js).

// Sets up the game state for a logged-in user (same for server accounts and local accounts)
function startSession(user) {
  const A = window.AppState;
  A.currentUser = user;
  A.score = user.score || 0;
  A.missionProgress = normalizeProgress(user.missionProgress);
  A.preAssessmentScore = user.preAssessmentScore || 0;
  A.postAssessmentScore = user.postAssessmentScore || 0;
  A.currentUser.preAssessmentCompleted = !!user.preAssessmentCompleted;
  A.currentUser.postAssessmentCompleted = !!user.postAssessmentCompleted;
  A.streak = 0;

  // Calculate unique scenarios completed from mission progress
  let uniqueScenariosCompleted = 0;
  for (let i = 1; i <= MISSION_COUNT; i++) {
    uniqueScenariosCompleted += A.missionProgress[i].scenarios.length;
  }
  A.scenariosCompleted = uniqueScenariosCompleted;

  if (typeof updateAgentInfo === 'function') updateAgentInfo();

  // Check if user has already completed pre-assessment
  if (user.preAssessmentCompleted) {
    showScreen('mission-hub');
  } else {
    showScreen('pre-assessment');
    if (typeof initializePreAssessment === 'function') initializePreAssessment();
  }
}

function setBusy(formId, busy) {
  const btn = document.querySelector('#' + formId + ' .auth-btn');
  if (btn) btn.disabled = busy;
}

// Authentication Functions
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorElement = document.getElementById('login-error');
  errorElement.textContent = '';

  if (!username || !password) {
    errorElement.textContent = 'Please enter both Student ID and password';
    return;
  }

  if (USE_SERVER) {
    setBusy('login-form', true);
    try {
      const result = await apiPost('login.php', { username, password });
      if (result.ok && result.data && result.data.success) {
        startSession(result.data.user);
      } else {
        errorElement.textContent = serverProblemMessage(result, 'login.php');
      }
    } catch (e) {
      errorElement.textContent = serverDownMessage();
    }
    setBusy('login-form', false);
    return;
  }

  // Local (LocalStorage) accounts
  const user = window.AppState.users.find(u => u.username === username && u.password === password);
  if (user) startSession(user);
  else errorElement.textContent = 'Invalid Student ID or password';
}

async function handleRegister() {
  const firstname = document.getElementById('register-firstname').value.trim();
  const lastname = document.getElementById('register-lastname').value.trim();
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm').value;
  const errorElement = document.getElementById('register-error');
  errorElement.textContent = '';

  if (!firstname || !lastname || !username || !email || !password || !confirm) {
    errorElement.textContent = 'Please fill in all fields';
    return;
  }

  if (!email.toLowerCase().endsWith('@gmail.com')) {
    errorElement.textContent = 'Please use a Gmail address to sign in';
    return;
  }

  if (password.length < 8) {
    errorElement.textContent = 'Password must be at least 8 characters';
    return;
  }

  if (password !== confirm) {
    errorElement.textContent = 'Passwords do not match';
    return;
  }

  if (USE_SERVER) {
    setBusy('register-form', true);
    try {
      const result = await apiPost('Register.php', { firstname, lastname, username, email, password });
      if (result.ok && result.data && result.data.success) {
        startSession(result.data.user);
      } else {
        errorElement.textContent = serverProblemMessage(result, 'Register.php');
      }
    } catch (e) {
      errorElement.textContent = serverDownMessage();
    }
    setBusy('register-form', false);
    return;
  }

  // Local (LocalStorage) accounts
  if (window.AppState.users.find(u => u.username === username)) {
    errorElement.textContent = 'Username already exists';
    return;
  }

  const newUser = {
    firstname, lastname, username, email, password,
    score: 0,
    scenariosCompleted: 0,
    missionProgress: normalizeProgress({}),
    preAssessmentScore: 0,
    postAssessmentScore: 0,
    preAssessmentCompleted: false,
    postAssessmentCompleted: false,
    agentNumber: Math.floor(Math.random() * 90000) + 10000
  };

  window.AppState.users.push(newUser);
  localStorage.setItem('phishquest_users', JSON.stringify(window.AppState.users));
  startSession(newUser);
}

function handleLogout() {
  if (typeof saveUserProgress === 'function') {
    saveUserProgress();
  }
  if (USE_SERVER) {
    serverLogout();
  }

  window.AppState.currentUser = null;
  window.AppState.score = 0;
  window.AppState.scenariosCompleted = 0;
  window.AppState.currentMission = null;
  window.AppState.currentScenario = 0;

  // Reset forms
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('register-firstname').value = '';
  document.getElementById('register-lastname').value = '';
  document.getElementById('register-username').value = '';
  document.getElementById('register-email').value = '';
  document.getElementById('register-password').value = '';
  document.getElementById('register-confirm').value = '';
  document.getElementById('login-error').textContent = '';
  document.getElementById('register-error').textContent = '';

  // Always come back to the Login tab
  const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
  if (loginTab) loginTab.click();

  if (typeof showScreen === 'function') {
    showScreen('login');
  }
}

// Initialize Auth Tab Switching
function initAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById(tabName + '-form').classList.add('active');

      // Clear errors
      document.getElementById('login-error').textContent = '';
      document.getElementById('register-error').textContent = '';
    });
  });
}

// Initialize authentication when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initAuthTabs();
});
