// Application State (shared with auth.js)
const AppState = {
  currentUser: null,
  users: JSON.parse(localStorage.getItem('phishquest_users')) || [],
  currentScreen: 'login',
  currentMission: null,
  currentScenario: 0,
  preAssessmentIndex: 0,
  postAssessmentIndex: 0,
  score: 0,
  scenariosCompleted: 0,
  missionProgress: {
    1: { completed: false, scenarios: [] },
    2: { completed: false, scenarios: [] },
    3: { completed: false, scenarios: [] },
    4: { completed: false, scenarios: [] }
  },
  preAssessmentScore: 0,
  postAssessmentScore: 0,
  selectedIndicators: [],
  selectedOption: null
};

// Make AppState available globally for auth.js
window.AppState = AppState;

// Mission Data - 5 scenarios per mission
const Missions = {
  1: {
    name: "Email Detective",
    scenarios: [
      {
        instruction: "Tap anything in this email that looks suspicious.",
        indicators: 3,
        hint: "Analyzing email headers reveals crucial domain mismatches.",
        type: "email",
        content: {
          from: "security@st1-college-support.com",
          to: "william.cadet@statecollege.edu",
          subject: "URGENT — your account will be suspended today",
          body: `<p>Dear Student,</p><p>We detected unusual activity on your account. Your access will be revoked in 24 hours unless you confirm your identity.</p>`,
          cta: "Click here to verify your account →",
          flags: ["from", "subject", "cta"]
        },
        explanations: {
          from: "The sender domain 'st1-college-support.com' is not the official college domain. Phishers often use similar-looking domains to appear legitimate.",
          subject: "The subject line uses urgency ('suspended today') to pressure you into acting without thinking. This is a common psychological tactic.",
          cta: "Legitimate organizations never ask you to verify your account through email links. This is a classic phishing technique to steal credentials."
        }
      },
      {
        instruction: "Identify the phishing indicators in this email.",
        indicators: 2,
        hint: "Legitimate companies don't ask for sensitive info via email.",
        type: "email",
        content: {
          from: "paypal-security@verification-alert.net",
          to: "user@example.com",
          subject: "Verify your PayPal account immediately",
          body: `<p>Dear Customer,</p><p>Your PayPal account has been limited. Please verify your identity to restore full access.</p>`,
          cta: "Verify Account Now",
          flags: ["from", "cta"]
        },
        explanations: {
          from: "PayPal's official domain is paypal.com, not verification-alert.net. Phishers create fake domains that sound official.",
          cta: "PayPal would never ask you to verify your account via an email link. They use secure login pages and official notifications."
        }
      },
      {
        instruction: "Find the red flags in this message.",
        indicators: 3,
        hint: "Check the sender domain and urgency indicators.",
        type: "email",
        content: {
          from: "hr-department@company-update.info",
          to: "employee@company.com",
          subject: "URGENT: Update your payroll information",
          body: `<p>Hello,</p><p>We need you to update your direct deposit information immediately or your paycheck will be delayed.</p>`,
          cta: "Update Payroll Info",
          flags: ["from", "subject", "cta"]
        },
        explanations: {
          from: "HR departments use official company email domains, not generic domains like company-update.info.",
          subject: "Urgent language about payroll is designed to make you act quickly without verifying the source.",
          cta: "Payroll changes are handled through secure HR portals, not email links. This is an attempt to steal banking information."
        }
      },
      {
        instruction: "Spot the suspicious elements in this email.",
        indicators: 2,
        hint: "Generic greetings and urgent requests are common signs.",
        type: "email",
        content: {
          from: "support@microsoft-helpdesk.xyz",
          to: "user@outlook.com",
          subject: "Your Microsoft account will be deleted",
          body: `<p>Dear User,</p><p>Your Microsoft account will be permanently deleted in 48 hours unless you take action.</p>`,
          cta: "Save My Account",
          flags: ["from", "subject"]
        },
        explanations: {
          from: "Microsoft uses official domains like microsoft.com or support.microsoft.com, not helpdesk.xyz.",
          subject: "Threats about account deletion are fear tactics used by phishers to create urgency and panic."
        }
      },
      {
        instruction: "Identify all phishing indicators.",
        indicators: 3,
        hint: "Look for mismatched domains and urgent language.",
        type: "email",
        content: {
          from: "admin@google-verify-account.com",
          to: "user@gmail.com",
          subject: "Security Alert: Unusual sign-in activity",
          body: `<p>Dear User,</p><p>We detected suspicious activity on your Google account. Verify your identity immediately.</p>`,
          cta: "Secure My Account",
          flags: ["from", "subject", "cta"]
        },
        explanations: {
          from: "Google's security emails come from accounts.google.com, not google-verify-account.com.",
          subject: "Security alerts are designed to alarm you and make you click without thinking carefully.",
          cta: "Google would never ask you to 'secure your account' through an email link. They use official security notifications."
        }
      }
    ]
  },
  2: {
    name: "Link Hunter",
    scenarios: [
      {
        instruction: "Select the URLs that look suspicious.",
        indicators: 2,
        hint: "Watch out for look-alike characters (homoglyphs) and wrong domains.",
        type: "links",
        content: [
          { url: "https://www.facebook.com", suspicious: false },
          { url: "https://www.faceb00k-security-login.com", suspicious: true },
          { url: "https://www.microsoft.com", suspicious: false },
          { url: "https://microsoft.verify-account.xyz", suspicious: true }
        ],
        explanations: {
          "link-1": "This URL uses 'faceb00k' with zeros instead of 'o' - a homoglyph attack to trick your eyes.",
          "link-3": "Microsoft would never use 'verify-account.xyz' as a domain. Legitimate domains end in .com, .org, or official country codes."
        }
      },
      {
        instruction: "Identify the suspicious URLs.",
        indicators: 2,
        hint: "Check for subdomain abuse and misspellings.",
        type: "links",
        content: [
          { url: "https://www.amazon.com", suspicious: false },
          { url: "https://amazon-security-check.net", suspicious: true },
          { url: "https://www.apple.com", suspicious: false },
          { url: "https://www.appple-id-verify.com", suspicious: true }
        ],
        explanations: {
          "link-1": "Amazon's official domain is amazon.com, not amazon-security-check.net. The '.net' extension is suspicious.",
          "link-3": "This URL has 'appple' with three p's instead of two - a deliberate misspelling to deceive users."
        }
      },
      {
        instruction: "Select the malicious links.",
        indicators: 3,
        hint: "Look for HTTP instead of HTTPS and unusual domain extensions.",
        type: "links",
        content: [
          { url: "https://www.netflix.com", suspicious: false },
          { url: "http://netflix-login-verify.tk", suspicious: true },
          { url: "https://bankofamerica.com", suspicious: false },
          { url: "https://bankofamerica-secure-login.xyz", suspicious: true },
          { url: "https://www.chase.com", suspicious: false },
          { url: "https://chase-bank-alert.co", suspicious: true }
        ],
        explanations: {
          "link-1": "This uses HTTP instead of HTTPS - no encryption, meaning it's not secure. Legitimate sites always use HTTPS.",
          "link-3": "Bank of America would never use 'secure-login.xyz' as a domain. The .xyz extension is commonly used for phishing.",
          "link-5": "Chase's official domain is chase.com, not chase-bank-alert.co. The .co extension is often abused by phishers."
        }
      },
      {
        instruction: "Find the phishing URLs.",
        indicators: 2,
        hint: "Check for domain substitutions and wrong TLDs.",
        type: "links",
        content: [
          { url: "https://www.linkedin.com", suspicious: false },
          { url: "https://linkedin-career-update.net", suspicious: true },
          { url: "https://www.twitter.com", suspicious: false },
          { url: "https://twiiter-account-secure.com", suspicious: true }
        ],
        explanations: {
          "link-1": "LinkedIn's official domain is linkedin.com, not linkedin-career-update.net. This is a fake domain attempting to look official.",
          "link-3": "This URL has 'twiiter' with one 'i' instead of two - a common misspelling technique in phishing URLs."
        }
      },
      {
        instruction: "Identify all suspicious links.",
        indicators: 3,
        hint: "Look for numeric substitutions and unusual domain patterns.",
        type: "links",
        content: [
          { url: "https://www.instagram.com", suspicious: false },
          { url: "https://1nstagram-verify-account.com", suspicious: true },
          { url: "https://www.paypal.com", suspicious: false },
          { url: "https://paypal-secure-login.site", suspicious: true },
          { url: "https://www.ebay.com", suspicious: false },
          { url: "https://ebay-account-alert.xyz", suspicious: true }
        ],
        explanations: {
          "link-1": "This uses '1nstagram' with a number 1 instead of the letter 'i' - a leetspeak substitution to evade detection.",
          "link-3": "PayPal would never use 'secure-login.site' as a domain. The .site extension is frequently used for phishing sites.",
          "link-5": "eBay's official domain is ebay.com, not ebay-account-alert.xyz. This is clearly not an official eBay domain."
        }
      }
    ]
  },
  3: {
    name: "Fake Website",
    scenarios: [
      {
        instruction: "Tap anything on this login page that looks suspicious.",
        indicators: 2,
        hint: "Hovering links or checking browser addresses exposes destination fraud.",
        type: "website",
        content: {
          url: "portal-secure-login.verify-access.xyz",
          title: "STATE COLLEGE PORTAL",
          urgent: "Your session will expire in 2 minutes — sign in to continue",
          flags: ["url", "urgent"]
        },
        explanations: {
          url: "The domain 'verify-access.xyz' is not an official college domain. Educational institutions use .edu domains, not .xyz.",
          urgent: "Session expiration warnings in under 2 minutes are fake. Real systems give reasonable timeframes and don't pressure you this way."
        }
      },
      {
        instruction: "Find the suspicious elements on this page.",
        indicators: 2,
        hint: "Check the domain and look for urgency tactics.",
        type: "website",
        content: {
          url: "bank-secure-login.online-banking.xyz",
          title: "NATIONAL BANK",
          urgent: "Your account has been locked — sign in to unlock",
          flags: ["url", "urgent"]
        },
        explanations: {
          url: "Banks use official domains with proper security certificates. 'online-banking.xyz' is clearly not a legitimate bank domain.",
          urgent: "Banks don't lock accounts and force immediate login through emails. They use secure customer service channels for account issues."
        }
      },
      {
        instruction: "Identify the red flags on this login page.",
        indicators: 3,
        hint: "Look for wrong domains, urgency, and poor design.",
        type: "website",
        content: {
          url: "email-login-verify.microsoft-secure.net",
          title: "MICROSOFT OUTLOOK",
          urgent: "Verify your account or lose access forever",
          flags: ["url", "urgent", "title"]
        },
        explanations: {
          url: "Microsoft's official domain is microsoft.com, not microsoft-secure.net. The .net extension with 'secure' is suspicious.",
          urgent: "Threats about losing access 'forever' are fear tactics. Microsoft would never use such extreme language in official communications.",
          title: "While Microsoft Outlook is real, the combination with the fake domain and urgent language indicates this is a phishing clone."
        }
      },
      {
        instruction: "Spot the phishing indicators.",
        indicators: 2,
        hint: "Check the domain format and urgent messaging.",
        type: "website",
        content: {
          url: "paypal-secure-login.account-verify.xyz",
          title: "PAYPAL",
          urgent: "Your PayPal balance is at risk — act now",
          flags: ["url", "urgent"]
        },
        explanations: {
          url: "PayPal's official domain is paypal.com, not account-verify.xyz. This is clearly attempting to impersonate PayPal.",
          urgent: "Claims about your balance being 'at risk' are designed to create panic. PayPal communicates security issues through official notifications, not urgent login pages."
        }
      },
      {
        instruction: "Find all suspicious elements.",
        indicators: 3,
        hint: "Look for domain mismatches, urgency, and generic branding.",
        type: "website",
        content: {
          url: "google-account-verify.login-secure.net",
          title: "GOOGLE ACCOUNT",
          urgent: "Your Google account will be deleted in 1 hour",
          flags: ["url", "urgent", "title"]
        },
        explanations: {
          url: "Google uses accounts.google.com for authentication, not login-secure.net. This domain is clearly not official.",
          urgent: "Google would never delete accounts in 1 hour. This is an obvious fear tactic to make you act without thinking.",
          title: "Using 'Google Account' with a fake domain is a classic phishing technique - the brand is real but the context is fake."
        }
      }
    ]
  },
  4: {
    name: "Social Engineering",
    scenarios: [
      {
        instruction: "Tap any message that looks like a suspicious request.",
        indicators: 2,
        hint: "Support representatives will never ask for multi-factor security codes.",
        type: "chat",
        content: [
          { sender: "them", message: "Hi, I'm from IT. We're updating your account.", flag: "UNSOLICITED OUTREACH" },
          { sender: "me", message: "Oh, I didn't know there was an update today. Do I need to do anything?" },
          { sender: "them", message: "Send me your verification code so I can complete the update.", flag: "CREDENTIAL HARVESTING" }
        ],
        explanations: {
          "chat-0": "IT departments never initiate unsolicited contact asking for help with 'account updates'. They use official channels and scheduled maintenance windows.",
          "chat-2": "Verification codes (MFA) are meant to protect your account. Sharing them gives attackers full access to your account."
        }
      },
      {
        instruction: "Identify suspicious messages in this chat.",
        indicators: 2,
        hint: "Real support won't ask for passwords or codes via chat.",
        type: "chat",
        content: [
          { sender: "them", message: "Hello! This is Amazon Support. We need to verify your purchase.", flag: "IMPERSONATION" },
          { sender: "me", message: "I didn't make any recent purchases." },
          { sender: "them", message: "Please provide your credit card number to cancel the transaction.", flag: "FINANCIAL REQUEST" }
        ],
        explanations: {
          "chat-0": "Amazon Support would never contact you via chat about purchase verification. They use email and official account notifications.",
          "chat-2": "No legitimate company asks for credit card numbers via chat. Financial transactions are handled through secure payment portals."
        }
      },
      {
        instruction: "Find the social engineering attempts.",
        indicators: 3,
        hint: "Look for urgency, authority claims, and sensitive requests.",
        type: "chat",
        content: [
          { sender: "them", message: "URGENT: CEO needs your help with a wire transfer.", flag: "AUTHORITY ABUSE" },
          { sender: "me", message: "Really? What do you need?" },
          { sender: "them", message: "I need you to transfer $5000 to this account immediately. It's confidential.", flag: "FINANCIAL URGENCY" },
          { sender: "me", message: "I should check with the CEO first." },
          { sender: "them", message: "No time! He's in a meeting. Do it now or the company loses money!", flag: "PRESSURE TACTICS" }
        ],
        explanations: {
          "chat-0": "CEO impersonation is a common business email compromise tactic. Real executives follow proper financial procedures.",
          "chat-2": "Urgent wire transfer requests with confidentiality clauses are hallmarks of business email phishing scams.",
          "chat-4": "Preventing you from verifying with the actual CEO is a clear manipulation tactic. Legitimate requests encourage verification."
        }
      },
      {
        instruction: "Spot the suspicious communication.",
        indicators: 2,
        hint: "Watch for unusual requests from known contacts.",
        type: "chat",
        content: [
          { sender: "them", message: "Hey! Can you send me your login credentials? I need to check something.", flag: "CREDENTIAL REQUEST" },
          { sender: "me", message: "Why do you need my login?" },
          { sender: "them", message: "Just trust me, it's important. I'll explain later.", flag: "EVIATION" }
        ],
        explanations: {
          "chat-0": "Friends and colleagues should never ask for your login credentials. This is a classic account compromise attempt.",
          "chat-2": "Evasion and secrecy are major red flags. Legitimate requests can be explained immediately and don't require blind trust."
        }
      },
      {
        instruction: "Identify all social engineering red flags.",
        indicators: 3,
        hint: "Look for impersonation, urgency, and sensitive information requests.",
        type: "chat",
        content: [
          { sender: "them", message: "This is HR. We need your SSN for payroll update.", flag: "IMPERSONATION" },
          { sender: "me", message: "Shouldn't this go through official channels?" },
          { sender: "them", message: "System is down, need it now or your paycheck will be delayed.", flag: "URGENCY" },
          { sender: "me", message: "I'll wait until the system is back up." },
          { sender: "them", message: "This is your final warning. Send SSN immediately or face disciplinary action.", flag: "THREATS" }
        ],
        explanations: {
          "chat-0": "HR departments handle sensitive data through secure, official channels, not informal chat requests.",
          "chat-2": "System failures are never used as excuses to bypass security procedures. This is a manipulation tactic.",
          "chat-4": "Threats of disciplinary action are intimidation tactics designed to force compliance through fear."
        }
      }
    ]
  }
};

// Assessment Questions
const AssessmentQuestions = [
  {
    scenario: "You receive an email saying your school account will be deactivated within 24 hours. It contains a link asking you to verify your account.",
    question: "What indicators suggest this may be phishing?",
    options: ["Urgency", "Suspicious link", "Request for account verification", "All of the above"],
    correct: 3
  },
  {
    scenario: "A message from 'IT Support' asks for your password to fix an account issue.",
    question: "What should you do?",
    options: ["Provide the password immediately", "Ignore the message", "Report to official IT support", "Share with a colleague"],
    correct: 2
  },
  {
    scenario: "You find a USB drive in the parking lot labeled 'Employee Salaries'.",
    question: "What is the safest action?",
    options: ["Plug it in to see contents", "Give it to security/IT", "Take it home", "Format it and use it"],
    correct: 1
  },
  {
    scenario: "An email claims to be from your bank asking you to click a link to verify a transaction.",
    question: "What should you do?",
    options: ["Click the link immediately", "Call the bank using official number", "Reply with your account details", "Forward to friends"],
    correct: 1
  },
  {
    scenario: "A pop-up says your computer is infected and you need to call a number for help.",
    question: "What is this likely to be?",
    options: ["Legitimate security alert", "Tech support scam", "Windows update", "Antivirus notification"],
    correct: 1
  }
];

// Authentication Functions - moved to js/auth.js
// handleLogin(), handleRegister(), handleLogout() are now in auth.js

// Save User Progress (used by application logic)
function saveUserProgress() {
  if (AppState.currentUser) {
    const userIndex = AppState.users.findIndex(u => u.username === AppState.currentUser.username);
    if (userIndex !== -1) {
      // Calculate unique scenarios completed across all missions
      let uniqueScenariosCompleted = 0;
      for (let i = 1; i <= 4; i++) {
        uniqueScenariosCompleted += AppState.missionProgress[i].scenarios.length;
      }

      AppState.users[userIndex] = {
        ...AppState.currentUser,
        score: AppState.score,
        scenariosCompleted: uniqueScenariosCompleted,
        missionProgress: AppState.missionProgress,
        preAssessmentScore: AppState.preAssessmentScore,
        postAssessmentScore: AppState.postAssessmentScore,
        preAssessmentCompleted: AppState.currentUser.preAssessmentCompleted || false,
        postAssessmentCompleted: AppState.currentUser.postAssessmentCompleted || false
      };
      localStorage.setItem('phishquest_users', JSON.stringify(AppState.users));
    }
  }
}

// Screen Navigation
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  const targetScreen = document.getElementById(screenId + '-screen');
  if (targetScreen) {
    targetScreen.classList.add('active');
    AppState.currentScreen = screenId;
  }
  
  if (screenId === 'mission-hub') {
    updateMissionHub();
  }
  
  if (screenId === 'results-screen') {
    showResults();
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Auth Tab Switching - moved to js/auth.js

// Update Agent Information
function updateAgentInfo() {
  if (!AppState.currentUser) return;
  
  const agentName = `Agent #${AppState.currentUser.agentNumber}`;
  const rank = getRank(AppState.score);
  
  // Hub agent badge (top-right button)
  const badgeName = document.getElementById('agent-name');
  const badgeRank = document.getElementById('agent-rank');
  if (badgeName) badgeName.textContent = agentName;
  if (badgeRank) badgeRank.textContent = rank;

  // Gameplay sidebar (unchanged IDs)
  const gpName = document.getElementById('gameplay-agent-name');
  const gpRank = document.getElementById('gameplay-agent-rank');
  if (gpName) gpName.textContent = agentName;
  if (gpRank) gpRank.textContent = `RANK: ${rank}`;
}

function getRank(score) {
  if (score >= 170) return 'MASTER HUNTER';
  if (score >= 130) return 'SENIOR AGENT';
  if (score >= 90)  return 'SKILLED OPERATIVE';
  if (score >= 50)  return 'JUNIOR AGENT';
  return 'NOVICE HUNTER';
}

function getRankInfo(score) {
  if (score >= 170) {
    return {
      current: 'MASTER HUNTER',
      next: null,
      pointsToNext: 0,
      currentMin: 170,
      currentMax: 200,
      progress: 100
    };
  } else if (score >= 130) {
    return {
      current: 'SENIOR AGENT',
      next: 'MASTER HUNTER',
      pointsToNext: 170 - score,
      currentMin: 130,
      currentMax: 169,
      progress: ((score - 130) / 40) * 100
    };
  } else if (score >= 90) {
    return {
      current: 'SKILLED OPERATIVE',
      next: 'SENIOR AGENT',
      pointsToNext: 130 - score,
      currentMin: 90,
      currentMax: 129,
      progress: ((score - 90) / 40) * 100
    };
  } else if (score >= 50) {
    return {
      current: 'JUNIOR AGENT',
      next: 'SKILLED OPERATIVE',
      pointsToNext: 90 - score,
      currentMin: 50,
      currentMax: 89,
      progress: ((score - 50) / 40) * 100
    };
  } else {
    return {
      current: 'NOVICE HUNTER',
      next: 'JUNIOR AGENT',
      pointsToNext: 50 - score,
      currentMin: 0,
      currentMax: 49,
      progress: (score / 50) * 100
    };
  }
}

// ── Sync rank popup data (called from updateMissionHub & showRankPopup) ──
function syncRankPopupData() {
  const rankInfo = getRankInfo(AppState.score);

  // Hero section
  const heroTitle = document.getElementById('rank-current-title');
  const heroSub   = document.getElementById('rank-popup-hero-sub') || document.querySelector('.rank-popup-hero-sub');
  const heroAgent = document.getElementById('rank-hero-agent');
  const heroIcon  = document.getElementById('rank-hero-icon');

  if (heroTitle) heroTitle.textContent = rankInfo.current;
  if (heroAgent && AppState.currentUser) {
    heroAgent.textContent = `Agent #${AppState.currentUser.agentNumber}`;
  }

  // Hero sub-text varies by rank
  const heroSubText = {
    'NOVICE HUNTER':    'Learning the ropes.',
    'JUNIOR AGENT':     'Spotting the obvious traps.',
    'SKILLED OPERATIVE':'Reading between the lines.',
    'SENIOR AGENT':     'Catching what others miss.',
    'MASTER HUNTER':    'Nothing phishes past you.'
  };
  const rankIcons = {
    'NOVICE HUNTER':    '🎯',
    'JUNIOR AGENT':     '🔍',
    'SKILLED OPERATIVE':'🎖️',
    'SENIOR AGENT':     '⭐',
    'MASTER HUNTER':    '👑'
  };

  if (heroIcon) heroIcon.textContent = rankIcons[rankInfo.current] || '🏆';
  if (document.querySelector('.rank-popup-hero-sub')) {
    document.querySelector('.rank-popup-hero-sub').innerHTML =
      `${heroSubText[rankInfo.current] || ''}<br><span id="rank-hero-agent">Agent #${AppState.currentUser ? AppState.currentUser.agentNumber : ''}</span>`;
  }

  // Progress bar row
  const ptsEl   = document.getElementById('rank-points-remaining');
  const scoreEl = document.getElementById('rank-current-score');
  const fillEl  = document.getElementById('rank-progress-fill');

  if (ptsEl) {
    ptsEl.textContent = rankInfo.next
      ? `${rankInfo.pointsToNext} pts to ${rankInfo.next}`
      : 'Top rank reached — nothing phishes past you.';
  }
  if (scoreEl) scoreEl.textContent = `${AppState.score}/200`;
  if (fillEl)  fillEl.style.width  = `${rankInfo.progress}%`;

  // Rank ladder items — keyed by data-rank attribute
  document.querySelectorAll('.rank-item[data-rank]').forEach(item => {
    const rankName = item.dataset.rank;
    item.classList.remove('earned', 'current', 'locked');
    const statusEl = item.querySelector('.rank-item-status');

    if (rankName === rankInfo.current) {
      item.classList.add('current');
      if (statusEl) statusEl.textContent = 'YOU ARE HERE';
    } else if (getRankScore(rankName) <= AppState.score) {
      item.classList.add('earned');
      if (statusEl) statusEl.textContent = '✓ Earned';
    } else {
      item.classList.add('locked');
      if (statusEl) statusEl.textContent = 'Locked';
    }
  });
}

function showRankPopup() {
  syncRankPopupData();
  document.getElementById('rank-popup').style.display = 'flex';
}

function hideRankPopup() {
  document.getElementById('rank-popup').style.display = 'none';
}

function getRankScore(rankName) {
  switch(rankName) {
    case 'NOVICE HUNTER':    return 0;
    case 'JUNIOR AGENT':     return 50;
    case 'SKILLED OPERATIVE':return 90;
    case 'SENIOR AGENT':     return 130;
    case 'MASTER HUNTER':    return 170;
    default: return 0;
  }
}

// Pre-Assessment
function initializePreAssessment() {
  AppState.preAssessmentIndex = 0;
  showPreAssessmentQuestion();
}

function showPreAssessmentQuestion() {
  const question = AssessmentQuestions[AppState.preAssessmentIndex];
  const total = AssessmentQuestions.length;

  document.getElementById('pre-assessment-label').textContent = `PRE-ASSESSMENT - QUESTION ${AppState.preAssessmentIndex + 1}/${total}`;
  document.getElementById('pre-assessment-scenario').textContent = question.scenario;
  document.getElementById('pre-assessment-question').textContent = question.question;

  // Build progress bar segments
  const progressContainer = document.getElementById('pre-assessment-progress');
  progressContainer.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const segment = document.createElement('div');
    segment.className = `progress-segment ${i < AppState.preAssessmentIndex + 1 ? 'filled' : ''}`;
    progressContainer.appendChild(segment);
  }

  // Build options with letters
  const optionsContainer = document.getElementById('pre-assessment-options');
  optionsContainer.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  question.options.forEach((option, index) => {
    const optionElement = document.createElement('div');
    optionElement.className = 'option';
    optionElement.innerHTML = `<div class="option-letter">${letters[index]}</div>${option}`;
    optionElement.onclick = () => selectPreAssessmentOption(index, optionElement);
    optionsContainer.appendChild(optionElement);
  });

  AppState.selectedOption = null;
}

function selectPreAssessmentOption(index, element) {
  document.querySelectorAll('#pre-assessment-options .option').forEach(opt => {
    opt.classList.remove('selected');
  });
  element.classList.add('selected');
  AppState.selectedOption = index;
}

function nextPreAssessment() {
  if (AppState.selectedOption === null) {
    alert('Please select an answer');
    return;
  }
  
  const question = AssessmentQuestions[AppState.preAssessmentIndex];
  if (AppState.selectedOption === question.correct) {
    AppState.preAssessmentScore++;
  }
  
  AppState.preAssessmentIndex++;
  
  if (AppState.preAssessmentIndex < AssessmentQuestions.length) {
    showPreAssessmentQuestion();
  } else {
    // Pre-assessment complete, mark as completed and save
    AppState.currentUser.preAssessmentCompleted = true;
    saveUserProgress();
    showScreen('mission-hub');
  }
}

// Mission Hub
function updateMissionHub() {
  updateAgentInfo();

  // ── Tally stats ──────────────────────────────────────────
  let uniqueScenariosCompleted = 0;
  let missionsCleared = 0;
  for (let i = 1; i <= 4; i++) {
    uniqueScenariosCompleted += AppState.missionProgress[i].scenarios.length;
    if (AppState.missionProgress[i].completed) missionsCleared++;
  }

  // ── Stat strip ───────────────────────────────────────────
  // score value — keep the /200 inside a <span class="stat-max">
  const scoreEl = document.getElementById('current-score');
  if (scoreEl) scoreEl.innerHTML = `${AppState.score} <span class="stat-max">/200</span>`;

  const scenEl = document.getElementById('scenarios-completed');
  if (scenEl) scenEl.innerHTML = `${uniqueScenariosCompleted} <span class="stat-max">/20</span>`;

  const mclEl = document.getElementById('missions-cleared');
  if (mclEl) mclEl.innerHTML = `${missionsCleared} <span class="stat-max">/4</span>`;

  // ── Completion bar ───────────────────────────────────────
  const pct = Math.round((uniqueScenariosCompleted / 20) * 100);
  const pctEl = document.getElementById('completion-percent');
  if (pctEl) pctEl.textContent = `${pct}% (${uniqueScenariosCompleted}/20)`;

  const barTrack = document.getElementById('completion-bar');
  if (barTrack) {
    barTrack.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const seg = document.createElement('i');
      seg.className = i < uniqueScenariosCompleted ? 'filled' : '';
      barTrack.appendChild(seg);
    }
  }

  // ── Mission cards ────────────────────────────────────────
  const missionNames = {
    1: 'Email Detective',
    2: 'Link Hunter',
    3: 'Fake Website',
    4: 'Social Engineering'
  };

  let nextMissionId = null;   // first non-completed mission that is unlocked
  let nextMissionInProgress = false;

  for (let i = 1; i <= 4; i++) {
    const mission   = AppState.missionProgress[i];
    const card      = document.getElementById(`mission-${i}`);
    const statusEl  = document.getElementById(`mission-${i}-status`);
    const btnEl     = document.getElementById(`mission-${i}-btn`);
    const dotsEl    = document.getElementById(`mission-${i}-dots`);
    const labelEl   = document.getElementById(`mission-${i}-dot-label`);
    const overlayEl = document.getElementById(`mission-${i}-overlay`);

    if (!card || !statusEl || !btnEl) continue;

    // Build scenario dots (5 segments)
    if (dotsEl) {
      dotsEl.innerHTML = '';
      const completedCount = mission.scenarios.length;
      for (let d = 0; d < 5; d++) {
        const dot = document.createElement('div');
        dot.className = 'scenario-dot' + (d < completedCount ? ' done' : '');
        dotsEl.appendChild(dot);
      }
    }
    if (labelEl) {
      labelEl.textContent = `${mission.scenarios.length}/5 scenarios`;
    }

    // Remove all state classes first
    card.classList.remove('state-available', 'state-in-progress', 'state-cleared', 'state-locked');
    if (overlayEl) overlayEl.style.display = 'none';

    if (mission.completed) {
      // ── CLEARED ──
      card.classList.add('state-cleared');
      statusEl.className = 'sticker sticker-cleared';
      statusEl.textContent = '✓ Cleared';
      btnEl.className = 'mission-action-btn';
      btnEl.disabled = false;
      btnEl.style.background = '';
      btnEl.textContent = 'Replay mission';

    } else if (mission.scenarios.length > 0) {
      // ── IN PROGRESS ──
      card.classList.add('state-in-progress');
      statusEl.className = 'sticker sticker-progress';
      statusEl.textContent = 'In progress';
      btnEl.className = 'mission-action-btn btn-yellow-act';
      btnEl.disabled = false;
      btnEl.style.background = '';
      btnEl.textContent = 'Continue mission';

      if (nextMissionId === null) {
        nextMissionId = i;
        nextMissionInProgress = true;
      }

    } else {
      // Not started — check if unlocked
      const prevCompleted = i === 1 || AppState.missionProgress[i - 1].completed;

      if (prevCompleted) {
        // ── AVAILABLE ──
        card.classList.add('state-available');
        statusEl.className = 'sticker sticker-available';
        statusEl.textContent = 'Available';
        btnEl.className = 'mission-action-btn';
        btnEl.disabled = false;
        btnEl.style.background = '';
        btnEl.textContent = 'Launch mission';

        if (nextMissionId === null) {
          nextMissionId = i;
          nextMissionInProgress = false;
        }

      } else {
        // ── LOCKED ──
        card.classList.add('state-locked');
        statusEl.className = 'sticker sticker-locked';
        statusEl.textContent = '🔒 Locked';
        btnEl.className = 'mission-action-btn';
        btnEl.disabled = true;
        btnEl.style.background = '';
        btnEl.textContent = 'Access denied';
        if (overlayEl) overlayEl.style.display = 'block';
      }
    }
  }

  // ── Next-up / All Cleared banner ─────────────────────────
  const bannerLabel = document.getElementById('next-up-label');
  const bannerTitle = document.getElementById('next-up-title');
  const bannerSub   = document.getElementById('next-up-sub');
  const postBtn     = document.getElementById('hub-post-assessment-btn');
  const allComplete = missionsCleared === 4;

  if (allComplete) {
    if (bannerLabel) bannerLabel.textContent = 'ALL MISSIONS CLEARED';
    if (bannerTitle) bannerTitle.textContent = 'Ready to measure how far you\'ve come?';
    if (bannerSub)   bannerSub.textContent   = 'Take the post-assessment to see your awareness gain.';
    if (postBtn && !AppState.currentUser.postAssessmentCompleted) {
      postBtn.style.display = 'inline-block';
    }
  } else if (nextMissionId !== null) {
    const mName = missionNames[nextMissionId];
    const scenLeft = 5 - AppState.missionProgress[nextMissionId].scenarios.length;
    const nextNum  = nextMissionId < 4 ? `Mission 0${nextMissionId + 1}` : null;

    if (nextMissionInProgress) {
      if (bannerLabel) bannerLabel.textContent = 'KEEP GOING';
      if (bannerTitle) bannerTitle.textContent = `${mName} — ${scenLeft} scenario${scenLeft !== 1 ? 's' : ''} left`;
      if (bannerSub)   bannerSub.textContent   = nextNum ? `Clear it to unlock ${nextNum}.` : 'Final mission — finish strong!';
    } else {
      if (bannerLabel) bannerLabel.textContent = 'UP NEXT';
      if (bannerTitle) bannerTitle.textContent = `Launch ${mName}`;
      if (bannerSub)   bannerSub.textContent   = nextNum ? `Clear it to unlock ${nextNum}.` : 'The final mission awaits.';
    }
    if (postBtn) postBtn.style.display = 'none';
  }

  // ── Sync rank popup data ──────────────────────────────────
  syncRankPopupData();
}

// ── Tab bar ───────────────────────────────────────────────────
function setHubTab(tab) {
  // Update tab button states
  ['new-agent', 'in-progress', 'all-cleared'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    if (el) el.classList.toggle('active', t === tab);
  });

  // Show / hide mission cards based on tab
  for (let i = 1; i <= 4; i++) {
    const card    = document.getElementById(`mission-${i}`);
    const mission = AppState.missionProgress[i];
    if (!card) continue;

    let visible = true;
    if (tab === 'new-agent') {
      // Show cards that are not yet started (available or locked)
      visible = !mission.completed && mission.scenarios.length === 0;
    } else if (tab === 'in-progress') {
      // Show cards currently in progress OR available-to-start
      const prevCompleted = i === 1 || AppState.missionProgress[i - 1].completed;
      visible = !mission.completed && (mission.scenarios.length > 0 || prevCompleted);
    } else if (tab === 'all-cleared') {
      visible = mission.completed;
    }

    card.style.display = visible ? '' : 'none';
  }
}

function startMission(missionId) {
  AppState.currentMission = missionId;
  const mission = AppState.missionProgress[missionId];
  
  // Find the first uncompleted scenario
  AppState.currentScenario = mission.scenarios.length;
  
  if (AppState.currentScenario >= 5) {
    // All scenarios completed, allow replay starting from scenario 0
    // Don't reset mission.scenarios to preserve best scores
    AppState.currentScenario = 0;
  }
  
  showMissionScenario();
}

function showMissionScenario() {
  const mission = Missions[AppState.currentMission];
  const scenario = mission.scenarios[AppState.currentScenario];
  
  document.getElementById('mission-label').textContent = `MISSION 0${AppState.currentMission} · ${mission.name.toUpperCase()}`;
  document.getElementById('scenario-label').textContent = `Scenario ${AppState.currentScenario + 1}/5`;
  document.getElementById('mission-instruction').textContent = scenario.instruction;
  document.getElementById('mission-hint').textContent = scenario.hint;
  
  AppState.selectedIndicators = [];
  updateSelectedCount();
  
  const contentContainer = document.getElementById('mission-content');
  contentContainer.innerHTML = '';
  
  if (scenario.type === 'email') {
    renderEmailScenario(scenario.content, contentContainer);
  } else if (scenario.type === 'links') {
    renderLinksScenario(scenario.content, contentContainer);
  } else if (scenario.type === 'website') {
    renderWebsiteScenario(scenario.content, contentContainer);
  } else if (scenario.type === 'chat') {
    renderChatScenario(scenario.content, contentContainer);
  }
  
  showScreen('mission-gameplay');
}

function renderEmailScenario(content, container) {
  const emailSim = document.createElement('div');
  emailSim.className = 'email-sim';
  
  const flags = content.flags || [];
  
  emailSim.innerHTML = `
    <div class="email-head">
      <div class="email-row" data-indicator="from">
        <b>From:</b> ${content.from}
      </div>
      <div class="email-row"><b>To:</b> ${content.to}</div>
      <div class="email-row" data-indicator="subject">
        <b>Subject:</b> ${content.subject}
      </div>
    </div>
    <div class="email-body">
      ${content.body}
      <span class="email-cta" data-indicator="cta">${content.cta}</span>
    </div>
  `;
  
  container.appendChild(emailSim);
  
  // Add click handlers for all elements that could be indicators
  const fromRow = emailSim.querySelector('.email-row[data-indicator="from"]');
  if (fromRow) {
    fromRow.style.cursor = 'pointer';
    fromRow.onclick = () => toggleIndicator('from');
  }
  
  const subjectRow = emailSim.querySelector('.email-row[data-indicator="subject"]');
  if (subjectRow) {
    subjectRow.style.cursor = 'pointer';
    subjectRow.onclick = () => toggleIndicator('subject');
  }
  
  const cta = emailSim.querySelector('.email-cta');
  if (cta) {
    cta.onclick = () => toggleIndicator('cta');
  }
}

function renderLinksScenario(links, container) {
  const linkList = document.createElement('div');
  linkList.className = 'link-list';
  
  links.forEach((link, index) => {
    const linkRow = document.createElement('div');
    linkRow.className = 'link-row';
    linkRow.dataset.index = index;
    linkRow.innerHTML = `
      <span class="link-icon">○</span>
      <code>${link.url}</code>
    `;
    linkRow.onclick = () => toggleLinkIndicator(index);
    linkList.appendChild(linkRow);
  });
  
  container.appendChild(linkList);
}

function renderWebsiteScenario(content, container) {
  const flags = content.flags || [];
  
  const siteFrame = document.createElement('div');
  siteFrame.className = 'fake-site-frame';
  
  siteFrame.innerHTML = `
    <div class="browser-bar">
      <div class="dots"><i></i><i></i><i></i></div>
      <div class="url-pill" data-indicator="url">
        ${content.url}
      </div>
    </div>
    <div class="fake-login">
      <div class="lock-title" data-indicator="title">🛡️ ${content.title}</div>
      <div class="urgent" data-indicator="urgent">"${content.urgent}"</div>
      <div class="fields">
        <div class="field-label">EMAIL ADDRESS</div>
        <div class="input-row"><input value="user@example.com" readonly></div>
        <div class="field-label">PASSWORD</div>
        <div class="input-row"><input value="••••••••••••" readonly></div>
      </div>
      <button class="btn btn-violet" style="margin-top:18px; width:100%; max-width:360px;">Verify & continue</button>
    </div>
  `;
  
  container.appendChild(siteFrame);
  
  // Add click handlers for all potential indicators
  const urlPill = siteFrame.querySelector('.url-pill');
  if (urlPill) {
    urlPill.style.cursor = 'pointer';
    urlPill.onclick = () => toggleIndicator('url');
  }
  
  const urgent = siteFrame.querySelector('.urgent');
  if (urgent) {
    urgent.style.cursor = 'pointer';
    urgent.onclick = () => toggleIndicator('urgent');
  }
  
  const title = siteFrame.querySelector('.lock-title');
  if (title) {
    title.style.cursor = 'pointer';
    title.onclick = () => toggleIndicator('title');
  }
}

function renderChatScenario(messages, container) {
  const chatThread = document.createElement('div');
  chatThread.className = 'chat-thread';
  
  messages.forEach((msg, index) => {
    const msgRow = document.createElement('div');
    msgRow.className = `msg-row ${msg.sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = `"${msg.message}"`;
    
    // Make all messages from "them" clickable for potential flagging
    if (msg.sender === 'them') {
      bubble.style.cursor = 'pointer';
      bubble.onclick = () => toggleChatIndicator(index);
    }
    
    msgRow.appendChild(bubble);
    chatThread.appendChild(msgRow);
  });
  
  container.appendChild(chatThread);
}

function toggleIndicator(indicator) {
  const index = AppState.selectedIndicators.indexOf(indicator);
  if (index > -1) {
    AppState.selectedIndicators.splice(index, 1);
  } else {
    AppState.selectedIndicators.push(indicator);
  }
  
  updateSelectedCount();
  
  // Update visual selection state
  if (AppState.currentMission) {
    const mission = Missions[AppState.currentMission];
    const scenario = mission.scenarios[AppState.currentScenario];
    
    if (scenario.type === 'email') {
      const emailSim = document.querySelector('.email-sim');
      if (emailSim) {
        const fromRow = emailSim.querySelector('.email-row[data-indicator="from"]');
        const subjectRow = emailSim.querySelector('.email-row[data-indicator="subject"]');
        const cta = emailSim.querySelector('.email-cta');
        
        if (indicator === 'from' && fromRow) {
          fromRow.classList.toggle('selected', AppState.selectedIndicators.includes('from'));
        }
        if (indicator === 'subject' && subjectRow) {
          subjectRow.classList.toggle('selected', AppState.selectedIndicators.includes('subject'));
        }
        if (indicator === 'cta' && cta) {
          cta.classList.toggle('selected', AppState.selectedIndicators.includes('cta'));
        }
      }
    } else if (scenario.type === 'website') {
      const siteFrame = document.querySelector('.fake-site-frame');
      if (siteFrame) {
        const urlPill = siteFrame.querySelector('.url-pill');
        const urgent = siteFrame.querySelector('.urgent');
        const title = siteFrame.querySelector('.lock-title');
        
        if (indicator === 'url' && urlPill) {
          urlPill.classList.toggle('selected', AppState.selectedIndicators.includes('url'));
        }
        if (indicator === 'urgent' && urgent) {
          urgent.classList.toggle('selected', AppState.selectedIndicators.includes('urgent'));
        }
        if (indicator === 'title' && title) {
          title.classList.toggle('selected', AppState.selectedIndicators.includes('title'));
        }
      }
    }
  }
}

function toggleLinkIndicator(index, isSuspicious) {
  const key = `link-${index}`;
  const existingIndex = AppState.selectedIndicators.indexOf(key);
  
  if (existingIndex > -1) {
    AppState.selectedIndicators.splice(existingIndex, 1);
  } else {
    AppState.selectedIndicators.push(key);
  }
  
  updateSelectedCount();
  
  // Update visual selection state
  const linkRows = document.querySelectorAll('.link-row');
  if (linkRows[index]) {
    linkRows[index].classList.toggle('selected', AppState.selectedIndicators.includes(key));
  }
}

function toggleChatIndicator(index) {
  const key = `chat-${index}`;
  const existingIndex = AppState.selectedIndicators.indexOf(key);
  
  if (existingIndex > -1) {
    AppState.selectedIndicators.splice(existingIndex, 1);
  } else {
    AppState.selectedIndicators.push(key);
  }
  
  updateSelectedCount();
  
  // Update visual selection state
  const bubbles = document.querySelectorAll('.bubble');
  if (bubbles[index]) {
    bubbles[index].classList.toggle('selected', AppState.selectedIndicators.includes(key));
  }
}

function updateSelectedCount() {
  document.getElementById('indicators-found').textContent = `SELECTED: ${AppState.selectedIndicators.length}`;
}

function showHint() {
  const hintElement = document.getElementById('mission-hint');
  const scenario = Missions[AppState.currentMission].scenarios[AppState.currentScenario];
  
  if (hintElement.style.display === 'none') {
    hintElement.style.display = 'block';
    hintElement.textContent = "Look closely at the domain and content for suspicious patterns.";
    // Optional: deduct points for using hint
    // AppState.score = Math.max(0, AppState.score - 5);
  } else {
    hintElement.style.display = 'none';
  }
}

function submitMissionFindings() {
  const mission = Missions[AppState.currentMission];
  const scenario = mission.scenarios[AppState.currentScenario];
  
  // Calculate score based on correct indicators found
  const correctIndicators = getCorrectIndicators(scenario);
  const foundCorrect = AppState.selectedIndicators.filter(ind => correctIndicators.includes(ind)).length;
  const totalCorrect = correctIndicators.length;
  const incorrectSelections = AppState.selectedIndicators.filter(ind => !correctIndicators.includes(ind)).length;
  
  // Calculate points with penalty for incorrect selections
  // Each scenario is worth up to 10 pts (4 missions × 5 scenarios × 10 = 200 max)
  const basePoints = Math.round((foundCorrect / totalCorrect) * 10);
  const penalty = incorrectSelections * 1;
  const points = Math.max(0, basePoints - penalty);
  
  // Check if this scenario was already completed
  const missionProgress = AppState.missionProgress[AppState.currentMission];
  const existingScenario = missionProgress.scenarios.find(s => s.scenarioIndex === AppState.currentScenario);
  
  if (existingScenario) {
    // Only add points if this attempt improves the score
    const scoreImprovement = Math.max(0, points - existingScenario.score);
    AppState.score += scoreImprovement;
    
    // Update the scenario record with the new best score
    existingScenario.score = Math.max(existingScenario.score, points);
    existingScenario.indicatorsFound = Math.max(existingScenario.indicatorsFound, foundCorrect);
    existingScenario.totalIndicators = totalCorrect;
    existingScenario.incorrectSelections = incorrectSelections;
  } else {
    // First time completing this scenario
    AppState.score += points;
    
    // Save scenario progress
    missionProgress.scenarios.push({
      scenarioIndex: AppState.currentScenario,
      score: points,
      indicatorsFound: foundCorrect,
      totalIndicators: totalCorrect,
      incorrectSelections: incorrectSelections
    });
  }
  
  // Cap score at maximum possible (200)
  AppState.score = Math.min(AppState.score, 200);
  
  // Apply visual feedback to show correct/incorrect answers
  applyVisualFeedback(scenario, correctIndicators);
  
  // Show feedback after a short delay for visual effect
  setTimeout(() => {
    showFeedback(points, foundCorrect, totalCorrect, incorrectSelections, scenario);
  }, 500);
}

function applyVisualFeedback(scenario, correctIndicators) {
  if (scenario.type === 'links') {
    const linkRows = document.querySelectorAll('.link-row');
    linkRows.forEach((row, index) => {
      const key = `link-${index}`;
      const icon = row.querySelector('.link-icon');
      
      if (correctIndicators.includes(key)) {
        row.classList.add('correct');
        icon.textContent = '✓';
      } else if (AppState.selectedIndicators.includes(key)) {
        row.classList.add('incorrect');
        icon.textContent = '✗';
      } else {
        icon.textContent = '○';
      }
    });
  } else if (scenario.type === 'email') {
    const emailSim = document.querySelector('.email-sim');
    if (emailSim) {
      // Apply feedback to email elements
      const fromRow = emailSim.querySelector('.email-row[data-indicator="from"]');
      const subjectRow = emailSim.querySelector('.email-row[data-indicator="subject"]');
      const cta = emailSim.querySelector('.email-cta');
      
      if (fromRow && correctIndicators.includes('from')) {
        fromRow.classList.add('correct');
      } else if (fromRow && AppState.selectedIndicators.includes('from')) {
        fromRow.classList.add('incorrect');
      }
      
      if (subjectRow && correctIndicators.includes('subject')) {
        subjectRow.classList.add('correct');
      } else if (subjectRow && AppState.selectedIndicators.includes('subject')) {
        subjectRow.classList.add('incorrect');
      }
      
      if (cta && correctIndicators.includes('cta')) {
        cta.classList.add('correct');
      } else if (cta && AppState.selectedIndicators.includes('cta')) {
        cta.classList.add('incorrect');
      }
    }
  } else if (scenario.type === 'website') {
    const siteFrame = document.querySelector('.fake-site-frame');
    if (siteFrame) {
      const urlPill = siteFrame.querySelector('.url-pill');
      const urgent = siteFrame.querySelector('.urgent');
      const title = siteFrame.querySelector('.lock-title');
      
      if (urlPill && correctIndicators.includes('url')) {
        urlPill.classList.add('correct');
      } else if (urlPill && AppState.selectedIndicators.includes('url')) {
        urlPill.classList.add('incorrect');
      }
      
      if (urgent && correctIndicators.includes('urgent')) {
        urgent.classList.add('correct');
      } else if (urgent && AppState.selectedIndicators.includes('urgent')) {
        urgent.classList.add('incorrect');
      }
      
      if (title && correctIndicators.includes('title')) {
        title.classList.add('correct');
      } else if (title && AppState.selectedIndicators.includes('title')) {
        title.classList.add('incorrect');
      }
    }
  } else if (scenario.type === 'chat') {
    const bubbles = document.querySelectorAll('.bubble');
    bubbles.forEach((bubble, index) => {
      const key = `chat-${index}`;
      if (correctIndicators.includes(key)) {
        bubble.classList.add('correct');
      } else if (AppState.selectedIndicators.includes(key)) {
        bubble.classList.add('incorrect');
      }
    });
  }
}

function getCorrectIndicators(scenario) {
  if (scenario.type === 'email') {
    return scenario.content.flags || [];
  } else if (scenario.type === 'links') {
    return scenario.content
      .map((link, index) => link.suspicious ? `link-${index}` : null)
      .filter(Boolean);
  } else if (scenario.type === 'website') {
    return scenario.content.flags || [];
  } else if (scenario.type === 'chat') {
    return scenario.content
      .map((msg, index) => msg.flag ? `chat-${index}` : null)
      .filter(Boolean);
  }
  return [];
}

function getIndicatorName(indicator, scenario) {
  if (scenario.type === 'email') {
    const names = {
      'from': 'Sender Address',
      'subject': 'Subject Line',
      'cta': 'Call-to-Action Link'
    };
    return names[indicator] || indicator;
  } else if (scenario.type === 'links') {
    const linkIndex = parseInt(indicator.split('-')[1]);
    return `Suspicious URL #${linkIndex + 1}`;
  } else if (scenario.type === 'website') {
    const names = {
      'url': 'Website URL',
      'urgent': 'Urgency Message',
      'title': 'Page Title'
    };
    return names[indicator] || indicator;
  } else if (scenario.type === 'chat') {
    const chatIndex = parseInt(indicator.split('-')[1]);
    const message = scenario.content[chatIndex];
    return message ? message.flag : `Suspicious Message #${chatIndex + 1}`;
  }
  return indicator;
}

function showFeedback(points, found, total, incorrect, scenario) {
  document.getElementById('feedback-points').textContent = points > 0 ? `+${points} points` : `${points} points`;
  document.getElementById('feedback-summary').textContent = `${found} of ${total} indicators found${incorrect > 0 ? `, ${incorrect} incorrect selections` : ''}.`;
  
  const feedbackItems = document.getElementById('feedback-items');
  feedbackItems.innerHTML = '';
  
  const correctIndicators = getCorrectIndicators(scenario);
  const explanations = scenario.explanations || {};
  
  // Show detailed feedback for each indicator
  correctIndicators.forEach((indicator, index) => {
    const wasFound = AppState.selectedIndicators.includes(indicator);
    const explanation = explanations[indicator] || "This is a phishing indicator that attackers commonly use.";
    
    const feedbackItem = document.createElement('div');
    feedbackItem.className = 'feedback-item';
    feedbackItem.innerHTML = `
      <div class="fdot ${wasFound ? 'good' : 'bad'}"></div>
      <div>
        <h4>${wasFound ? '✓ CORRECTLY IDENTIFIED' : '✗ MISSED'}: ${getIndicatorName(indicator, scenario)}</h4>
        <p>${explanation}</p>
      </div>
    `;
    feedbackItems.appendChild(feedbackItem);
  });
  
  // Show feedback for incorrectly selected indicators
  AppState.selectedIndicators.forEach(indicator => {
    if (!correctIndicators.includes(indicator)) {
      const wrongItem = document.createElement('div');
      wrongItem.className = 'feedback-item';
      wrongItem.innerHTML = `
        <div class="fdot bad"></div>
        <div>
          <h4>✗ INCORRECTLY SELECTED: ${getIndicatorName(indicator, scenario)}</h4>
          <p>This is not actually a phishing indicator. Be careful not to flag legitimate elements.</p>
        </div>
      `;
      feedbackItems.appendChild(wrongItem);
    }
  });
  
  // Add summary if no indicators were found
  if (found === 0 && incorrect === 0) {
    const summaryItem = document.createElement('div');
    summaryItem.className = 'feedback-item';
    summaryItem.innerHTML = `
      <div class="fdot bad"></div>
      <div>
        <h4>NO INDICATORS FOUND</h4>
        <p>You didn't identify any phishing indicators. Review the hints and look for suspicious elements like fake domains, urgent language, and unusual requests.</p>
      </div>
    `;
    feedbackItems.appendChild(summaryItem);
  }
  
  // Update next button behavior
  const nextBtn = document.getElementById('feedback-next-btn');
  if (AppState.currentScenario < 4) {
    nextBtn.textContent = 'Next scenario →';
    nextBtn.onclick = nextScenario;
  } else {
    nextBtn.textContent = 'Complete mission →';
    nextBtn.onclick = completeMission;
  }
  
  showScreen('feedback');
}

function nextScenario() {
  AppState.currentScenario++;
  showMissionScenario();
}

function completeMission() {
  AppState.missionProgress[AppState.currentMission].completed = true;
  saveUserProgress();
  
  const mission = Missions[AppState.currentMission];
  const scenarios = AppState.missionProgress[AppState.currentMission].scenarios;
  
  // Calculate total points based on best scores for each scenario
  const totalPoints = scenarios.reduce((sum, s) => sum + s.score, 0);
  const totalFlags = scenarios.reduce((sum, s) => sum + s.indicatorsFound, 0);
  const totalPossible = scenarios.reduce((sum, s) => sum + s.totalIndicators, 0);
  
  document.getElementById('debrief-title').textContent = `${mission.name} cleared 🎉`;
  document.getElementById('debrief-summary').textContent = `5 of 5 scenarios complete.`;
  document.getElementById('debrief-points').textContent = totalPoints;
  document.getElementById('debrief-flags').textContent = `${totalFlags}/${totalPossible}`;
  
  // Show post-assessment button if all missions are complete but post-assessment not taken
  const allComplete = Object.values(AppState.missionProgress).every(m => m.completed);
  const postAssessmentBtn = document.getElementById('post-assessment-btn');
  if (allComplete && !AppState.currentUser.postAssessmentCompleted) {
    postAssessmentBtn.style.display = 'inline-block';
  } else {
    postAssessmentBtn.style.display = 'none';
  }
  
  showScreen('mission-debrief');
}

function startPostAssessment() {
  showScreen('post-assessment');
  initializePostAssessment();
}

// Post-Assessment
function initializePostAssessment() {
  AppState.postAssessmentIndex = 0;
  showPostAssessmentQuestion();
}

// Function to trigger post-assessment after all missions are complete
function checkIfAllMissionsComplete() {
  const allComplete = Object.values(AppState.missionProgress).every(mission => mission.completed);
  if (allComplete && !AppState.currentUser.postAssessmentCompleted) {
    showScreen('post-assessment');
    initializePostAssessment();
  }
}

function showPostAssessmentQuestion() {
  const question = AssessmentQuestions[AppState.postAssessmentIndex];
  const total = AssessmentQuestions.length;

  document.getElementById('post-assessment-label').textContent = `POST-ASSESSMENT - QUESTION ${AppState.postAssessmentIndex + 1}/${total}`;
  document.getElementById('post-assessment-scenario').textContent = question.scenario;
  document.getElementById('post-assessment-question').textContent = question.question;

  // Build progress bar segments
  const progressContainer = document.getElementById('post-assessment-progress');
  progressContainer.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const segment = document.createElement('div');
    segment.className = `progress-segment ${i < AppState.postAssessmentIndex + 1 ? 'filled' : ''}`;
    progressContainer.appendChild(segment);
  }

  // Build options with letters
  const optionsContainer = document.getElementById('post-assessment-options');
  optionsContainer.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  question.options.forEach((option, index) => {
    const optionElement = document.createElement('div');
    optionElement.className = 'option';
    optionElement.innerHTML = `<div class="option-letter">${letters[index]}</div>${option}`;
    optionElement.onclick = () => selectPostAssessmentOption(index, optionElement);
    optionsContainer.appendChild(optionElement);
  });

  AppState.selectedOption = null;
}

function selectPostAssessmentOption(index, element) {
  document.querySelectorAll('#post-assessment-options .option').forEach(opt => {
    opt.classList.remove('selected');
  });
  element.classList.add('selected');
  AppState.selectedOption = index;
}

function nextPostAssessment() {
  if (AppState.selectedOption === null) {
    alert('Please select an answer');
    return;
  }
  
  const question = AssessmentQuestions[AppState.postAssessmentIndex];
  if (AppState.selectedOption === question.correct) {
    AppState.postAssessmentScore++;
  }
  
  AppState.postAssessmentIndex++;
  
  if (AppState.postAssessmentIndex < AssessmentQuestions.length) {
    showPostAssessmentQuestion();
  } else {
    // Post-assessment complete, mark as completed and show results
    AppState.currentUser.postAssessmentCompleted = true;
    saveUserProgress();
    showResults();
  }
}

function showResults() {
  const prePercent = Math.round((AppState.preAssessmentScore / AssessmentQuestions.length) * 100);
  const postPercent = Math.round((AppState.postAssessmentScore / AssessmentQuestions.length) * 100);
  const improvement = postPercent - prePercent;
  
  document.getElementById('results-title').textContent = `Your awareness went up ${improvement} points 📈`;
  document.getElementById('pre-score-display').textContent = `${prePercent}%`;
  document.getElementById('post-score-display').textContent = `${postPercent}%`;
  document.getElementById('pre-score-bar').style.width = `${prePercent}%`;
  document.getElementById('post-score-bar').style.width = `${postPercent}%`;
  
  showScreen('results');
}

function downloadReport() {
  const prePercent = Math.round((AppState.preAssessmentScore / AssessmentQuestions.length) * 100);
  const postPercent = Math.round((AppState.postAssessmentScore / AssessmentQuestions.length) * 100);
  const improvement = postPercent - prePercent;
  
  const report = `
PHISHQUEST TRAINING REPORT
==========================
Generated: ${new Date().toLocaleDateString()}

PARTICIPANT: ${AppState.currentUser.username}
AGENT NUMBER: #${AppState.currentUser.agentNumber}
EMAIL: ${AppState.currentUser.email}

ASSESSMENT RESULTS
------------------
Pre-Assessment Score: ${prePercent}%
Post-Assessment Score: ${postPercent}%
Improvement: +${improvement}%

MISSION PROGRESS
----------------
Total Score: ${AppState.score}/200
Scenarios Completed: ${AppState.scenariosCompleted}/20

MISSION DETAILS
---------------
Email Detective: ${AppState.missionProgress[1].completed ? 'Completed' : 'In Progress'}
Link Hunter: ${AppState.missionProgress[2].completed ? 'Completed' : AppState.missionProgress[2].scenarios.length > 0 ? 'In Progress' : 'Not Started'}
Fake Website: ${AppState.missionProgress[3].completed ? 'Completed' : AppState.missionProgress[3].scenarios.length > 0 ? 'In Progress' : 'Not Started'}
Social Engineering: ${AppState.missionProgress[4].completed ? 'Completed' : AppState.missionProgress[4].scenarios.length > 0 ? 'In Progress' : 'Not Started'}

CURRENT RANK: ${getRank(AppState.score)}
  `;
  
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `phishquest-report-${AppState.currentUser.username}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showScreen('login');

  // Add email validation on blur for registration
  const registerEmail = document.getElementById('register-email');
  if (registerEmail) {
    registerEmail.addEventListener('blur', () => {
      const email = registerEmail.value.trim();
      const errorElement = document.getElementById('register-error');
      if (email && !email.toLowerCase().endsWith('@gmail.com')) {
        errorElement.textContent = 'Please use a Gmail address to sign in';
      } else if (email) {
        errorElement.textContent = '';
      }
    });
  }

  // Close rank popup when clicking outside
  const rankPopup = document.getElementById('rank-popup');
  if (rankPopup) {
    rankPopup.addEventListener('click', (e) => {
      if (e.target === rankPopup) {
        hideRankPopup();
      }
    });
  }
});