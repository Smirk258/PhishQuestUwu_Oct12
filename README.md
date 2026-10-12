# PhishQuest - Tactical Cybersecurity Training Application

A professional phishing awareness training web application designed to teach users how to identify and avoid phishing attacks through interactive missions and scenarios.

## Features

### 🔐 Authentication System
- **User Registration**: Create new agent accounts with username, email, and password
- **Login System**: Secure authentication with username and password
- **User Progress**: Individual progress tracking and scoring system

### 📚 Assessment System
- **Pre-Assessment**: 5-question evaluation to establish baseline knowledge
- **Post-Assessment**: 5-question evaluation to measure improvement
- **Progress Tracking**: Visual progress indicators and score comparison

### 🎯 Mission System (4 Missions, 5 Scenarios Each = 20 Total Scenarios)

#### Mission 1: Email Detective
- Identify phishing indicators in suspicious emails
- Spot red flags like fake sender domains, urgent language, and suspicious links
- 5 interactive email scenarios

#### Mission 2: Link Hunter
- Distinguish between legitimate and malicious URLs
- Learn to identify homoglyph attacks, domain substitutions, and suspicious TLDs
- 5 link analysis scenarios

#### Mission 3: Fake Website
- Inspect cloned login pages and fake websites
- Identify domain mismatches, urgency tactics, and design inconsistencies
- 5 website inspection scenarios

#### Mission 4: Social Engineering
- Detect impersonation and manipulation tactics in chat conversations
- Learn to recognize credential harvesting, authority abuse, and pressure tactics
- 5 chat-based scenarios

### 🏆 Gamification Features
- **Progressive Unlocking**: Missions unlock sequentially as you complete previous ones
- **Scoring System**: Earn points for correctly identifying phishing indicators
- **Rank Progression**: Advance from Novice Hunter to Master Hunter based on performance
- **Immediate Feedback**: Real-time feedback after each scenario
- **Mission Debrief**: Summary of performance after completing each mission

### 📊 Results & Reporting
- **Performance Analytics**: Track pre/post assessment improvement
- **Progress Dashboard**: Visual representation of completion status
- **Downloadable Reports**: Generate detailed training reports
- **Leaderboard**: Compare performance with other participants

## Design Specifications

The application precisely follows the provided design template with:
- **Dark Theme**: Professional cybersecurity aesthetic with deep purple/violet color scheme
- **Tactical UI**: Military-inspired interface elements and terminology
- **Responsive Design**: Optimized for desktop and tablet viewing
- **Smooth Animations**: Screen transitions and interactive elements
- **Color-Coded Feedback**: Visual indicators for correct/incorrect actions

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, and JavaScript (no frameworks)
- **Storage**: LocalStorage for user data persistence
- **Fonts**: Google Fonts (Baloo 2, Plus Jakarta Sans)
- **Icons**: Emoji-based icon system

## File Structure

```
Thesis2/
├── index.html          # Main application HTML
├── styles.css          # Complete styling matching design template
├── app.js             # Application logic and functionality
└── README.md          # Documentation
```

## How to Use

### Local Development
1. Open the project folder in a web browser, or
2. Run a local server:
   ```bash
   python -m http.server 8000
   ```
3. Navigate to `http://localhost:8000`

### User Flow
1. **Register/Login**: Create an account or login with existing credentials
2. **Pre-Assessment**: Complete the initial knowledge assessment
3. **Mission Hub**: Choose your first mission (Email Detective)
4. **Complete Scenarios**: Work through 5 scenarios per mission
5. **Earn Points**: Identify phishing indicators correctly to score points
6. **Unlock Missions**: Complete missions sequentially to unlock new content
7. **Post-Assessment**: Take the final assessment to measure improvement
8. **View Results**: Check your performance and download reports

## Scoring System

- **Maximum Score**: 200 points (20 scenarios × 10 points each)
- **Scenario Scoring**: Based on correct identification of phishing indicators
- **Ranks**:
  - Novice Hunter: 0-59 points
  - Junior Agent: 60-99 points
  - Skilled Operative: 100-139 points
  - Senior Agent: 140-179 points
  - Master Hunter: 180-200 points

## Data Storage

User data is stored locally in the browser's LocalStorage:
- User credentials (username, email, password)
- Progress tracking (completed scenarios, scores)
- Assessment results (pre/post scores)
- Mission completion status

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design support

## Security Notes

This is a training application for educational purposes. Passwords are stored locally in LocalStorage and should not be used for production environments without proper security measures.

## Customization

### Adding New Scenarios
Edit the `Missions` object in `app.js` to add new scenarios to existing missions or create new mission types.

### Modifying Questions
Update the `AssessmentQuestions` array in `app.js` to customize pre/post assessment questions.

### Styling Changes
Modify CSS variables in `styles.css` to adjust the color scheme and visual design.

## License

This project was created for educational and thesis purposes.