# Sentra Server

The backend API for Sentra - an AI-powered code risk intelligence platform built with Node.js, Express, and MongoDB.

## 🚀 Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: Argon2, bcrypt
- **2FA**: Speakeasy (TOTP)
- **Email**: Nodemailer
- **Rate Limiting**: express-rate-limit
- **Security**: cookie-parser, CORS
- **AI Integration**: Google Gemini AI
- **Utilities**: moment, validator, qrcode, chalk

## 📁 Project Structure

```
server/
├── src/
│   ├── config/                   # Configuration files
│   │   └── db.js                 # MongoDB connection
│   │
│   ├── controllers/              # Route controllers
│   │   ├── auth/                 # Authentication controllers
│   │   │   ├── loginController.js
│   │   │   ├── signupController.js
│   │   │   ├── profileController.js
│   │   │   ├── forgotPasswordController.js
│   │   │   └── twoFAController.js
│   │   ├── prAnalysis/           # PR analysis controllers
│   │   │   └── prAnalysisController.js
│   │   ├── users/                # User management
│   │   │   └── usersController.js
│   │   ├── activityLog/          # Activity logging
│   │   │   └── activityLogController.js
│   │   └── context/              # Repository context
│   │       └── contextController.js
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.js               # JWT authentication
│   │   ├── roleCheck.js          # Role-based access control
│   │   └── rateLimiter.js        # Rate limiting
│   │
│   ├── models/                   # Mongoose models
│   │   ├── sentra/               # Sentra database models
│   │   │   ├── UserModel.js
│   │   │   ├── SignupSessionModel.js
│   │   │   ├── OTPModel.js
│   │   │   ├── TwoFAModel.js
│   │   │   ├── PRAnalysisModel.js
│   │   │   ├── RepositoryModel.js
│   │   │   ├── ActivityLogModel.js
│   │   │   └── ContextModel.js
│   │   └── index.js              # Model exports
│   │
│   ├── routers/                  # Express routers
│   │   ├── auth/                 # Auth routes
│   │   │   └── authRouter.js
│   │   ├── prAnalysis/           # PR analysis routes
│   │   │   └── prAnalysisRouter.js
│   │   ├── users/                # User routes
│   │   │   └── usersRouter.js
│   │   ├── activityLog/          # Activity log routes
│   │   │   └── activityLogRouter.js
│   │   ├── context/              # Context routes
│   │   │   └── contextRouter.js
│   │   └── index.js              # Router aggregation
│   │
│   ├── utils/                    # Utility functions
│   │   ├── index.js              # Response helpers
│   │   ├── emailService.js       # Email sending
│   │   ├── otpService.js         # OTP generation
│   │   ├── jwtService.js         # JWT operations
│   │   └── passwordService.js    # Password hashing
│   │
│   └── index.js                  # Application entry point
│
├── package.json                  # Dependencies
└── .env                          # Environment variables

```

## 🎯 Key Features

### Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Argon2 for new passwords, bcrypt for legacy
- **Two-Factor Authentication (2FA)**:
  - Phone-based (OTP via email)
  - Authenticator app (TOTP with QR code)
  - Backup codes (10 single-use codes)
- **Email Verification**: OTP-based email verification
- **Password Reset**: Secure OTP-based password reset
- **Rate Limiting**: Prevent brute force attacks
- **CORS Protection**: Configured for frontend origin
- **Cookie Security**: HTTP-only cookies for tokens

### User Management
- **User CRUD**: Create, read, update, delete users
- **Role Management**: Admin and User roles
- **Profile Management**: Update name, email, password
- **2FA Management**: Enable/disable 2FA methods

### PR Analysis
- **Manual Analysis**: Analyze GitHub PR URLs or code diffs
- **Gemini AI Integration**: AI-powered risk assessment
- **Severity Ratings**: Critical, High, Medium, Low
- **Analysis History**: Store and retrieve past analyses
- **Filtering & Pagination**: Advanced query capabilities
- **Multi-Delete**: Bulk delete with authorization

### Activity Logging
- **Comprehensive Logging**: Track all user actions
- **Method Tracking**: GET, POST, PATCH, DELETE
- **Timestamp**: Created_At for each activity
- **User Association**: Link activities to users

### Repository Context
- **Context Management**: Store repository context data
- **Admin Only**: Restricted to admin users

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB 7+
- Gmail account (for email service)
- Google Gemini API key

### Environment Variables

Create a `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sentra

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Service (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Run Production Server

```bash
npm start
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

#### Signup Flow
```
POST   /auth/signup/initiate              # Start signup, send email OTP
POST   /auth/signup/verify-email          # Verify email OTP
POST   /auth/signup/setup-profile         # Set name and password
POST   /auth/signup/setup-phone-2fa       # Setup phone 2FA
POST   /auth/signup/setup-authenticator-2fa # Setup authenticator 2FA
POST   /auth/signup/generate-backup-codes # Generate backup codes
POST   /auth/signup/complete              # Complete signup
POST   /auth/signup/progress              # Check signup progress
POST   /auth/signup/resend-email-otp     # Resend email OTP
POST   /auth/signup/resend-phone-2fa-otp # Resend phone 2FA OTP
```

#### Login & Authentication
```
POST   /auth/login                        # Login with email/password
POST   /auth/logout                       # Logout user
GET    /auth/profile                      # Get current user profile
POST   /auth/resend-otp                   # Resend OTP
```

#### Password Management
```
POST   /auth/forgot-password              # Request password reset OTP
POST   /auth/reset-password               # Reset password with OTP
POST   /auth/change-password              # Change password (authenticated)
```

#### 2FA Management
```
POST   /auth/twofa/login/send-code       # Send 2FA code during login
POST   /auth/twofa/login/verify          # Verify 2FA code during login
POST   /auth/twofa/setup/phone           # Setup phone 2FA
POST   /auth/twofa/setup/authenticator   # Setup authenticator 2FA
POST   /auth/twofa/verify                # Verify 2FA code
POST   /auth/twofa/disable               # Disable 2FA method
```

### PR Analysis Routes (`/api/pr-analyses`)

```
GET    /pr-analyses                       # List all analyses (with filters)
POST   /pr-analyses                       # Create new analysis
DELETE /pr-analyses/:id                   # Delete analysis
```

**Query Parameters for GET:**
- `search` - Search by owner, repo, title, severity
- `type` - Filter by type (manual, webhook)
- `date_range` - Filter by date (latest, oldest, 1d, 1w, 1m, 1y)
- `limit` - Items per page (default: 20, max: 100)
- `skip` - Offset for pagination

### User Management Routes (`/api/users`)

```
GET    /users                             # List all users (Admin only)
POST   /users                             # Create user (Admin only)
PATCH  /users/:id                         # Update user
DELETE /users/:id                         # Delete user (Admin only)
```

### Activity Log Routes (`/api/activity-logs`)

```
GET    /activity-logs                     # List all activity logs (Admin only)
```

### Repository Context Routes (`/api/context`)

```
GET    /context                           # Get all contexts (Admin only)
POST   /context                           # Create context (Admin only)
PATCH  /context/:id                       # Update context (Admin only)
DELETE /context/:id                       # Delete context (Admin only)
```

## 🔐 Authentication Flow

### Middleware Chain

```javascript
// Public routes (no auth required)
router.post('/auth/login', loginController);

// Protected routes (JWT required)
router.get('/auth/profile', authenticate, profileController);

// Admin routes (JWT + Admin role required)
router.get('/users', authenticate, requireAdmin, listUsers);
```

### JWT Token Structure

```json
{
  "User_Id": "507f1f77bcf86cd799439011",
  "Email": "user@example.com",
  "Role": "USER",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 📧 Email Service

### Configuration (`utils/emailService.js`)

Uses Nodemailer with Gmail SMTP:

```javascript
{
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
}
```

### Email Templates

- **OTP Verification**: 6-digit code for email verification
- **Password Reset**: OTP for password reset
- **2FA Code**: Phone-based 2FA code
- **Backup Codes**: List of backup codes

## 🔒 Security Features

### Password Hashing

```javascript
// Argon2 (preferred)
const hash = await argon2.hash(password);
const isValid = await argon2.verify(hash, password);

// Bcrypt (legacy support)
const hash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hash);
```

### OTP Generation

```javascript
// 6-digit OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// Expiry: 10 minutes
const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
```

### 2FA TOTP

```javascript
// Generate secret
const secret = speakeasy.generateSecret({ name: 'Sentra' });

// Generate QR code
const qrCode = await qrcode.toDataURL(secret.otpauth_url);

// Verify token
const isValid = speakeasy.totp.verify({
  secret: secret.base32,
  encoding: 'base32',
  token: userToken
});
```

### Rate Limiting

```javascript
// Global rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // 5 attempts per window
});
```

## 🗄️ Database Models

### User Model

```javascript
{
  Name: String,
  Email: String (unique, required),
  Password: String (hashed),
  Role: String (enum: ['USER', 'ADMIN']),
  Email_Verified: Boolean,
  Created_At: String,
  Updated_At: String
}
```

### SignupSession Model

```javascript
{
  Email: String (unique),
  Name: String,
  Password: String (hashed),
  Email_Verified: Boolean,
  Profile_Completed: Boolean,
  TwoFA_Completed: Boolean,
  TwoFA_Methods: {
    phone: Boolean,
    authenticator: Boolean,
    backupCodes: Boolean
  },
  Expires_At: Date
}
```

### OTP Model

```javascript
{
  Email: String,
  OTP: String,
  Purpose: String (enum: ['VERIFY_EMAIL', 'RESET_PASSWORD', '2FA_PHONE']),
  Expires_At: Date,
  Created_At: String
}
```

### TwoFA Model

```javascript
{
  User_Id: ObjectId,
  Method: String (enum: ['phone', 'authenticator']),
  Phone_Number: String,
  Authenticator_Secret: String,
  Backup_Codes: [String],
  Enabled: Boolean,
  Created_At: String
}
```

### PRAnalysis Model

```javascript
{
  User_Id: ObjectId,
  Repo_Id: ObjectId,
  owner: String,
  repo: String,
  title: String,
  pr_url: String,
  diff: String,
  analysis: String,
  severity: String (enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  analysis_type: String (enum: ['manual', 'webhook']),
  Created_At: String
}
```

### ActivityLog Model

```javascript
{
  User_Id: ObjectId,
  Action: String,
  Method: String (enum: ['GET', 'POST', 'PATCH', 'DELETE']),
  Resource: String,
  Details: String,
  Created_At: String
}
```

## 🤖 Gemini AI Integration

### Analysis Flow

```javascript
// 1. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// 2. Create prompt
const prompt = `Analyze this PR for security risks...`;

// 3. Generate analysis
const result = await model.generateContent(prompt);
const analysis = result.response.text();

// 4. Extract severity
const severity = extractSeverity(analysis);

// 5. Store in database
await PRAnalysis.create({ analysis, severity, ... });
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/sentra
    depends_on:
      - mongo
  
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### Environment Setup

**Development:**
```bash
NODE_ENV=development
```

**Production:**
```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
MONGODB_URI=<production-mongodb-uri>
```

## 🐛 Troubleshooting

### Common Issues

**Issue**: MongoDB connection failed
- **Solution**: Check `MONGODB_URI` and ensure MongoDB is running

**Issue**: Email not sending
- **Solution**: 
  - Enable "Less secure app access" in Gmail
  - Use App-specific password
  - Check `EMAIL_USER` and `EMAIL_PASS`

**Issue**: JWT verification failed
- **Solution**: Check `JWT_SECRET` matches between requests

**Issue**: Gemini API error
- **Solution**: Verify `GEMINI_API_KEY` is valid

**Issue**: CORS error
- **Solution**: Check `FRONTEND_URL` matches client URL

## 📊 Logging

### Console Logging

```javascript
// Success (green)
console.log(chalk.green('✓ Server started'));

// Error (red)
console.log(chalk.red('✗ Database connection failed'));

// Info (blue)
console.log(chalk.blue('ℹ Processing request'));
```

### Activity Logging

All user actions are logged to `ActivityLog` collection:

```javascript
await ActivityLog.create({
  User_Id: req.user.User_Id,
  Action: 'User login',
  Method: 'POST',
  Resource: '/auth/login',
  Details: `User ${email} logged in`,
  Created_At: moment().format('YYYY-MM-DD HH:mm:ss')
});
```

## 🧪 Testing

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Test protected route
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <token>"
```

## 📄 License

This project is part of the Sentra platform.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.
