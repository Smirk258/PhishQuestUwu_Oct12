# MySQL Integration Notes for PhishQuest

## Current Implementation
The current PhishQuest application uses **LocalStorage** for data persistence, which provides:
- User registration and login functionality
- Progress tracking and score storage
- Assessment results storage
- Session management

## MySQL Integration Requirements (REQ16)
According to the TP requirements, the system should use MySQL for data storage. For a production environment, the following would be required:

### Backend Server Requirements
1. **Server-side language**: PHP, Node.js, Python, or similar
2. **Database**: MySQL server
3. **API endpoints**: RESTful API for frontend-backend communication

### Database Schema Suggestion
```sql
CREATE DATABASE phishquest;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    agent_number INT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score INT DEFAULT 0,
    scenarios_completed INT DEFAULT 0,
    pre_assessment_score INT DEFAULT 0,
    post_assessment_score INT DEFAULT 0,
    pre_assessment_completed BOOLEAN DEFAULT FALSE,
    post_assessment_completed BOOLEAN DEFAULT FALSE,
    mission_progress JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE assessment_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pre_assessment_score INT,
    post_assessment_score INT,
    improvement_score INT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### API Endpoints Needed
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/progress/:userId` - Get user progress
- `POST /api/progress/:userId` - Update user progress
- `POST /api/assessment/:userId` - Save assessment results
- `GET /api/results/:userId` - Get user results

### Implementation Approach
To integrate MySQL, you would need to:

1. **Set up a backend server** (Node.js with Express recommended)
2. **Install MySQL driver** (mysql2 for Node.js)
3. **Create database connection pool**
4. **Implement API endpoints**
5. **Modify frontend to use API calls instead of LocalStorage**
6. **Add authentication middleware** (JWT sessions)

### Current Limitations
- LocalStorage is browser-specific and not suitable for multi-user environments
- No server-side validation
- Limited security compared to database implementation
- Data loss if browser cache is cleared

### Recommendation
For the thesis/academic purposes, the current LocalStorage implementation meets all functional requirements. For production deployment, MySQL integration with a proper backend server would be necessary as specified in REQ16.

## Security Considerations (REQ21-23)
- Password hashing (bcrypt) required for MySQL implementation
- Input validation and sanitization
- SQL injection prevention
- Secure session management
- Only simulated phishing content (no real credentials)