// Authentication Module for PhishQuest

// Application State is defined in app.js and loaded before this file
// AppState is available globally via window.AppState

// Authentication Functions
function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorElement = document.getElementById('login-error');

  if (!username || !password) {
    errorElement.textContent = 'Please enter both Student ID and password';
    return;
  }

  const user = window.AppState.users.find(u => u.username === username && u.password === password);

  if (user) {
    window.AppState.currentUser = user;
    window.AppState.score = user.score || 0;
    window.AppState.missionProgress = user.missionProgress || JSON.parse(JSON.stringify(window.AppState.missionProgress));
    window.AppState.preAssessmentScore = user.preAssessmentScore || 0;
    window.AppState.postAssessmentScore = user.postAssessmentScore || 0;
    window.AppState.currentUser.preAssessmentCompleted = user.preAssessmentCompleted || false;
    window.AppState.currentUser.postAssessmentCompleted = user.postAssessmentCompleted || false;

    // Calculate unique scenarios completed from mission progress
    let uniqueScenariosCompleted = 0;
    for (let i = 1; i <= 4; i++) {
      uniqueScenariosCompleted += window.AppState.missionProgress[i].scenarios.length;
    }
    window.AppState.scenariosCompleted = uniqueScenariosCompleted;

    // Call updateAgentInfo if it exists in app.js
    if (typeof updateAgentInfo === 'function') {
      updateAgentInfo();
    }

    // Check if user has already completed pre-assessment
    if (user.preAssessmentCompleted) {
      if (typeof showScreen === 'function') {
        showScreen('mission-hub');
      }
    } else {
      if (typeof showScreen === 'function') {
        showScreen('pre-assessment');
      }
      if (typeof initializePreAssessment === 'function') {
        initializePreAssessment();
      }
    }
  } else {
    errorElement.textContent = 'Invalid Student ID or password';
  }
}

function handleRegister() {
  const firstname = document.getElementById('register-firstname').value.trim();
  const lastname = document.getElementById('register-lastname').value.trim();
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm').value;
  const errorElement = document.getElementById('register-error');

  if (!firstname || !lastname || !username || !email || !password || !confirm) {
    errorElement.textContent = 'Please fill in all fields';
    return;
  }

  if (!email.toLowerCase().endsWith('@gmail.com')) {
    errorElement.textContent = 'Please use a Gmail address to sign in';
    return;
  }

  if (password !== confirm) {
    errorElement.textContent = 'Passwords do not match';
    return;
  }

  if (window.AppState.users.find(u => u.username === username)) {
    errorElement.textContent = 'Username already exists';
    return;
  }

  const newUser = {
    firstname,
    lastname,
    username,
    email,
    password,
    score: 0,
    scenariosCompleted: 0,
    missionProgress: JSON.parse(JSON.stringify(window.AppState.missionProgress)),
    preAssessmentScore: 0,
    postAssessmentScore: 0,
    preAssessmentCompleted: false,
    postAssessmentCompleted: false,
    agentNumber: Math.floor(Math.random() * 90000) + 10000
  };

  window.AppState.users.push(newUser);
  localStorage.setItem('phishquest_users', JSON.stringify(window.AppState.users));

  window.AppState.currentUser = newUser;

  if (typeof updateAgentInfo === 'function') {
    updateAgentInfo();
  }

  if (typeof showScreen === 'function') {
    showScreen('pre-assessment');
  }

  if (typeof initializePreAssessment === 'function') {
    initializePreAssessment();
  }
}

function handleLogout() {
  if (typeof saveUserProgress === 'function') {
    saveUserProgress();
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
