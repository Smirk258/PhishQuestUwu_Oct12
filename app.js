const RANK_TIERS={'NOVICE HUNTER':1,'JUNIOR AGENT':2,'SKILLED OPERATIVE':3,'SENIOR AGENT':4,'MASTER HUNTER':5};function rankTier(n){return RANK_TIERS[n]||1;}
function icon(n,c){return '<svg class="ic'+(c?' '+c:'')+'" aria-hidden="true"><use href="#i-'+n+'"/></svg>';}
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
    4: { completed: false, scenarios: [] },
    5: { completed: false, scenarios: [] },
    6: { completed: false, scenarios: [] }
  },
  preAssessmentScore: 0,
  postAssessmentScore: 0,
  selectedIndicators: [],
  selectedOption: null,
  streak: 0,
  chatTimers: []
};

// Make AppState available globally for auth.js
window.AppState = AppState;

// Mission Data - 5 scenarios per mission
// Email / website scenarios use `hotspots`: id -> { flag, name, why | safe }.
//   flag:true  = a real phishing indicator (explained by `why`)
//   flag:false = a legitimate element that is easy to mistake for one (explained by `safe`)
const Missions = {
  1: {
    name: "Email Detective",
    scenarios: [
      {
        title: "The Suspended Account", difficulty: "Easy", type: "email",
        instruction: "Tap anything in this email that looks suspicious.",
        hint: "Compare the sender's domain with the one your college really uses.",
        email: {
          fromName: "State College IT", fromAddr: "no-reply@statecollege-helpdesk.com",
          to: "william.cadet@statecollege.edu", time: "7:42 AM",
          subject: "Action required: your account will be deactivated in 24 hours",
          greeting: "Hi William,",
          body: [
            { text: "We were unable to verify your school account during our latest security review." },
            { text: "Please confirm your details today to keep your access." }
          ],
          button: { text: "Verify My Account", url: "http://statecollege-verify.co/login?ref=7f3a" },
          signature: "IT Services Team",
          footer: "State College · 100 University Avenue"
        },
        hotspots: {
          from: { flag: true, name: "Sender address", why: "The college's real domain is statecollege.edu. 'statecollege-helpdesk.com' is a lookalike domain registered by someone else." },
          subject: { flag: true, name: "Subject line", why: "A 24-hour deadline is a pressure tactic. Phishers rush you so you act before you think." },
          cta: { flag: true, name: "Verify button", why: "The link goes to 'statecollege-verify.co', not the college's site. Real IT teams never ask you to verify your account through an email link." },
          greeting: { flag: false, name: "Greeting", safe: "A personal greeting doesn't make an email safe, but it isn't a red flag by itself. Attackers can also find your name online." },
          signature: { flag: false, name: "Signature", safe: "A plain sign-off is normal. Judge the sender address and the link, not the signature." },
          footer: { flag: false, name: "Footer", safe: "Footers are easy to copy, so they prove nothing either way. They weren't the problem here." }
        }
      },
      {
        title: "The Invoice", difficulty: "Medium", type: "email",
        instruction: "This email looks routine. Tap anything that doesn't add up.",
        hint: "Check where replies would actually go, and what the attachment really is.",
        email: {
          fromName: "Northwind Supplies – Billing", fromAddr: "billing@northwind-supplies.com",
          replyTo: "billing@northwind-payments.biz",
          to: "accounts@brightlane.co", time: "10:18 AM",
          subject: "Invoice #4471 for September",
          greeting: "Hello,",
          body: [
            { text: "Please find the attached invoice for September's order." },
            { text: "Payment is due within 30 days. Let us know if you have any questions." }
          ],
          attachment: { name: "Invoice_4471.pdf.exe", size: "212 KB" },
          signature: "Northwind Supplies Accounts Team",
          footer: "Northwind Supplies Ltd. · Accounts Department"
        },
        hotspots: {
          from: { flag: false, name: "Sender address", safe: "This address matches the vendor's real domain, so on its own it looks fine. Always keep checking the other details." },
          replyto: { flag: true, name: "Reply-To address", why: "Replies would go to 'northwind-payments.biz', a different domain from the sender. This is a common trick for redirecting payments." },
          subject: { flag: false, name: "Subject line", safe: "A plain, specific subject is normal for an invoice. It isn't suspicious by itself." },
          attach: { flag: true, name: "Attachment", why: "'.pdf.exe' is an executable program disguised as a PDF. Real invoices are never .exe files." },
          signature: { flag: false, name: "Signature", safe: "The sign-off is ordinary. Attackers copy these easily, so it proves nothing." }
        }
      },
      {
        title: "The Parcel Notice", difficulty: "Easy", type: "email",
        instruction: "Tap the parts of this delivery notice that look wrong.",
        hint: "Delivery companies don't ask for payment through a link in an email.",
        email: {
          fromName: "PostBox Delivery", fromAddr: "tracking@postbox-delivery.top",
          to: "you@gmail.com", time: "3:12 PM",
          subject: "Your parcel is on its way",
          greeting: "Hello,",
          body: [
            { text: "Your parcel is scheduled for delivery tomorrow." },
            { text: "Tracking number: <b>PB-48820193</b>", hs: "tracking" },
            { text: "A customs fee of $1.99 is required before delivery.", hs: "fee" }
          ],
          button: { text: "Pay Fee & Reschedule", url: "http://bit.ly/3xPq-pay" },
          signature: "PostBox Customer Care",
          footer: "PostBox Delivery · Do not reply to this message"
        },
        hotspots: {
          from: { flag: true, name: "Sender address", why: "'.top' is a cheap, rarely legitimate domain extension, and 'postbox-delivery' isn't the courier's real domain." },
          subject: { flag: false, name: "Subject line", safe: "A calm, ordinary subject is exactly how a good phish looks. It isn't a flag on its own." },
          tracking: { flag: false, name: "Tracking number", safe: "A tracking number looks official, but anyone can invent one. It isn't evidence either way." },
          fee: { flag: true, name: "Fee request", why: "Surprise fees demanded through an email link are a classic way to steal card details." },
          cta: { flag: true, name: "Pay button", why: "The link is a shortened bit.ly address that hides where you'll really land. Real couriers use their own domain." },
          footer: { flag: false, name: "Footer", safe: "'Do not reply' is common in automated email, so it isn't suspicious by itself." }
        }
      },
      {
        title: "The Library Reminder", difficulty: "Hard", type: "email",
        instruction: "Most of this email is legitimate. Find the one thing that isn't.",
        hint: "Think about what a real library would never ask you to send by email.",
        email: {
          fromName: "State College Library", fromAddr: "library@statecollege.edu",
          to: "william.cadet@statecollege.edu", time: "9:05 AM",
          subject: "Reminder: 'Networks 101' is due Friday",
          greeting: "Hi William,",
          body: [
            { text: "Your borrowed book is due this Friday. You can renew it online in a few clicks." },
            { text: "To renew by email instead, reply with your student ID and password.", hs: "ask" }
          ],
          button: { text: "Renew online", url: "https://library.statecollege.edu/account" },
          signature: "Library Services",
          footer: "State College Library · Open Mon–Sat, 8 AM–8 PM"
        },
        hotspots: {
          from: { flag: false, name: "Sender address", safe: "This is the college's real .edu domain. A correct sender plus a normal request is not a red flag." },
          subject: { flag: false, name: "Subject line", safe: "A specific, ordinary subject about a book you really borrowed is fine." },
          ask: { flag: true, name: "Password request", why: "No library or IT team will ever ask you to email your password. Even from a real-looking address, that request alone makes it a phish." },
          cta: { flag: false, name: "Renew button", safe: "This link goes to library.statecollege.edu, the college's own domain, so it is safe. Not every link is a trap." },
          footer: { flag: false, name: "Footer", safe: "Opening hours are normal footer details." }
        }
      },
      {
        title: "The Urgent Favor", difficulty: "Hard", type: "email",
        instruction: "Your boss emailed you. Does everything check out?",
        hint: "Executives rarely use free webmail for work, and rarely ask for gift cards.",
        email: {
          fromName: "Dana Whitfield (CEO)", fromAddr: "dana.whitfield.ceo@gmail.com",
          to: "you@brightlane.co", time: "6:05 AM",
          subject: "Quick favor – are you at your desk?",
          greeting: "Hi,",
          body: [
            { text: "I'm stuck in meetings all day and need you to buy 5 gift cards for a client.", hs: "ask" },
            { text: "Keep this between us for now. I'll reimburse you today." }
          ],
          signature: "Sent from my iPhone",
          footer: ""
        },
        hotspots: {
          from: { flag: true, name: "Sender address", why: "A CEO writing about company business from a free Gmail address is a strong sign of impersonation. The display name is easy to fake." },
          subject: { flag: false, name: "Subject line", safe: "Short, casual subjects are normal at work. On its own it proves nothing." },
          ask: { flag: true, name: "Gift card request", why: "Gift cards are untraceable, which is why scammers ask for them. Combined with secrecy, it's a textbook business-email scam." },
          signature: { flag: false, name: "Signature", safe: "'Sent from my iPhone' is a default signature that scammers can copy. It's not a flag either way." }
        }
      }
    ]
  },
  2: {
    name: "Link Hunter",
    scenarios: [
      {
        title: "Lookalike Logins", difficulty: "Easy", type: "links",
        context: "Pasted into a group chat after a \"security alert\"",
        instruction: "Select the URLs that look suspicious.",
        hint: "Look closely at the bold part of each address. That is the real domain.",
        content: [
          { url: "https://www.facebook.com", brand: "facebook", suspicious: false },
          { url: "https://www.faceb00k-security-login.com", brand: "facebook", suspicious: true },
          { url: "https://www.microsoft.com", brand: "microsoft", suspicious: false },
          { url: "https://microsoft.verify-account.xyz", brand: "microsoft", suspicious: true }
        ],
        explanations: {
          "link-1": "This URL uses zeros in place of the letter 'o' in 'faceb00k', a homoglyph trick that fools quick glances.",
          "link-3": "'microsoft' is only a subdomain here. The real domain, the bold part, is 'verify-account.xyz', which Microsoft doesn't own."
        }
      },
      {
        title: "Doubled Letters", difficulty: "Easy", type: "links",
        context: "Top results when someone searched for their account page",
        instruction: "Identify the suspicious URLs.",
        hint: "Check for added words and extra letters in the domain.",
        content: [
          { url: "https://www.amazon.com", brand: "amazon", suspicious: false },
          { url: "https://amazon-security-check.net", brand: "amazon", suspicious: true },
          { url: "https://www.apple.com", brand: "apple", suspicious: false },
          { url: "https://www.appple-id-verify.com", brand: "apple", suspicious: true }
        ],
        explanations: {
          "link-1": "Amazon's real domain is amazon.com. 'amazon-security-check.net' is a different site that just borrows the name.",
          "link-3": "'appple' has three p's instead of two, a deliberate misspelling to catch you off guard."
        }
      },
      {
        title: "Bank Alerts", difficulty: "Medium", type: "links",
        context: "Links collected from an email's footer",
        instruction: "Select the malicious links.",
        hint: "Look for http instead of https, odd endings like .xyz or .tk, and extra words around a brand.",
        content: [
          { url: "https://www.netflix.com", brand: "netflix", suspicious: false },
          { url: "http://netflix-login-verify.tk", brand: "netflix", suspicious: true },
          { url: "https://www.bankofamerica.com", brand: "boa", suspicious: false },
          { url: "https://bankofamerica-secure-login.xyz", brand: "boa", suspicious: true },
          { url: "https://www.chase.com", brand: "chase", suspicious: false },
          { url: "https://chase-bank-alert.co", brand: "chase", suspicious: true }
        ],
        explanations: {
          "link-1": "This uses http, so the connection isn't encrypted, and '.tk' is a free domain ending that phishers love.",
          "link-3": "Bank of America would never use 'secure-login.xyz'. The real domain here is not bankofamerica.com.",
          "link-5": "Chase's real domain is chase.com. 'chase-bank-alert.co' is a separate site wearing the bank's name."
        }
      },
      {
        title: "Career Moves", difficulty: "Medium", type: "links",
        context: "Shared in a message from a \"recruiter\"",
        instruction: "Find the phishing URLs.",
        hint: "A real brand's domain is short. Be wary of long names with extra words.",
        content: [
          { url: "https://www.linkedin.com", brand: "linkedin", suspicious: false },
          { url: "https://linkedin-career-update.net", brand: "linkedin", suspicious: true },
          { url: "https://www.twitter.com", brand: "twitter", suspicious: false },
          { url: "https://twiiter-account-secure.com", brand: "twitter", suspicious: true }
        ],
        explanations: {
          "link-1": "LinkedIn's real domain is linkedin.com. This address is a different domain with career-themed bait words.",
          "link-3": "'twiiter' has two i's and no 't' in the right place, a common misspelling trick."
        }
      },
      {
        title: "Number Swaps", difficulty: "Hard", type: "links",
        context: "Pop-up that appeared on a shared computer",
        instruction: "Identify all suspicious links.",
        hint: "Letters swapped for numbers, and endings that don't match the brand.",
        content: [
          { url: "https://www.instagram.com", brand: "instagram", suspicious: false },
          { url: "https://1nstagram-verify-account.com", brand: "instagram", suspicious: true },
          { url: "https://www.paypal.com", brand: "paypal", suspicious: false },
          { url: "https://paypal-secure-login.site", brand: "paypal", suspicious: true },
          { url: "https://www.ebay.com", brand: "ebay", suspicious: false },
          { url: "https://ebay-account-alert.xyz", brand: "ebay", suspicious: true }
        ],
        explanations: {
          "link-1": "'1nstagram' swaps the letter 'i' for the number 1, a leetspeak substitution.",
          "link-3": "PayPal would never use 'secure-login.site'. That domain ending is often used for phishing.",
          "link-5": "eBay's real domain is ebay.com. 'ebay-account-alert.xyz' only borrows the name."
        }
      }
    ]
  },
  3: {
    name: "Fake Website",
    scenarios: [
      {
        title: "Session Timeout", difficulty: "Easy", type: "website",
        instruction: "Tap anything on this login page that looks suspicious.",
        hint: "A padlock only means the connection is encrypted. Check who you are connected to.",
        content: {
          tab: "State College Portal", url: "portal-secure-login.verify-access.xyz", secure: true, theme: "#1a4fc4",
          brand: "STATE COLLEGE PORTAL", heading: "Student sign in",
          banner: { tone: "warn", text: "Your session will expire in 2 minutes. Sign in to continue." },
          fields: [{ label: "College email", value: "william.cadet@statecollege.edu" }, { label: "Password", pass: true }],
          button: "Sign in", links: ["Forgot password?", "Help"],
          footer: "© 2026 State College · Privacy · Terms"
        },
        hotspots: {
          url: { flag: true, name: "Website address", why: "The real domain is 'verify-access.xyz', not the college's .edu domain. Everything before it is just decoration." },
          lock: { flag: false, name: "Padlock", safe: "The padlock only shows the connection is encrypted. Phishing sites can get one too, so it doesn't prove the site is real." },
          brand: { flag: false, name: "Logo / title", safe: "Logos and titles are trivial to copy. They can't tell you whether a page is genuine." },
          banner: { flag: true, name: "Urgency banner", why: "Real portals don't count down two-minute deadlines. The pressure is meant to stop you from checking the address." },
          footer: { flag: false, name: "Footer", safe: "Footer text is easy to copy and proves nothing." }
        }
      },
      {
        title: "Locked Account", difficulty: "Medium", type: "website",
        instruction: "Find what's wrong with this banking page.",
        hint: "Think about what a bank's sign-in page would never ask for.",
        content: {
          tab: "National Bank – Sign in", url: "bank-secure-login.online-banking.xyz", secure: true, theme: "#0b6b4f",
          brand: "NATIONAL BANK", heading: "Online banking",
          banner: { tone: "bad", text: "Your account has been locked. Sign in to unlock it." },
          fields: [{ label: "Online ID", value: "wcadet88" }, { label: "Password", pass: true }, { label: "ATM PIN", pass: true, hs: "pin" }],
          button: "Unlock account", links: ["Forgot ID?", "Security centre"],
          footer: "© 2026 National Bank · Member FDIC"
        },
        hotspots: {
          url: { flag: true, name: "Website address", why: "'online-banking.xyz' is the real domain, and it isn't the bank's. Banks use their own short, well-known domains." },
          lock: { flag: false, name: "Padlock", safe: "The padlock is present on many phishing sites, so it isn't a flag by itself." },
          banner: { flag: true, name: "Account-locked banner", why: "A scary 'account locked' message is meant to rush you into signing in without thinking." },
          pin: { flag: true, name: "ATM PIN field", why: "A sign-in page should never ask for your ATM PIN. Asking for it is a sure sign the page is trying to steal card access." },
          footer: { flag: false, name: "Footer", safe: "'Member FDIC' text is easy to copy. It tells you nothing about the page's safety." }
        }
      },
      {
        title: "Mailbox Full", difficulty: "Medium", type: "website",
        instruction: "Tap the warning signs on this email sign-in page.",
        hint: "Check the browser's security label, then read the address from right to left.",
        content: {
          tab: "Outlook – Sign in", url: "email-login-verify.microsoft-secure.net", secure: false, theme: "#0f6cbd",
          brand: "MICROSOFT OUTLOOK", heading: "Sign in to your mailbox",
          banner: { tone: "warn", text: "Your mailbox is full. Sign in within 1 hour or messages will be deleted." },
          fields: [{ label: "Email address", value: "wcadet@outlook.com" }, { label: "Password", pass: true }, { label: "Keep me signed in", check: true, hs: "keep" }],
          button: "Sign in", links: ["Can't access your account?", "Sign-in options"],
          footer: "© 2026 Microsoft · Privacy · Terms"
        },
        hotspots: {
          url: { flag: true, name: "Website address", why: "The bold domain is 'microsoft-secure.net', not microsoft.com. 'email-login-verify' is just a subdomain used as camouflage." },
          lock: { flag: true, name: "Security label", why: "'Not secure' means this sign-in page isn't encrypted, so anything you type could be intercepted." },
          banner: { flag: true, name: "Mailbox warning", why: "A one-hour deadline to avoid deletion is fear and urgency again, designed to hurry you." },
          keep: { flag: false, name: "'Keep me signed in'", safe: "That checkbox is a normal feature on real sign-in pages." },
          brand: { flag: false, name: "Logo / title", safe: "The branding is copied from the real site and tells you nothing." }
        }
      },
      {
        title: "Scheduled Maintenance", difficulty: "Hard", type: "website",
        instruction: "This page has the right address. Is everything else okay?",
        hint: "Which field on a student sign-in page doesn't belong?",
        content: {
          tab: "State College – Sign in", url: "accounts.statecollege.edu/login", secure: true, theme: "#1a4fc4",
          brand: "STATE COLLEGE", heading: "Student sign in",
          banner: { tone: "info", text: "Scheduled maintenance: the portal will be offline Sunday, 2–4 AM." },
          fields: [{ label: "Student ID", value: "02000123456" }, { label: "Password", pass: true }, { label: "Social Security Number", pass: true, hs: "ssn" }],
          button: "Sign in", links: ["Forgot password?", "Contact IT"],
          footer: "© 2026 State College · Privacy · Terms"
        },
        hotspots: {
          url: { flag: false, name: "Website address", safe: "'statecollege.edu' is the college's real domain, so this address is fine. A correct address plus a bad request is still a phish." },
          lock: { flag: false, name: "Padlock", safe: "A padlock on a legitimate .edu address is expected." },
          banner: { flag: false, name: "Maintenance notice", safe: "A calm notice with a specific off-hours window is normal. It doesn't pressure you to act." },
          ssn: { flag: true, name: "Social Security Number field", why: "A college sign-in page has no reason to ask for your SSN. If a page requests it, leave." },
          footer: { flag: false, name: "Footer", safe: "Ordinary footer text." }
        }
      },
      {
        title: "Checkout Alert", difficulty: "Hard", type: "website",
        instruction: "Spot what's fishy about this checkout page.",
        hint: "Read the domain slowly and watch the clock.",
        content: {
          tab: "Amazon Checkout", url: "www.amaz0n-payments.com/checkout", secure: true, theme: "#f08804",
          brand: "amazon", heading: "Confirm your payment",
          banner: { tone: "warn", text: "Confirm payment within 10 minutes to keep your order." },
          fields: [{ label: "Card number", value: "•••• •••• •••• 4417" }, { label: "Expiry", value: "08 / 28" }, { label: "CVV", pass: true }],
          button: "Confirm payment", links: ["Return to cart", "Need help?"],
          footer: "© 1996–2026 Amazon.com, Inc."
        },
        hotspots: {
          url: { flag: true, name: "Website address", why: "'amaz0n-payments.com' uses a zero instead of the letter 'o' and isn't Amazon's domain." },
          lock: { flag: false, name: "Padlock", safe: "The padlock doesn't tell you whose site you are on, so it isn't a signal here." },
          banner: { flag: true, name: "Payment countdown", why: "Real stores don't force 10-minute payment windows. It's pressure to stop you looking closely." },
          brand: { flag: false, name: "Logo", safe: "The logo is copied from the real site and doesn't help you decide." },
          footer: { flag: false, name: "Footer", safe: "A copyright line is trivial to copy." }
        }
      }
    ]
  },
  4: {
    name: "Social Engineering",
    scenarios: [
      {
        title: "Update Required", difficulty: "Easy", type: "chat",
        contact: { name: "IT Helpdesk", status: "Active now", color: "#1a4fc4" },
        instruction: "Tap any message that looks like a suspicious request.",
        hint: "Support staff will never ask for multi-factor security codes.",
        content: [
          { sender: "them", message: "Hi, I'm from IT. We're updating your account today.", flag: "UNSOLICITED OUTREACH" },
          { sender: "me", message: "Oh, I didn't know there was an update today. Do I need to do anything?" },
          { sender: "them", message: "Nothing complicated. It only takes a minute." },
          { sender: "me", message: "Okay, what do you need from me?" },
          { sender: "them", message: "Send me your verification code so I can complete the update.", flag: "CREDENTIAL HARVESTING" }
        ],
        explanations: {
          "chat-0": "IT teams don't message you out of the blue about 'account updates'. They announce maintenance through official channels.",
          "chat-4": "Verification codes (MFA) protect your account. Sharing one gives an attacker full access."
        },
        safeNotes: { "chat-2": "Friendly reassurance is common in scams, but this line makes no request, so it isn't the problem. The code request is." }
      },
      {
        title: "Purchase Verification", difficulty: "Easy", type: "chat",
        contact: { name: "Amazon Support", status: "Typically replies instantly", color: "#f08804" },
        instruction: "Identify the suspicious messages in this chat.",
        hint: "Real support won't ask for card numbers or passwords in a chat.",
        content: [
          { sender: "them", message: "Hello! This is Amazon Support. We need to verify your purchase.", flag: "IMPERSONATION" },
          { sender: "me", message: "I didn't make any recent purchases." },
          { sender: "them", message: "No problem, I can help you cancel it right now." },
          { sender: "me", message: "Okay, thanks." },
          { sender: "them", message: "Please provide your credit card number to cancel the transaction.", flag: "FINANCIAL REQUEST" }
        ],
        explanations: {
          "chat-0": "Amazon doesn't start chats to 'verify purchases'. It uses official notifications in your account.",
          "chat-4": "No real company asks for your full card number in a chat. Cancelling a charge never needs it."
        },
        safeNotes: { "chat-2": "Offering to help cancel isn't a request for anything. The harm comes in the next message." }
      },
      {
        title: "The CEO's Request", difficulty: "Medium", type: "chat",
        contact: { name: "Dana (CEO)", status: "Last seen recently", color: "#6d28d9" },
        instruction: "Find the social engineering attempts.",
        hint: "Look for urgency, authority claims, and requests to skip the usual checks.",
        content: [
          { sender: "them", message: "Hi, are you at your desk?" },
          { sender: "me", message: "Yes, what's up?" },
          { sender: "them", message: "URGENT: I need your help with a wire transfer.", flag: "AUTHORITY ABUSE" },
          { sender: "me", message: "Really? What do you need?" },
          { sender: "them", message: "Transfer $5,000 to this account immediately. It's confidential.", flag: "FINANCIAL URGENCY" },
          { sender: "me", message: "I should check with the CEO first." },
          { sender: "them", message: "No time! I'm in a meeting. Do it now or the company loses money!", flag: "PRESSURE TACTICS" }
        ],
        explanations: {
          "chat-2": "Impersonating an executive to demand a wire transfer is a well-known scam. Real leaders follow finance procedures.",
          "chat-4": "Urgent, secret payment requests are the signature of business-email scams.",
          "chat-6": "Stopping you from verifying is manipulation. Genuine requests welcome a quick check."
        },
        safeNotes: { "chat-0": "A casual 'are you at your desk?' is how many scams begin, but it asks for nothing yet." }
      },
      {
        title: "A Friend in Need", difficulty: "Medium", type: "chat",
        contact: { name: "Mika", status: "Last seen recently", color: "#be185d" },
        instruction: "Spot the suspicious communication.",
        hint: "Watch for unusual requests, even from someone you know.",
        content: [
          { sender: "them", message: "Hey! How was the exam?" },
          { sender: "me", message: "Hey! It was fine, you?" },
          { sender: "them", message: "Can you send me your login credentials? I need to check something.", flag: "CREDENTIAL REQUEST" },
          { sender: "me", message: "Why do you need my login?" },
          { sender: "them", message: "Just trust me, it's important. I'll explain later.", flag: "EVASION" }
        ],
        explanations: {
          "chat-2": "A friend or colleague should never need your login. This is a classic sign their account has been taken over.",
          "chat-4": "Evasion and secrecy are red flags. A genuine request can be explained immediately."
        },
        safeNotes: { "chat-0": "Friendly small talk is normal. It only turns suspicious when the request arrives." }
      },
      {
        title: "Payroll Pressure", difficulty: "Hard", type: "chat",
        contact: { name: "HR Department", status: "Active now", color: "#0e7490" },
        instruction: "Identify all the social engineering red flags.",
        hint: "Look for impersonation, a made-up deadline, and threats.",
        content: [
          { sender: "them", message: "Good morning! Hope your week is going well." },
          { sender: "them", message: "This is HR. We need your SSN for a payroll update.", flag: "IMPERSONATION" },
          { sender: "me", message: "Shouldn't this go through official channels?" },
          { sender: "them", message: "System is down, need it now or your paycheck will be delayed.", flag: "URGENCY" },
          { sender: "me", message: "I'll wait until the system is back up." },
          { sender: "them", message: "This is your final warning. Send your SSN immediately or face disciplinary action.", flag: "THREATS" }
        ],
        explanations: {
          "chat-1": "HR handles sensitive data through secure, official systems, never casual chat requests.",
          "chat-3": "A 'system outage' is never a reason to bypass security procedures. It's a manipulation tactic.",
          "chat-5": "Threatening you with consequences is intimidation meant to force compliance."
        },
        safeNotes: { "chat-0": "A friendly greeting asks for nothing. The requests that follow are the issue." }
      }
    ]
  },
  5: {
    name: "Pop-up Phishing",
    scenarios: [
      {
        title: "You've Won!", difficulty: "Easy", type: "popup",
        instruction: "A pop-up appeared while you were reading the news. Tap anything that looks suspicious.",
        hint: "Where does GCash really announce rewards? And what is a countdown for?",
        content: {
          tab: "Balita Ngayon", url: "balitangayon.com.ph/lokal/ulan-update", secure: true,
          site: { name: "BALITA NGAYON", headline: "PAGASA: Moderate to heavy rains expected in Metro Manila", hs: "site" },
          cookie: { text: "We use cookies to improve your experience.", button: "Accept", hs: "cookie" },
          popup: {
            style: "promo",
            head: { text: "GCASH PROMO CENTER" },
            title: { text: "CONGRATULATIONS! You won ₱50,000", hs: "prize" },
            body: [{ text: "You are today's lucky visitor. Claim your cash prize now!" }],
            timer: { text: "Claim within 04:59", hs: "timer" },
            buttons: [{ text: "CLAIM NOW", primary: true }],
            small: { text: "Claim at: gcash-rewards.promo-ph.xyz", hs: "claimurl" }
          }
        },
        hotspots: {
          url: { flag: false, name: "Website address", safe: "This is the news site you were really reading, so the address bar is fine. The pop-up is the problem, not the page behind it." },
          cookie: { flag: false, name: "Cookie notice", safe: "Cookie notices are normal on websites and are not a red flag on their own." },
          site: { flag: false, name: "News headline", safe: "The article is ordinary content. Pop-ups can appear on top of any page, even a real one." },
          prize: { flag: true, name: "Prize announcement", why: "A prize you never entered for is bait. GCash says real rewards and promos are announced only inside its official app, not on random web pages." },
          timer: { flag: true, name: "Countdown timer", why: "The countdown exists to rush you before you can stop and check. Real giveaways don't expire in five minutes." },
          claimurl: { flag: true, name: "Claim link", why: "The real domain here is 'promo-ph.xyz', which isn't GCash's. Fake portals like this copy GCash's look to collect your number, OTP and MPIN." }
        }
      },
      {
        title: "Your Phone Is Infected", difficulty: "Easy", type: "popup",
        instruction: "This warning popped up in your phone's browser while you looked up a recipe. Is it real?",
        hint: "Can a website really scan your phone? Who gives genuine security warnings?",
        content: {
          tab: "Lutong Bahay", url: "lutongbahay.com.ph/adobo", secure: true,
          site: { name: "LUTONG BAHAY", headline: "Easy Chicken Adobo, Ready in 30 Minutes", hs: "site" },
          popup: {
            style: "alert",
            head: { text: "SYSTEM SECURITY ALERT", hs: "fakesys" },
            title: { text: "5 viruses found on your phone!", hs: "scare" },
            body: [{ text: "Your battery is damaged and your photos and GCash are at risk. Install Fast Cleaner now to remove them." }],
            buttons: [{ text: "Install Fast Cleaner", primary: true, hs: "install" }, { text: "Later" }],
            small: { text: "Scan completed in 2.1 seconds" }
          }
        },
        hotspots: {
          url: { flag: false, name: "Website address", safe: "That is the recipe site you chose to visit, so the address is fine. The pop-up is what doesn't belong." },
          site: { flag: false, name: "Recipe headline", safe: "The page behind the pop-up is ordinary content. Scam pop-ups can appear over any website." },
          fakesys: { flag: true, name: "\"System\" header", why: "Websites can't see inside your phone. This 'system' box is just part of a web page dressed up to look like Android." },
          scare: { flag: true, name: "Virus warning", why: "No website can scan your phone for viruses, least of all in 2 seconds. Scare messages like this are meant to push you into installing something." },
          install: { flag: true, name: "Install button", why: "It pushes an app from outside the official store, often malware or something that steals data. Real security apps come from your app store, not from a pop-up." }
        }
      },
      {
        title: "Human Verification", difficulty: "Medium", type: "popup",
        instruction: "A free-movie site is asking for something. Tap the parts that look wrong.",
        hint: "What does 'Allow' actually give this website?",
        content: {
          tab: "Pelikula Online", url: "pelikula-online.stream/watch", secure: true,
          site: { name: "PELIKULA ONLINE", headline: "Watch the latest movies free, no sign-up" },
          pagemsg: { text: "Click \"Allow\" to verify that you are not a robot", hs: "pagemsg" },
          popup: {
            style: "permission",
            title: { text: "pelikula-online.stream wants to", hs: "prompt" },
            body: [{ text: "Show notifications" }],
            buttons: [{ text: "Block", hs: "block" }, { text: "Allow", primary: true, hs: "allow" }]
          }
        },
        hotspots: {
          url: { flag: true, name: "Website address", why: "Free-movie sites with unfamiliar endings like '.stream' are a common home for scam pop-ups. Treat unfamiliar sites with extra care." },
          pagemsg: { flag: true, name: "\"Verify you're not a robot\" text", why: "A real robot check never needs you to allow notifications. This line is the trick that gets you to click Allow." },
          allow: { flag: true, name: "Allow button", why: "Allowing notifications lets the site push pop-ups straight to your screen at any time, which scammers use to send fake alerts, prizes and malicious links." },
          prompt: { flag: false, name: "Permission box", safe: "This box is your browser's own permission prompt, which is genuine. It is simply asking a question. What matters is your answer." },
          block: { flag: false, name: "Block button", safe: "Block is the safe choice here, so it is not a red flag." }
        }
      },
      {
        title: "Free Data Promo", difficulty: "Medium", type: "popup",
        instruction: "A promo box covers a forum page. Tap what doesn't add up.",
        hint: "Think about what an OTP is really for.",
        content: {
          tab: "Kwentuhan Forum", url: "kwentuhan.com.ph/threads/budget-phones", secure: true,
          site: { name: "KWENTUHAN FORUM", headline: "Best budget phones under ₱8,000 this year", hs: "site" },
          popup: {
            style: "modal",
            head: { text: "MABUHAY MOBILE", hs: "brand" },
            title: { text: "Free 10GB for 7 days!" },
            body: [{ text: "Enter your mobile number and the OTP we send you to claim your free data." }],
            fields: [{ label: "Mobile number", value: "09XX XXX XXXX", hs: "number" }, { label: "OTP", pass: true, hs: "otp" }],
            timer: { text: "Only 37 slots left!", hs: "scarcity" },
            buttons: [{ text: "Claim free data", primary: true }],
            small: { text: "Promo valid until Oct 31. Terms apply.", hs: "terms" },
            source: { text: "Sent by: freedata-mabuhay.top", hs: "sourceurl" }
          }
        },
        hotspots: {
          url: { flag: false, name: "Website address", safe: "That's the forum you were really reading. The problem is the box on top of it." },
          site: { flag: false, name: "Forum headline", safe: "The page behind the pop-up is ordinary content." },
          brand: { flag: false, name: "Brand header", safe: "Logos and names can be copied by anyone, so a familiar header proves nothing. Judge what the box asks for." },
          number: { flag: false, name: "Mobile number field", safe: "Entering a mobile number alone is not the danger here. The dangerous request is the OTP that follows." },
          terms: { flag: false, name: "Terms line", safe: "Small print like this is easy to copy and proves nothing either way." },
          otp: { flag: true, name: "OTP request", why: "An OTP approves a login or a payment, and no free promo needs it. GCash says never to share your OTP or MPIN with anyone, including sites that promise rewards." },
          scarcity: { flag: true, name: "\"Only 37 slots left\"", why: "Fake scarcity is another pressure trick, meant to make you act before thinking." },
          sourceurl: { flag: true, name: "Sender address", why: "'freedata-mabuhay.top' is not the telco's real domain, and '.top' is a cheap extension often used by scammers." }
        }
      },
      {
        title: "Session Timed Out", difficulty: "Hard", type: "popup",
        instruction: "You were reading the news when this appeared. Find what's wrong.",
        hint: "Would your bank ever show a login box on top of a news website?",
        content: {
          tab: "Balita Ngayon", url: "balitangayon.com.ph/negosyo/inflation", secure: true,
          site: { name: "BALITA NGAYON", headline: "Inflation eases to 3.4% as food prices stabilise", hs: "site" },
          popup: {
            style: "modal",
            head: { text: "BAYANIHAN BANK", hs: "brand" },
            title: { text: "Your online banking session has timed out", hs: "modal" },
            body: [{ text: "For your security, please log in again to continue." }],
            fields: [{ label: "Username", value: "" }, { label: "Password", pass: true }, { label: "One-time PIN", pass: true, hs: "otp" }],
            buttons: [{ text: "Log in", primary: true }],
            small: { text: "© 2026 Bayanihan Bank", hs: "footer" }
          }
        },
        hotspots: {
          url: { flag: false, name: "Website address", safe: "A genuine news site with a normal address. The page behind the pop-up is not what's fake." },
          site: { flag: false, name: "News headline", safe: "An ordinary article. Scam boxes can sit on top of completely real pages." },
          brand: { flag: false, name: "Bank header", safe: "A bank's name and colours are trivial to copy, so the header alone tells you nothing." },
          footer: { flag: false, name: "Copyright line", safe: "A copyright line is easy to copy and proves nothing." },
          modal: { flag: true, name: "Bank login pop-up", why: "Your bank's session lives on the bank's own website or app. It will never show a login box on top of some other website. Close the page and open your bank directly." },
          otp: { flag: true, name: "One-time PIN request", why: "Asking for your password and a one-time PIN together lets the scammer log in as you in real time." }
        }
      }
    ]
  },
  6: {
    name: "Evil Twin Phishing",
    scenarios: [
      {
        title: "Mall Free Wi-Fi", difficulty: "Easy", type: "wifi",
        context: "A sign at the mall entrance says: Free Wi-Fi network \"GreenfieldMall_Free\"",
        instruction: "You need to get online. Tap any network that looks like a fake copy.",
        hint: "Compare every name with the sign, letter by letter.",
        networks: [
          { ssid: "GreenfieldMall_Free", secure: false, bars: 3, flag: false, safe: "This matches the sign exactly, so it is the mall's real network. Open public Wi-Fi is normal, but avoid banking or logging in to important accounts on it." },
          { ssid: "GreenfieldMall_Free_Fast", secure: false, bars: 4, flag: true, why: "This name isn't on the sign. Adding a word like 'Fast' is a classic way to copy a network's name, and attackers often make the fake one the strongest signal." },
          { ssid: "Greenfield Mall Free WiFi", secure: false, bars: 2, flag: true, why: "Spaces instead of underscores: close, but not the name on the sign. Only join the exact network the venue lists." },
          { ssid: "HomeFiber_82F1", secure: true, bars: 1, flag: false, safe: "That is someone's home router bleeding into the mall. It's locked and not pretending to be the mall's Wi-Fi." }
        ]
      },
      {
        title: "Coffee Shop", difficulty: "Easy", type: "wifi",
        context: "Your receipt says: Wi-Fi \"BrewHaus_Guest\" · password: kape2026",
        instruction: "You're ready to work. Tap any network that doesn't belong.",
        hint: "The café's real network needs a password. Which ones don't?",
        networks: [
          { ssid: "BrewHaus_Guest", secure: true, bars: 3, flag: false, safe: "It matches the receipt exactly and it asks for the password printed there, so it is the genuine network." },
          { ssid: "BrewHaus_Guest_FREE", secure: false, bars: 4, flag: true, why: "The real network needs a password, but this one is open. An extra word plus a strong signal and no password is a typical evil twin." },
          { ssid: "BrewHaus-Guest", secure: false, bars: 2, flag: true, why: "A hyphen instead of an underscore, and open when the real one is locked. Near-identical names are how evil twins fool you." },
          { ssid: "BrewHaus_Staff", secure: true, bars: 2, flag: false, safe: "This looks like the staff network. It is password-protected and not meant for you, but it isn't a fake copy of the guest Wi-Fi." }
        ]
      },
      {
        title: "Airport Layover", difficulty: "Medium", type: "wifi",
        context: "The airport information board says: Free Wi-Fi network \"Airport_FreeWiFi\", then sign in with your email",
        instruction: "Your flight is delayed. Tap the networks that look suspicious.",
        hint: "Free Wi-Fi hotspots in airports are a favourite place to set up fakes.",
        networks: [
          { ssid: "Airport_FreeWiFi", secure: false, bars: 3, flag: false, safe: "It matches the board exactly, so it is the airport's real network. Still avoid anything sensitive on open Wi-Fi." },
          { ssid: "Airport_FreeWiFi_5G", secure: false, bars: 4, flag: true, why: "The board doesn't list a '5G' network. A stronger-looking copy of the name is a classic trap." },
          { ssid: "Free Internet", secure: false, bars: 4, flag: true, why: "A generic name that doesn't match the board. It could be anyone's phone or laptop acting as a hotspot." },
          { ssid: "Terminal3_Lounge", secure: true, bars: 2, flag: false, safe: "A private lounge network that needs a password. It isn't impersonating the airport's free Wi-Fi." }
        ]
      },
      {
        title: "The Sign-In Page", difficulty: "Medium", type: "wifi",
        context: "You joined \"CityMall_Free_WiFi\" and a sign-in page opened automatically.",
        instruction: "Tap anything on this Wi-Fi login page that looks wrong.",
        hint: "What would real mall Wi-Fi never need to know?",
        portal: {
          tab: "Wi-Fi Login", url: "citymall-wifi-login.xyz/auth", secure: false, theme: "#6d28d9",
          brand: "CITYMALL FREE WI-FI", heading: "Sign in to get online",
          banner: { tone: "info", text: "Free for 30 minutes. Sign in to continue." },
          fields: [
            { label: "Facebook email", value: "ana.reyes@gmail.com" },
            { label: "Facebook password", pass: true, hs: "fbpass" },
            { label: "GCash number", value: "09XX XXX XXXX" },
            { label: "GCash MPIN", pass: true, hs: "mpin" },
            { label: "I agree to the Terms of use", check: true, hs: "terms" }
          ],
          button: "Connect", links: ["Terms of use", "Help"],
          footer: "© 2026 CityMall Wi-Fi"
        },
        hotspots: {
          url: { flag: true, name: "Website address", why: "A mall Wi-Fi sign-in page on a random '.xyz' address is a red flag. Real portals use the venue's own domain." },
          lock: { flag: true, name: "Security label", why: "'Not secure' means this page isn't encrypted, so anything you type could be read by whoever runs the hotspot." },
          fbpass: { flag: true, name: "Facebook password", why: "Free Wi-Fi never needs your social media password. This is a fake portal harvesting logins." },
          mpin: { flag: true, name: "GCash MPIN", why: "Your MPIN should only ever be typed into the official GCash app. GCash says never to share your MPIN or OTP with anyone." },
          banner: { flag: false, name: "Free for 30 minutes", safe: "Time-limited free access is common on real public Wi-Fi, so this isn't suspicious by itself." },
          terms: { flag: false, name: "Terms checkbox", safe: "Agreeing to terms is a normal step on genuine Wi-Fi portals too." },
          brand: { flag: false, name: "Page header", safe: "A venue's name on the page is easy to copy and tells you nothing." },
          footer: { flag: false, name: "Footer", safe: "Footer text is trivial to copy and proves nothing." }
        }
      },
      {
        title: "Campus Wi-Fi", difficulty: "Hard", type: "wifi",
        context: "Library poster: students use \"MetroUniv-Secure\" (sign in with your student account). Visitors use \"MetroUniv-Guest\" (open, email sign-in).",
        instruction: "Exam week and everyone is online. Tap the fake copies.",
        hint: "A padlock doesn't prove a network is real. Match the exact name on the poster.",
        networks: [
          { ssid: "MetroUniv-Secure", secure: true, bars: 3, flag: false, safe: "This is exactly the name on the poster for students. It is the real network." },
          { ssid: "MetroUniv-Guest", secure: false, bars: 2, flag: false, safe: "Also listed on the poster for visitors. It is open on purpose, so it isn't a fake copy, but avoid sensitive logins on it." },
          { ssid: "MetroUniv-Secure-FAST", secure: false, bars: 4, flag: true, why: "It isn't on the poster. A 'secure' network that is suddenly open and extra fast is a trap." },
          { ssid: "MetroUniv_Secure", secure: true, bars: 4, flag: true, why: "An underscore instead of a hyphen. Evil twins can even be password-protected, because the attacker sets the password. Match the exact name, not just the padlock." }
        ]
      }
    ]
  }

};

// Work out how many real indicators each scenario has and prepare the feedback text.
(function normalizeMissions() {
  Object.values(Missions).forEach(m => m.scenarios.forEach(sc => {
    // Wi-Fi scenarios: every listed network becomes a tappable hotspot
    if (sc.type === 'wifi' && sc.networks) {
      sc.hotspots = sc.hotspots || {};
      sc.networks.forEach((n, i) => {
        sc.hotspots['net-' + i] = { flag: !!n.flag, name: 'Network \u201c' + n.ssid + '\u201d', why: n.why, safe: n.safe };
      });
    }
    if (sc.hotspots) {
      sc.explanations = {}; sc.safeNotes = {};
      Object.entries(sc.hotspots).forEach(([id, h]) => {
        if (h.flag) sc.explanations[id] = h.why; else sc.safeNotes[id] = h.safe;
      });
      sc.indicators = Object.values(sc.hotspots).filter(h => h.flag).length;
    } else if (sc.type === 'links') {
      sc.indicators = sc.content.filter(l => l.suspicious).length;
      sc.safeNotes = {};
    } else if (sc.type === 'chat') {
      sc.indicators = sc.content.filter(msg => msg.flag).length;
      sc.safeNotes = sc.safeNotes || {};
    }
  }));
})();

// Game-wide numbers derived from the mission data
const MISSION_COUNT = Object.keys(Missions).length;
const SCENARIOS_PER_MISSION = 5;
const TOTAL_SCENARIOS = MISSION_COUNT * SCENARIOS_PER_MISSION;
const POINTS_PER_SCENARIO = 10;
const MAX_SCORE = TOTAL_SCENARIOS * POINTS_PER_SCENARIO;

// Assessment Questions
const AssessmentQuestions = [
  {
    visual: 'email-school',
    scenario: "You receive an email saying your school account will be deactivated within 24 hours. It contains a link asking you to verify your account.",
    question: "What indicators suggest this may be phishing?",
    options: ["Urgency", "Suspicious link", "Request for account verification", "All of the above"],
    correct: 3
  },
  {
    visual: 'chat-it',
    scenario: "A message from 'IT Support' asks for your password to fix an account issue.",
    question: "What should you do?",
    options: ["Provide the password immediately", "Ignore the message", "Report to official IT support", "Share with a colleague"],
    correct: 2
  },
  {
    visual: 'usb-drop',
    scenario: "You find a USB drive in the parking lot labeled 'Employee Salaries'.",
    question: "What is the safest action?",
    options: ["Plug it in to see contents", "Give it to security/IT", "Take it home", "Format it and use it"],
    correct: 1
  },
  {
    visual: 'email-bank',
    scenario: "An email claims to be from your bank asking you to click a link to verify a transaction.",
    question: "What should you do?",
    options: ["Click the link immediately", "Call the bank using official number", "Reply with your account details", "Forward to friends"],
    correct: 1
  },
  {
    visual: 'popup-scam',
    scenario: "A pop-up says your computer is infected and you need to call a number for help.",
    question: "What is this likely to be?",
    options: ["Legitimate security alert", "Tech support scam", "Windows update", "Antivirus notification"],
    correct: 1
  }
];


// ---------- Assessment scenario visuals (realistic mock-ups) ----------
const SV_CREST = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5 20.5 5.7v5.8c0 5-3.4 8.7-8.5 10-5.1-1.3-8.5-5-8.5-10V5.7Z" fill="currentColor"/><path d="m8.2 12.1 2.7 2.7 5-5.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function buildAssessmentVisual(type) {
  const bar = (title) => '<div class="sv-bar"><span class="sv-dots"><i></i><i></i><i></i></span><span class="sv-bar-title">' + title + '</span></div>';
  const pill = (t) => '<div class="sv-pill">' + t + '</div>';
  switch (type) {
    case 'email-school':
      return pill('EMAIL &middot; INBOX') +
        '<div class="sv-win">' + bar('Inbox') +
        '<div class="sv-mail-head">' +
          '<div class="sv-subject">Action required: your account will be deactivated in 24 hours</div>' +
          '<div class="sv-sender"><div class="sv-avatar" style="background:#d93025">S</div>' +
          '<div><div class="sv-name">State College IT <span class="sv-addr">&lt;no-reply@statecollege-helpdesk.com&gt;</span></div>' +
          '<div class="sv-sub">to me &middot; 7:42 AM</div></div></div>' +
        '</div>' +
        '<div class="sv-mail-body">' +
          '<div class="sv-brandline" style="color:#1a4fc4">' + SV_CREST + ' STATE COLLEGE &middot; Information Technology</div>' +
          '<p>Dear Student,</p>' +
          '<p>We were unable to verify your school account. <b>Your access will be deactivated within 24 hours</b> unless you confirm your details now.</p>' +
          '<span class="sv-cta" style="background:#1a4fc4">Verify My Account</span>' +
          '<p class="sv-sub" style="margin-top:10px">IT Services Team</p>' +
        '</div>' +
        '<div class="sv-status"><span>Link goes to:</span> http://statecollege-verify.co/login?ref=7f3a</div>' +
        '</div>';

    case 'chat-it':
      return pill('DIRECT MESSAGE') +
        '<div class="sv-win sv-chat">' +
        '<div class="sv-chat-head"><div class="sv-avatar" style="background:#6b7280">IT</div>' +
          '<div><div class="sv-name">IT Support</div><div class="sv-sub">Message request</div></div></div>' +
        '<div class="sv-chat-body">' +
          '<div class="sv-notice">This person is not in your contacts</div>' +
          '<div class="sv-msg">Hello! This is IT Support.</div>' +
          '<div class="sv-msg">We detected suspicious activity on your account.</div>' +
          '<div class="sv-msg">To fix it quickly, please reply with your current password. Thanks!</div>' +
          '<div class="sv-time">9:14 AM</div>' +
        '</div>' +
        '<div class="sv-input"><span>Type a message&hellip;</span><b class="sv-send">&#10148;</b></div>' +
        '</div>';

    case 'usb-drop':
      return pill('FOUND OBJECT') +
        '<div class="sv-usb-wrap">' +
        '<svg viewBox="0 0 360 215" class="sv-usb" role="img" aria-label="A USB drive on the ground labeled Employee Salaries">' +
          '<defs>' +
            '<linearGradient id="svAsp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b4b54"/><stop offset="1" stop-color="#2c2c33"/></linearGradient>' +
            '<linearGradient id="svBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3566ff"/><stop offset="1" stop-color="#1a34b5"/></linearGradient>' +
            '<linearGradient id="svMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f6"/><stop offset="1" stop-color="#97a0b0"/></linearGradient>' +
          '</defs>' +
          '<rect width="360" height="215" fill="url(#svAsp)"/>' +
          '<path d="M-10 172 L370 152 L370 169 L-10 189Z" fill="#e6d247" opacity=".85"/>' +
          '<g fill="#fff" opacity=".07"><circle cx="40" cy="30" r="2"/><circle cx="90" cy="70" r="1.6"/><circle cx="300" cy="40" r="2"/><circle cx="330" cy="110" r="1.6"/><circle cx="60" cy="130" r="2"/><circle cx="250" cy="20" r="1.4"/><circle cx="150" cy="25" r="1.8"/></g>' +
          '<ellipse cx="186" cy="140" rx="112" ry="11" fill="#000" opacity=".38"/>' +
          '<g transform="rotate(-9 186 112)">' +
            '<rect x="88" y="84" width="142" height="58" rx="15" fill="url(#svBody)" stroke="#0e1d66" stroke-width="2"/>' +
            '<rect x="222" y="96" width="64" height="34" rx="4" fill="url(#svMetal)" stroke="#6b7486" stroke-width="2"/>' +
            '<rect x="238" y="104" width="10" height="7" rx="1.5" fill="#3b4355"/><rect x="258" y="104" width="10" height="7" rx="1.5" fill="#3b4355"/>' +
            '<circle cx="106" cy="113" r="6" fill="#0e1d66"/>' +
            '<g transform="rotate(-3 168 113)"><rect x="118" y="92" width="102" height="42" rx="3" fill="#fff"/>' +
              '<text x="169" y="108" text-anchor="middle" font-size="11" font-weight="800" fill="#111" font-family="Arial,sans-serif">EMPLOYEE</text>' +
              '<text x="169" y="121" text-anchor="middle" font-size="11" font-weight="800" fill="#111" font-family="Arial,sans-serif">SALARIES</text>' +
              '<rect x="118" y="126" width="102" height="8" fill="#d93025"/>' +
              '<text x="169" y="132.6" text-anchor="middle" font-size="6.2" font-weight="800" fill="#fff" font-family="Arial,sans-serif" letter-spacing="1">CONFIDENTIAL</text>' +
            '</g>' +
          '</g>' +
        '</svg>' +
        '<div class="sv-usb-tag">Found near the parking lot entrance</div>' +
        '</div>';

    case 'email-bank':
      return pill('EMAIL &middot; BANK ALERT') +
        '<div class="sv-win">' + bar('Inbox') +
        '<div class="sv-mail-head">' +
          '<div class="sv-subject">Unusual activity on your card &ndash; verify this transaction</div>' +
          '<div class="sv-sender"><div class="sv-avatar" style="background:#0b6b4f">M</div>' +
          '<div><div class="sv-name">Meridian Trust Bank <span class="sv-addr">&lt;alerts@meridiantrust-secure.com&gt;</span></div>' +
          '<div class="sv-sub">to me &middot; 2:08 PM</div></div></div>' +
        '</div>' +
        '<div class="sv-mail-body">' +
          '<div class="sv-brandline" style="color:#0b6b4f">' + SV_CREST + ' MERIDIAN TRUST BANK</div>' +
          '<p>We noticed a transaction that may not be yours:</p>' +
          '<div class="sv-txn"><div><span class="sv-sub">Merchant</span><b>ELECTRO-WORLD ONLINE</b></div><div><span class="sv-sub">Amount</span><b style="color:#c5221f">$1,248.60</b></div><div><span class="sv-sub">Status</span><b style="color:#b06000">Pending</b></div></div>' +
          '<p>If you do not verify within the hour, your card may be blocked.</p>' +
          '<span class="sv-cta" style="background:#0b6b4f">Verify Transaction</span>' +
        '</div>' +
        '<div class="sv-status"><span>Link goes to:</span> http://meridiantrust-secure.com/verify/txn</div>' +
        '</div>';

    case 'popup-scam':
      return pill('WEB POP-UP') +
        '<div class="sv-win sv-browser">' +
        '<div class="sv-tabs"><span class="sv-tab">free-games-online</span></div>' +
        '<div class="sv-urlbar"><span class="sv-nsec">Not secure</span><span class="sv-url">www.free-games-online.net/play?id=88231</span></div>' +
        '<div class="sv-scam">' +
          '<div class="sv-scam-top">WINDOWS SECURITY ALERT</div>' +
          '<div class="sv-scam-body">' +
            '<svg class="ic sv-scam-ic" aria-hidden="true"><use href="#i-alert"/></svg>' +
            '<div class="sv-scam-title">Your computer is infected!</div>' +
            '<div class="sv-scam-text">3 viruses found: Trojan.Agent.Win32, Spyware.KeyLog, Adware.Popup. Your passwords and photos are at risk. <b>Do not close this window or restart your PC.</b></div>' +
            '<div class="sv-scam-timer">PC will be locked in <b>04:59</b></div>' +
            '<div class="sv-scam-call">Call Support Now: 1-888-555-0147</div>' +
          '</div>' +
        '</div>' +
        '</div>';
  }
  return '';
}

function renderAssessmentVisual(containerId, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = buildAssessmentVisual(type);
  el.style.display = type ? '' : 'none';
}

// Authentication Functions - moved to js/auth.js
// handleLogin(), handleRegister(), handleLogout() are now in auth.js

// Save User Progress (used by application logic)
function saveUserProgress() {
  if (AppState.currentUser) {
    const userIndex = AppState.users.findIndex(u => u.username === AppState.currentUser.username);
    if (userIndex !== -1) {
      // Calculate unique scenarios completed across all missions
      let uniqueScenariosCompleted = 0;
      for (let i = 1; i <= MISSION_COUNT; i++) {
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
  const badgeAvatar = document.getElementById('agent-avatar');
  if (badgeAvatar) { badgeAvatar.innerHTML = icon('rank-' + rankTier(rank)); badgeAvatar.dataset.tier = rankTier(rank); }

  // Gameplay sidebar (unchanged IDs)
  const gpName = document.getElementById('gameplay-agent-name');
  const gpRank = document.getElementById('gameplay-agent-rank');
  if (gpName) gpName.textContent = agentName;
  if (gpRank) gpRank.textContent = `RANK: ${rank}`;
}

// Rank thresholds (scaled for a 300-point maximum)
const RANK_NAMES = ['NOVICE HUNTER', 'JUNIOR AGENT', 'SKILLED OPERATIVE', 'SENIOR AGENT', 'MASTER HUNTER'];
const RANK_MINS  = [0, 75, 135, 195, 255];

function rankIndex(score) {
  let idx = 0;
  RANK_MINS.forEach((min, i) => { if (score >= min) idx = i; });
  return idx;
}

function getRank(score) {
  return RANK_NAMES[rankIndex(score)];
}

function getRankInfo(score) {
  const i = rankIndex(score);
  const next = RANK_NAMES[i + 1] || null;
  const min = RANK_MINS[i];
  const nextMin = RANK_MINS[i + 1];
  return {
    current: RANK_NAMES[i],
    next: next,
    pointsToNext: next ? nextMin - score : 0,
    currentMin: min,
    currentMax: next ? nextMin - 1 : MAX_SCORE,
    progress: next ? ((score - min) / (nextMin - min)) * 100 : 100
  };
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
    'NOVICE HUNTER':    'rank-1',
    'JUNIOR AGENT':     'rank-2',
    'SKILLED OPERATIVE':'rank-3',
    'SENIOR AGENT':     'rank-4',
    'MASTER HUNTER':    'rank-5'
  };

  if (heroIcon) heroIcon.innerHTML = icon(rankIcons[rankInfo.current] || 'rank-1'); heroIcon.dataset.tier = rankTier(rankInfo.current);
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
  if (scoreEl) scoreEl.textContent = `${AppState.score}/${MAX_SCORE}`;
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
      if (statusEl) statusEl.innerHTML = icon('check') + ' Earned';
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
  const i = RANK_NAMES.indexOf(rankName);
  return i >= 0 ? RANK_MINS[i] : 0;
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
  renderAssessmentVisual('pre-assessment-visual', question.visual);

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

// ── Per-mission score summary (best score of each scenario, out of 10) ──
function missionScoreSummary(missionId) {
  const prog = AppState.missionProgress[missionId];
  const recs = [];
  for (let d = 0; d < SCENARIOS_PER_MISSION; d++) {
    const rec = prog.scenarios.find(s => (s.scenarioIndex !== undefined ? s.scenarioIndex : prog.scenarios.indexOf(s)) === d);
    recs.push(rec || null);
  }
  const played = recs.filter(Boolean);
  const points = played.reduce((sum, r) => sum + r.score, 0);
  const max = SCENARIOS_PER_MISSION * POINTS_PER_SCENARIO;
  const playedMax = played.length * POINTS_PER_SCENARIO;
  const accuracy = playedMax ? Math.round((points / playedMax) * 100) : null;
  const missing = [];
  recs.forEach((r, d) => { if (r && r.score < POINTS_PER_SCENARIO) missing.push({ d: d, score: r.score }); });
  const gain = missing.reduce((sum, m) => sum + (POINTS_PER_SCENARIO - m.score), 0);
  return { recs, played: played.length, points, max, accuracy, missing, gain };
}

function renderMissionScore(missionId, sum) {
  const statusEl = document.getElementById(`mission-${missionId}-status`);
  if (!statusEl) return;
  let el = document.getElementById(`mission-${missionId}-pct`);
  if (!el) {
    el = document.createElement('span');
    el.id = `mission-${missionId}-pct`;
    statusEl.parentNode.insertBefore(el, statusEl);
  }
  if (sum.played === 0) { el.textContent = ''; el.className = 'mission-pct'; return; }
  const pct = Math.round((sum.points / sum.max) * 100);
  el.textContent = pct + '%';
  el.className = 'mission-pct ' + (pct >= 90 ? 'good' : pct >= 60 ? 'mid' : 'low');
}

// Jump straight into one scenario (used by the "pts to recover" chips on the hub)
function replayScenario(missionId, index) {
  AppState.currentMission = missionId;
  AppState.streak = 0;
  AppState.currentScenario = index;
  showMissionScenario();
}

// Mission Hub
function updateMissionHub() {
  updateAgentInfo();

  // ── Tally stats ──────────────────────────────────────────
  let uniqueScenariosCompleted = 0;
  let missionsCleared = 0;
  for (let i = 1; i <= MISSION_COUNT; i++) {
    uniqueScenariosCompleted += AppState.missionProgress[i].scenarios.length;
    if (AppState.missionProgress[i].completed) missionsCleared++;
  }

  // ── Stat strip ───────────────────────────────────────────
  // score value — keep the max inside a <span class="stat-max">
  const scoreEl = document.getElementById('current-score');
  if (scoreEl) scoreEl.innerHTML = `${AppState.score} <span class="stat-max">/${MAX_SCORE}</span>`;

  const scenEl = document.getElementById('scenarios-completed');
  if (scenEl) scenEl.innerHTML = `${uniqueScenariosCompleted} <span class="stat-max">/${TOTAL_SCENARIOS}</span>`;

  const mclEl = document.getElementById('missions-cleared');
  if (mclEl) mclEl.innerHTML = `${missionsCleared} <span class="stat-max">/${MISSION_COUNT}</span>`;

  // ── Completion bar ───────────────────────────────────────
  const pct = Math.round((uniqueScenariosCompleted / TOTAL_SCENARIOS) * 100);
  const pctEl = document.getElementById('completion-percent');
  if (pctEl) pctEl.textContent = `${pct}% (${uniqueScenariosCompleted}/${TOTAL_SCENARIOS})`;

  const barTrack = document.getElementById('completion-bar');
  if (barTrack) {
    barTrack.innerHTML = '';
    for (let i = 0; i < TOTAL_SCENARIOS; i++) {
      const seg = document.createElement('i');
      seg.className = i < uniqueScenariosCompleted ? 'filled' : '';
      barTrack.appendChild(seg);
    }
  }

  // ── Mission cards ────────────────────────────────────────
  // Score summary per mission, and which mission has the most points left to recover
  const summaries = {};
  let topMissionId = null;
  for (let i = 1; i <= MISSION_COUNT; i++) {
    summaries[i] = missionScoreSummary(i);
    if (summaries[i].gain > 0 && (topMissionId === null || summaries[i].gain > summaries[topMissionId].gain)) topMissionId = i;
  }

  let nextMissionId = null;   // first non-completed mission that is unlocked
  let nextMissionInProgress = false;

  for (let i = 1; i <= MISSION_COUNT; i++) {
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
      const dotSum = summaries[i];
      for (let d = 0; d < SCENARIOS_PER_MISSION; d++) {
        const rec = dotSum.recs[d];
        const dot = document.createElement('div');
        let cls = 'scenario-dot';
        if (rec) cls += rec.score >= POINTS_PER_SCENARIO ? ' done perfect' : rec.score >= 5 ? ' done partial' : ' done low';
        dot.className = cls;
        dot.title = rec ? `Scenario ${d + 1}: ${rec.score}/${POINTS_PER_SCENARIO}` : `Scenario ${d + 1}: not played yet`;
        if (rec && rec.score < POINTS_PER_SCENARIO) {
          dot.classList.add('clickable');
          dot.title += ' · click to replay';
          dot.onclick = () => replayScenario(i, d);
        }
        dotsEl.appendChild(dot);
      }
    }
    if (labelEl) {
      labelEl.textContent = `${mission.scenarios.length}/5 scenarios`;
    }
    renderMissionScore(i, summaries[i]);

    // Remove all state classes first
    card.classList.remove('state-available', 'state-in-progress', 'state-cleared', 'state-locked');
    if (overlayEl) overlayEl.style.display = 'none';

    if (mission.completed) {
      // ── CLEARED ──
      card.classList.add('state-cleared');
      statusEl.className = 'sticker sticker-cleared';
      statusEl.innerHTML = icon('check') + ' Cleared';
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
        statusEl.innerHTML = icon('lock') + ' Locked';
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
  const allComplete = missionsCleared === MISSION_COUNT;

  if (allComplete) {
    if (bannerLabel) bannerLabel.textContent = 'ALL MISSIONS CLEARED';
    if (bannerTitle) bannerTitle.textContent = 'Ready to measure how far you\'ve come?';
    if (bannerSub) {
      bannerSub.textContent = topMissionId
        ? `Replay ${Missions[topMissionId].name} to recover ${summaries[topMissionId].gain} pts, or take the post-assessment.`
        : 'Perfect run! Take the post-assessment to see your awareness gain.';
    }
    if (postBtn && !AppState.currentUser.postAssessmentCompleted) {
      postBtn.style.display = 'inline-block';
    }
  } else if (nextMissionId !== null) {
    const mName = Missions[nextMissionId].name;
    const scenLeft = 5 - AppState.missionProgress[nextMissionId].scenarios.length;
    const nextNum  = nextMissionId < MISSION_COUNT ? `Mission 0${nextMissionId + 1}` : null;

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
  for (let i = 1; i <= MISSION_COUNT; i++) {
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
  AppState.streak = 0;
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
  stopChatReveal();
  const mission = Missions[AppState.currentMission];
  const scenario = mission.scenarios[AppState.currentScenario];
  const n = AppState.currentScenario + 1;

  document.getElementById('mission-label').textContent = `MISSION 0${AppState.currentMission} · ${mission.name.toUpperCase()}`;
  document.getElementById('scenario-label').textContent = scenario.title ? `Scenario ${n}/5 · ${scenario.title}` : `Scenario ${n}/5`;
  document.getElementById('mission-instruction').textContent = scenario.instruction;
  const hintEl = document.getElementById('mission-hint');
  hintEl.textContent = scenario.hint;
  hintEl.style.display = 'none';
  renderScenarioChips(scenario);

  AppState.selectedIndicators = [];
  updateSelectedCount();

  const contentContainer = document.getElementById('mission-content');
  contentContainer.innerHTML = '';
  bindHotspotClicks(contentContainer);

  if (scenario.type === 'email') renderEmailScenario(scenario, contentContainer);
  else if (scenario.type === 'links') renderLinksScenario(scenario, contentContainer);
  else if (scenario.type === 'website') renderWebsiteScenario(scenario, contentContainer);
  else if (scenario.type === 'chat') renderChatScenario(scenario, contentContainer);
  else if (scenario.type === 'popup') renderPopupScenario(scenario, contentContainer);
  else if (scenario.type === 'wifi') renderWifiScenario(scenario, contentContainer);

  contentContainer.scrollTop = 0;
  showScreen('mission-gameplay');
}

function renderScenarioChips(scenario) {
  const el = document.getElementById('scenario-chips');
  if (!el) return;
  const cur = AppState.currentScenario;
  const diff = scenario.difficulty || 'Easy';
  const steps = [0, 1, 2, 3, 4].map(i => `<i class="${i < cur ? 'done' : i === cur ? 'now' : ''}"></i>`).join('');
  const streak = (AppState.streak || 0) >= 2 ? `<span class="chip chip-streak">${icon('bolt')} Streak ×${AppState.streak}</span>` : '';
  el.innerHTML = `${streak}<span class="chip chip-${diff.toLowerCase()}">${diff}</span><div class="steps">${steps}</div>`;
}

// One delegated click handler for every tappable element ("hotspot")
function bindHotspotClicks(container) {
  if (container._hsBound) return;
  container._hsBound = true;
  container.addEventListener('click', e => {
    const el = e.target.closest('.hs');
    if (el && !el.classList.contains('locked') && !el.classList.contains('pending')) toggleHotspot(el.dataset.hs, el);
  });
  container.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-link]');
    const bar = document.getElementById('mx-status');
    if (bar && el) bar.innerHTML = '<span>Link goes to:</span> ' + el.dataset.link;
  });
  container.addEventListener('mouseout', e => {
    const el = e.target.closest('[data-link]');
    const bar = document.getElementById('mx-status');
    if (bar && el) bar.innerHTML = '<span>Hover over a link to see where it goes</span>';
  });
}

function toggleHotspot(id, el) {
  const i = AppState.selectedIndicators.indexOf(id);
  if (i > -1) AppState.selectedIndicators.splice(i, 1);
  else AppState.selectedIndicators.push(id);
  el.classList.toggle('selected', AppState.selectedIndicators.includes(id));
  updateSelectedCount();
  if (el.dataset.link) {
    const bar = document.getElementById('mx-status');
    if (bar) bar.innerHTML = '<span>Link goes to:</span> ' + el.dataset.link;
  }
}

// Shows the registrable domain in bold, the way modern browsers do
function urlHtml(raw, defaultScheme) {
  let s = String(raw).trim(), scheme = '';
  const m = s.match(/^(https?:\/\/)/i);
  if (m) { scheme = m[1]; s = s.slice(scheme.length); } else { scheme = defaultScheme || 'https://'; }
  const slash = s.indexOf('/');
  const host = slash > -1 ? s.slice(0, slash) : s;
  const path = slash > -1 ? s.slice(slash) : '';
  const labels = host.split('.');
  let keep = 2;
  if (labels.length >= 3 && labels[labels.length - 1].length === 2 && labels[labels.length - 2].length <= 3) keep = 3;
  const dom = labels.slice(-keep).join('.');
  const sub = labels.slice(0, -keep).join('.');
  return `<span class="u-dim">${scheme}${sub ? sub + '.' : ''}</span><b class="u-dom">${dom}</b><span class="u-dim">${path}</span>`;
}

const BRAND_INFO = {
  facebook: { title: "Facebook – Log In or Sign Up", color: "#1877f2" },
  microsoft: { title: "Sign in to your Microsoft account", color: "#0f6cbd" },
  amazon: { title: "Amazon Sign-In", color: "#f08804" },
  apple: { title: "Manage your Apple ID", color: "#555b66" },
  netflix: { title: "Netflix – Sign In", color: "#e50914" },
  boa: { title: "Bank of America | Online Banking", color: "#c8102e" },
  chase: { title: "Chase Online – Sign In", color: "#117aca" },
  linkedin: { title: "LinkedIn Login, Sign in", color: "#0a66c2" },
  twitter: { title: "X / Twitter – Log in", color: "#111827" },
  instagram: { title: "Instagram • Log in", color: "#c13584" },
  paypal: { title: "PayPal: Log in to your account", color: "#003087" },
  ebay: { title: "eBay – Sign in", color: "#e53238" }
};

/* ---------------- EMAIL ---------------- */
function renderEmailScenario(scenario, container) {
  const e = scenario.email;
  const H = id => (scenario.hotspots[id] ? ` hs" data-hs="${id}` : '');
  const bar = '<div class="sv-bar"><span class="sv-dots"><i></i><i></i><i></i></span><span class="sv-bar-title">Inbox</span></div>';
  const paragraphs = (e.body || []).map(p => `<p class="${p.hs ? 'mx-p' + H(p.hs) : 'mx-p'}">${p.text}</p>`).join('');
  const attachment = e.attachment
    ? `<div class="mx-attach${H('attach')}">${icon('file')}<span><b>${e.attachment.name}</b><small>${e.attachment.size}</small></span></div>` : '';
  const button = e.button
    ? `<span class="sv-cta mx-cta${H('cta')}" data-link="${e.button.url}" style="background:#1a4fc4">${e.button.text}</span>` : '';
  const replyTo = e.replyTo ? `<div class="mx-line sv-sub${H('replyto')}">Reply-To: ${e.replyTo}</div>` : '';
  const footer = e.footer ? `<div class="mx-foot${H('footer')}">${e.footer}</div>` : '';

  const wrap = document.createElement('div');
  wrap.className = 'sv-win mx-mail';
  wrap.innerHTML = `
    ${bar}
    <div class="sv-mail-head">
      <div class="sv-subject${H('subject')}">${e.subject}</div>
      <div class="sv-sender">
        <div class="sv-avatar" style="background:#5f6b7a">${e.fromName.charAt(0)}</div>
        <div class="mx-from">
          <div class="mx-line${H('from')}"><span class="sv-name">${e.fromName}</span> <span class="sv-addr">&lt;${e.fromAddr}&gt;</span></div>
          ${replyTo}
          <div class="sv-sub">to ${e.to} · ${e.time}</div>
        </div>
      </div>
    </div>
    <div class="sv-mail-body">
      <p class="mx-p${H('greeting')}">${e.greeting}</p>
      ${paragraphs}
      ${attachment}
      ${button}
      ${e.signature ? `<p class="mx-sig${H('signature')}">${e.signature}</p>` : ''}
      ${footer}
    </div>
    ${e.button ? '<div class="sv-status" id="mx-status"><span>Hover over a link to see where it goes</span></div>' : ''}`;
  container.appendChild(wrap);
}

/* ---------------- LINKS ---------------- */
function renderLinksScenario(scenario, container) {
  if (scenario.context) {
    const ctx = document.createElement('div');
    ctx.className = 'mx-context';
    ctx.innerHTML = `<span class="mx-context-tag">FOUND IN</span> ${scenario.context}`;
    container.appendChild(ctx);
  }
  const list = document.createElement('div');
  list.className = 'link-list';
  scenario.content.forEach((link, index) => {
    const info = BRAND_INFO[link.brand] || { title: link.url, color: '#6b7280' };
    const secure = /^https:\/\//i.test(link.url);
    const card = document.createElement('div');
    card.className = 'link-card hs';
    card.dataset.hs = `link-${index}`;
    card.dataset.index = index;
    card.innerHTML = `
      <div class="lc-fav" style="background:${info.color}">${info.title.charAt(0)}</div>
      <div class="lc-main">
        <div class="lc-title">${info.title}</div>
        <div class="lc-url"><span class="lc-sec ${secure ? 'ok' : 'bad'}">${icon(secure ? 'lock' : 'alert')}</span>${urlHtml(link.url)}</div>
        <div class="lc-verdict"></div>
      </div>
      <span class="link-icon">${icon('circle')}</span>`;
    list.appendChild(card);
  });
  container.appendChild(list);
}

/* ---------------- BROWSER (shared by website, pop-up and Wi-Fi portal) ---------------- */
function browserChrome(scenario, c) {
  const H = id => (scenario.hotspots[id] ? ` hs" data-hs="${id}` : '');
  const secure = c.secure !== false;
  return `
    <div class="mx-tabs"><span class="sv-dots"><i></i><i></i><i></i></span><span class="mx-tab">${c.tab || c.brand || ''}</span></div>
    <div class="mx-toolbar">
      <span class="mx-nav"><i>‹</i><i>›</i><i>↻</i></span>
      <div class="mx-addr">
        <span class="mx-lock ${secure ? 'ok' : 'bad'}${H('lock')}">${icon(secure ? 'lock' : 'alert')}${secure ? 'Secure' : 'Not secure'}</span>
        <span class="mx-urltext${H('url')}">${urlHtml(c.url, secure ? 'https://' : 'http://')}</span>
      </div>
    </div>`;
}

function buildSiteHtml(scenario, c) {
  const H = id => (scenario.hotspots[id] ? ` hs" data-hs="${id}` : '');
  const fields = (c.fields || []).map(f => {
    if (f.check) return `<div class="mx-check${f.hs ? H(f.hs) : ''}"><span class="mx-box"></span>${f.label}</div>`;
    const val = f.pass ? '<span class="mx-dots-pw">••••••••••</span>' : (f.value || '');
    return `<div class="mx-field${f.hs ? H(f.hs) : ''}"><label>${f.label}</label><div class="mx-input">${val}</div></div>`;
  }).join('');
  const banner = c.banner ? `<div class="mx-banner ${c.banner.tone}${H('banner')}">${c.banner.text}</div>` : '';
  return `
    ${browserChrome(scenario, c)}
    <div class="mx-page" style="--brand:${c.theme || '#1a4fc4'}">
      <div class="mx-pagehead"><span class="mx-logo${H('brand')}">${c.brand}</span></div>
      <div class="mx-card">
        ${banner}
        <div class="mx-h">${c.heading || 'Sign in'}</div>
        ${fields}
        <div class="mx-btn${H('button')}">${c.button || 'Sign in'}</div>
        <div class="mx-links">${(c.links || []).join(' · ')}</div>
      </div>
      <div class="mx-footer${H('footer')}">${c.footer || ''}</div>
    </div>`;
}

function renderWebsiteScenario(scenario, container) {
  const wrap = document.createElement('div');
  wrap.className = 'sv-win mx-site';
  wrap.innerHTML = buildSiteHtml(scenario, scenario.content);
  container.appendChild(wrap);
}

/* ---------------- POP-UP ---------------- */
function renderPopupScenario(scenario, container) {
  const c = scenario.content, p = c.popup;
  const H = id => (scenario.hotspots[id] ? ` hs" data-hs="${id}` : '');
  const A = o => (o && o.hs ? H(o.hs) : '');

  const head = p.head ? `<div class="pp-head${A(p.head)}">${p.head.text}</div>` : '';
  const icn = p.style === 'alert' ? `<svg class="ic pp-alert-ic" aria-hidden="true"><use href="#i-alert"/></svg>` : '';
  const title = p.title ? `<div class="pp-title${A(p.title)}">${p.title.text}</div>` : '';
  const body = (p.body || []).map(b => `<div class="pp-body${A(b)}">${b.text}</div>`).join('');
  const fields = (p.fields || []).map(f =>
    `<div class="mx-field${A(f)}"><label>${f.label}</label><div class="mx-input">${f.pass ? '<span class="mx-dots-pw">••••••</span>' : (f.value || '&nbsp;')}</div></div>`).join('');
  const timer = p.timer ? `<div class="pp-timer${A(p.timer)}">${p.timer.text}</div>` : '';
  const btns = (p.buttons || []).length
    ? `<div class="pp-btns">${p.buttons.map(b => `<span class="pp-btn${b.primary ? ' primary' : ''}${A(b)}">${b.text}</span>`).join('')}</div>` : '';
  const small = p.small ? `<div class="pp-small${A(p.small)}">${p.small.text}</div>` : '';
  const source = p.source ? `<div class="pp-source${A(p.source)}">${p.source.text}</div>` : '';

  const cookie = c.cookie
    ? `<div class="pp-cookie${A(c.cookie)}"><span>${c.cookie.text}</span><b>${c.cookie.button}</b></div>` : '';
  const pagemsg = c.pagemsg
    ? `<div class="pp-pagemsg"><div class="pp-robot"><span class="mx-box"></span> I'm not a robot</div><div class="pp-pm${A(c.pagemsg)}">${c.pagemsg.text}</div></div>` : '';
  const article = c.pagemsg ? pagemsg : `
    <div class="pp-article">
      <div class="pp-h${A(c.site)}">${c.site.headline}</div>
      <div class="pp-skel"></div><div class="pp-skel w80"></div><div class="pp-skel"></div><div class="pp-skel w60"></div>
    </div>`;

  const wrap = document.createElement('div');
  wrap.className = 'sv-win mx-site';
  wrap.innerHTML = `
    ${browserChrome(scenario, c)}
    <div class="pp-page">
      <div class="pp-sitehead">${c.site.name}</div>
      ${cookie}
      ${article}
      <div class="pp-backdrop"></div>
      <div class="pp-pop pp-${p.style}">
        ${head}
        <div class="pp-inner">
          ${icn}${title}${body}${fields}${timer}${btns}${small}${source}
        </div>
      </div>
    </div>`;
  container.appendChild(wrap);
}

/* ---------------- EVIL TWIN (Wi-Fi list and sign-in page) ---------------- */
function wifiBars(n) {
  const heights = [4, 7, 10, 13];
  return '<svg class="wf-bars" viewBox="0 0 20 16" aria-hidden="true">' +
    heights.map((h, i) => `<rect x="${i * 5}" y="${16 - h}" width="3.5" height="${h}" rx="1" fill="${i < n ? '#202124' : '#d0d5dd'}"/>`).join('') + '</svg>';
}

function renderWifiScenario(scenario, container) {
  const H = id => (scenario.hotspots[id] ? ` hs" data-hs="${id}` : '');
  if (scenario.context) {
    const ctx = document.createElement('div');
    ctx.className = 'mx-context';
    ctx.innerHTML = `<span class="mx-context-tag">WHAT YOU KNOW</span> ${scenario.context}`;
    container.appendChild(ctx);
  }
  if (scenario.networks) {
    const rows = scenario.networks.map((n, i) => `
      <div class="wf-row${H('net-' + i)}">
        <span class="wf-ssid">${n.ssid}</span>
        <span class="wf-meta">${n.secure ? icon('lock') : '<span class="wf-open">Open</span>'}${wifiBars(n.bars)}</span>
      </div>`).join('');
    const phone = document.createElement('div');
    phone.className = 'sv-win wf-phone';
    phone.innerHTML = `
      <div class="wf-status"><span>9:41</span><span>5G ▮▮▮ 87%</span></div>
      <div class="wf-title">Wi-Fi</div>
      <div class="wf-toggle"><span>Wi-Fi</span><span class="wf-sw"></span></div>
      <div class="wf-sub">AVAILABLE NETWORKS</div>
      <div class="wf-list">${rows}</div>`;
    container.appendChild(phone);
  }
  if (scenario.portal) {
    const wrap = document.createElement('div');
    wrap.className = 'sv-win mx-site';
    wrap.innerHTML = buildSiteHtml(scenario, scenario.portal);
    container.appendChild(wrap);
  }
}

/* ---------------- CHAT ---------------- */
function renderChatScenario(scenario, container) {
  const contact = scenario.contact || { name: 'Unknown', status: '', color: '#6b7280' };
  const wrap = document.createElement('div');
  wrap.className = 'sv-win mx-chat';
  let minute = 14;
  const rows = scenario.content.map((msg, index) => {
    const them = msg.sender === 'them';
    const time = `9:${String(minute).padStart(2, '0')} AM`;
    minute += 1;
    const attrs = them ? ` hs" data-hs="chat-${index}` : '';
    return `<div class="mx-msg-row ${msg.sender} pending"><div class="bubble mx-bubble${attrs}">${msg.message}</div><div class="mx-time">${time}</div></div>`;
  }).join('');
  wrap.innerHTML = `
    <div class="mx-chat-head">
      <div class="sv-avatar" style="background:${contact.color}">${contact.name.charAt(0)}</div>
      <div><div class="sv-name">${contact.name}</div><div class="sv-sub">${contact.status || ''}</div></div>
    </div>
    <div class="mx-chat-body" id="mx-chat-body"><div class="sv-notice">Today</div>${rows}</div>
    <div class="sv-input"><span>Type a message&hellip;</span><b class="sv-send">&#10148;</b></div>`;
  container.appendChild(wrap);
  revealChat(wrap.querySelectorAll('.mx-msg-row'));
}

function stopChatReveal() {
  (AppState.chatTimers || []).forEach(clearTimeout);
  AppState.chatTimers = [];
}

function finishChatReveal() {
  stopChatReveal();
  document.querySelectorAll('.mx-msg-row.pending').forEach(r => r.classList.remove('pending'));
  document.querySelectorAll('.mx-typing-row').forEach(r => r.remove());
}

function revealChat(rows) {
  AppState.chatTimers = [];
  let t = 350;
  rows.forEach(row => {
    const them = row.classList.contains('them');
    if (them) {
      AppState.chatTimers.push(setTimeout(() => {
        const typing = document.createElement('div');
        typing.className = 'mx-msg-row them mx-typing-row';
        typing.innerHTML = '<div class="bubble mx-typing"><i></i><i></i><i></i></div>';
        row.before(typing);
        typing.scrollIntoView({ block: 'nearest' });
      }, t));
      t += 850;
    } else {
      t += 450;
    }
    AppState.chatTimers.push(setTimeout(() => {
      const prev = row.previousElementSibling;
      if (prev && prev.classList.contains('mx-typing-row')) prev.remove();
      row.classList.remove('pending');
      row.scrollIntoView({ block: 'nearest' });
    }, t));
  });
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
  // Each scenario is worth up to 10 pts (6 missions × 5 scenarios × 10 = 300 max)
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
  
  // Cap score at the maximum possible
  AppState.score = Math.min(AppState.score, MAX_SCORE);

  // Streak of consecutive perfect scenarios (this session only)
  AppState.streak = (foundCorrect === totalCorrect && incorrectSelections === 0) ? (AppState.streak || 0) + 1 : 0;
  
  // Apply visual feedback to show correct/incorrect answers
  applyVisualFeedback(scenario, correctIndicators);
  
  // Show feedback after a short delay for visual effect
  setTimeout(() => {
    showFeedback(points, foundCorrect, totalCorrect, incorrectSelections, scenario);
  }, 500);
}

function applyVisualFeedback(scenario, correctIndicators) {
  finishChatReveal();
  document.querySelectorAll('#mission-content .hs').forEach(el => {
    const id = el.dataset.hs;
    if (correctIndicators.includes(id)) el.classList.add('correct');
    else if (AppState.selectedIndicators.includes(id)) el.classList.add('incorrect');
    el.classList.add('locked');
  });
  if (scenario.type === 'links') {
    document.querySelectorAll('.link-card').forEach((card, index) => {
      const key = `link-${index}`;
      const ic = card.querySelector('.link-icon');
      const verdict = card.querySelector('.lc-verdict');
      if (correctIndicators.includes(key)) {
        ic.innerHTML = window.icon('check');
        verdict.textContent = 'Lookalike domain';
        verdict.className = 'lc-verdict bad';
      } else {
        ic.innerHTML = AppState.selectedIndicators.includes(key) ? window.icon('x') : window.icon('circle');
        verdict.textContent = 'Official site';
        verdict.className = 'lc-verdict ok';
      }
    });
  }
}

function getCorrectIndicators(scenario) {
  if (scenario.hotspots) {
    return Object.keys(scenario.hotspots).filter(id => scenario.hotspots[id].flag);
  } else if (scenario.type === 'links') {
    return scenario.content
      .map((link, index) => link.suspicious ? `link-${index}` : null)
      .filter(Boolean);
  } else if (scenario.type === 'chat') {
    return scenario.content
      .map((msg, index) => msg.flag ? `chat-${index}` : null)
      .filter(Boolean);
  }
  return [];
}

function getIndicatorName(indicator, scenario) {
  if (scenario.hotspots && scenario.hotspots[indicator]) {
    return scenario.hotspots[indicator].name;
  } else if (scenario.type === 'links') {
    const linkIndex = parseInt(indicator.split('-')[1]);
    const real = scenario.content[linkIndex] && scenario.content[linkIndex].suspicious;
    return `${real ? 'Suspicious URL' : 'URL'} #${linkIndex + 1}`;
  } else if (scenario.type === 'chat') {
    const chatIndex = parseInt(indicator.split('-')[1]);
    const message = scenario.content[chatIndex];
    return message && message.flag ? message.flag : `Message #${chatIndex + 1}`;
  }
  return indicator;
}

function showFeedback(points, found, total, incorrect, scenario) {
  const grade = document.getElementById('feedback-grade');
  const streakEl = document.getElementById('feedback-streak');
  let gradeText, gradeClass;
  if (found === total && incorrect === 0) { gradeText = 'PERFECT'; gradeClass = 'perfect'; }
  else if (found === total) { gradeText = 'ALL FOUND'; gradeClass = 'good'; }
  else if (found > 0) { gradeText = 'GOOD START'; gradeClass = 'ok'; }
  else { gradeText = 'KEEP LOOKING'; gradeClass = 'miss'; }
  if (grade) { grade.textContent = gradeText; grade.className = 'grade ' + gradeClass; }
  if (streakEl) {
    const s = AppState.streak || 0;
    streakEl.innerHTML = s >= 2 ? `${icon('bolt')} Streak ×${s}. Keep it going!` : '';
    streakEl.style.display = s >= 2 ? 'flex' : 'none';
  }

  document.getElementById('feedback-points').textContent = points > 0 ? `+${points} points` : `${points} points`;
  document.getElementById('feedback-summary').textContent = `${found} of ${total} indicators found${incorrect > 0 ? `, ${incorrect} incorrect selection${incorrect > 1 ? 's' : ''}` : ''}.`;

  const feedbackItems = document.getElementById('feedback-items');
  feedbackItems.innerHTML = '';

  const correctIndicators = getCorrectIndicators(scenario);
  const explanations = scenario.explanations || {};
  const safeNotes = scenario.safeNotes || {};

  correctIndicators.forEach(indicator => {
    const wasFound = AppState.selectedIndicators.includes(indicator);
    const explanation = explanations[indicator] || "This is a phishing indicator that attackers commonly use.";
    const item = document.createElement('div');
    item.className = 'feedback-item';
    item.innerHTML = `
      <div class="fdot ${wasFound ? 'good' : 'bad'}"></div>
      <div>
        <h4>${wasFound ? icon('check', 'ic-inline') + 'CORRECTLY IDENTIFIED' : icon('x', 'ic-inline') + 'MISSED'}: ${getIndicatorName(indicator, scenario)}</h4>
        <p>${explanation}</p>
      </div>`;
    feedbackItems.appendChild(item);
  });

  AppState.selectedIndicators.forEach(indicator => {
    if (!correctIndicators.includes(indicator)) {
      const note = safeNotes[indicator] || "This one is legitimate. Be careful not to flag normal elements.";
      const item = document.createElement('div');
      item.className = 'feedback-item';
      item.innerHTML = `
        <div class="fdot bad"></div>
        <div>
          <h4>${icon('x', 'ic-inline')}NOT A RED FLAG: ${getIndicatorName(indicator, scenario)}</h4>
          <p>${note}</p>
        </div>`;
      feedbackItems.appendChild(item);
    }
  });

  if (found === 0 && incorrect === 0) {
    const item = document.createElement('div');
    item.className = 'feedback-item';
    item.innerHTML = `
      <div class="fdot bad"></div>
      <div>
        <h4>NO INDICATORS FOUND</h4>
        <p>You didn't flag anything this time. Look closely at addresses, requests, and anything that pressures you to act fast.</p>
      </div>`;
    feedbackItems.appendChild(item);
  }

  const nextBtn = document.getElementById('feedback-next-btn');
  if (AppState.currentScenario < 4) {
    nextBtn.innerHTML = 'Next scenario ' + icon('arrow');
    nextBtn.onclick = nextScenario;
  } else {
    nextBtn.innerHTML = 'Complete mission ' + icon('flag');
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
  
  document.getElementById('debrief-title').innerHTML = `${mission.name} cleared ` + icon('sparkles','ic-inline');
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
  renderAssessmentVisual('post-assessment-visual', question.visual);

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
  
  document.getElementById('results-title').innerHTML = `Your awareness went up ${improvement} points ` + icon('trend','ic-inline');
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
Total Score: ${AppState.score}/${MAX_SCORE}
Scenarios Completed: ${AppState.scenariosCompleted}/${TOTAL_SCENARIOS}

MISSION DETAILS
---------------
${Object.keys(Missions).map(id => { const mp = AppState.missionProgress[id]; return Missions[id].name + ': ' + (mp.completed ? 'Completed' : mp.scenarios.length > 0 ? 'In Progress' : 'Not Started') + ' (' + missionScoreSummary(id).points + '/' + (SCENARIOS_PER_MISSION * POINTS_PER_SCENARIO) + ' pts)'; }).join('\n')}

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