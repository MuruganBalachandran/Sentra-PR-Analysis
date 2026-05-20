# Sentra - AI-Powered Code Risk Intelligence Platform

<div align="center">

![Sentra Logo](https://via.placeholder.com/150x150?text=S)

**Catch high-risk pull requests before they reach production**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

</div>

## 📖 Overview

Sentra is an enterprise-grade security platform that analyzes GitHub pull requests using AI to identify potential risks, security vulnerabilities, and code quality issues. By leveraging Google Gemini AI and architectural context awareness, Sentra provides severity-rated assessments that help development teams make informed decisions about code changes.

### 🎯 Key Capabilities

- **AI-Powered Analysis**: Intelligent code risk assessment using Google Gemini AI
- **GitHub Integration**: Automated PR monitoring via webhooks
- **Severity Ratings**: Critical, High, Medium, and Low risk classifications
- **Multi-Factor Authentication**: Phone, Authenticator app, and Backup codes
- **Role-Based Access Control**: Admin and User roles with granular permissions
- **Activity Logging**: Comprehensive audit trail of all system actions
- **Advanced Filtering**: Search, filter, and paginate through analysis history

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  Next.js 16 + React 19 + TypeScript + Tailwind CSS         │
│  Port: 5173                                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     │ JWT Authentication
┌────────────────────▼────────────────────────────────────────┐
│                         Backend                              │
│  Node.js + Express.js + MongoDB + Mongoose                  │
│  Port: 3000                                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼────────────┐
│   MongoDB    │ │ Gemini  │ │ Email Service │
│   Database   │ │   AI    │ │  (Nodemailer) │
└──────────────┘ └─────────┘ └───────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **MongoDB** 7+
- **Gmail Account** (for email service)
- **Google Gemini API Key**

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sentra.git
cd sentra
```

### 2. Setup Backend

```bash
cd server
npm install

# Create .env file
cat > .env << EOF
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sentra
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:5173
EOF

# Start server
npm run dev
```

### 3. Setup Frontend

```bash
cd ../client
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local

# Start client
npm run dev
```

### 4. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

## 📁 Project Structure

```
sentra/
├── client/                      # Frontend application
│   ├── app/                     # Next.js pages (App Router)
│   ├── components/              # React components
│   ├── lib/                     # Utilities and API clients
│   ├── store/                   # Redux store
│   ├── public/                  # Static assets
│   └── package.json
│
├── server/                      # Backend application
│   ├── src/
│   │   ├── config/              # Configuration
│   │   ├── controllers/         # Route controllers
│   │   ├── middleware/          # Express middleware
│   │   ├── models/              # Mongoose models
│   │   ├── routers/             # Express routers
│   │   ├── utils/               # Utility functions
│   │   └── index.js             # Entry point
│   └── package.json
│
└── README.md                    # This file
```

## 🎨 Features

### 🔐 Authentication & Security

#### Multi-Step Signup Flow
1. **Email Verification**: OTP sent to email
2. **Profile Setup**: Name and password
3. **2FA Setup**: Phone and/or Authenticator app
4. **Backup Codes**: 10 single-use recovery codes

#### Two-Factor Authentication (2FA)
- **Phone-based**: OTP sent via email
- **Authenticator App**: TOTP with QR code (Google Authenticator, Authy, etc.)
- **Backup Codes**: Emergency access codes

#### Password Management
- **Secure Hashing**: Argon2 for new passwords, bcrypt for legacy
- **Password Reset**: Email-based OTP verification
- **Password Change**: Requires current password or email verification

### 📊 Dashboard

#### Welcome Section
- Personalized greeting with user name
- Role-based dashboard (User/Admin)
- Quick access to PR analysis

#### Features Section
Three feature cards showcasing:
- 🔍 **Analyze a PR**: Instant AI risk assessment
- 📋 **PR Analyses**: View analysis history
- 👤 **My Profile**: Account management

#### How It Works
4-step platform overview:
1. Connect your repository
2. System context is built
3. PR is evaluated
4. Risk report is generated

#### FAQ Section
4 tabs with 10 questions each:
- **General**: Platform overview
- **GitHub PR**: Integration details
- **Gemini AI**: AI capabilities
- **Security**: Security features

### 🔍 PR Analysis

#### Manual Analysis
- Paste GitHub PR URL or raw code diff
- AI-powered risk assessment
- Severity rating (Critical, High, Medium, Low)
- Markdown-formatted results

#### Analysis History
- View all past analyses
- Advanced filtering and search
- Pagination with customizable page size
- Multi-select delete

### 📋 PR Analyses Management

#### Advanced Filtering
- **Search**: By owner, repo, title, severity
- **Type Filter**: Manual, Webhook, All
- **Date Range**: Latest, Oldest, 1d, 1w, 1m, 1y
- **Clear Filters**: One-click filter reset

#### Pagination
- Items per page: 5, 10, 20, 50, 100
- Page navigation with ellipsis
- Smart navigation (auto-adjust on delete)

#### Multi-Select Delete
- Checkbox selection
- Bulk delete with confirmation
- Authorization check (own analyses or admin)

### 👤 User Profile

#### Profile Information
- Update name
- Update email
- View role and timestamps

#### Password Management
Two methods:
1. **Direct Change**: Requires current password
2. **Email Reset**: OTP verification

#### 2FA Management
- Enable/disable 2FA methods
- View active 2FA methods
- Regenerate backup codes

### 👥 Admin Features

#### User Management
- Create new users
- Edit user details
- Toggle user roles (Admin/User)
- Delete users
- View all users in table

#### Activity Logs
- View all system activities
- Filter by user, action, method
- Timestamp tracking
- Method badges (GET, POST, PATCH, DELETE)

#### Repository Context
- Manage repository context data
- CRUD operations
- Admin-only access

### 🎨 UI/UX Features

#### Collapsible Sidebar
- Toggle button with smooth animation
- Collapses to icon-only view
- Responsive on mobile

#### Responsive Design
- Mobile-friendly layouts
- Adaptive grid systems
- Touch-optimized controls

#### Toast Notifications
- Success messages (green)
- Error messages (red)
- Info messages (blue)
- Auto-dismiss with progress bar

#### Loading States
- Skeleton loaders
- Spinner animations
- AI brain loader for analysis

#### Empty States
- Helpful messages when no data
- Icon-based visual feedback
- Call-to-action buttons

#### Modal Dialogs
- Confirmation modals for destructive actions
- Logout confirmation
- Delete confirmation
- Smooth animations

#### Password Visibility
- Eye icons for all password fields
- Independent toggle for password and confirm password
- Consistent across all forms

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | React framework with App Router |
| React | 19.2.3 | UI library |
| TypeScript | 5 | Type safety |
| Redux Toolkit | 2.2.1 | State management |
| Tailwind CSS | 4 | Utility-first CSS |
| Axios | 1.7.9 | HTTP client |
| React Toastify | 11.0.5 | Toast notifications |
| React Markdown | 10.1.0 | Markdown rendering |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| Express.js | 5.2.1 | Web framework |
| MongoDB | 7+ | NoSQL database |
| Mongoose | 9.1.5 | MongoDB ODM |
| JWT | 9.0.3 | Authentication tokens |
| Argon2 | 0.44.0 | Password hashing |
| Speakeasy | 2.0.0 | TOTP for 2FA |
| Nodemailer | 8.0.1 | Email service |
| Google Gemini AI | - | AI analysis |

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Signup Flow
```http
POST /auth/signup/initiate
POST /auth/signup/verify-email
POST /auth/signup/setup-profile
POST /auth/signup/setup-phone-2fa
POST /auth/signup/setup-authenticator-2fa
POST /auth/signup/generate-backup-codes
POST /auth/signup/complete
```

#### Login & Auth
```http
POST /auth/login
POST /auth/logout
GET  /auth/profile
```

#### Password Management
```http
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/change-password
```

#### 2FA Management
```http
POST /auth/twofa/login/send-code
POST /auth/twofa/login/verify
POST /auth/twofa/setup/phone
POST /auth/twofa/setup/authenticator
POST /auth/twofa/verify
POST /auth/twofa/disable
```

### PR Analysis Endpoints

```http
GET    /pr-analyses              # List analyses
POST   /pr-analyses              # Create analysis
DELETE /pr-analyses/:id          # Delete analysis
```

### User Management Endpoints

```http
GET    /users                    # List users (Admin)
POST   /users                    # Create user (Admin)
PATCH  /users/:id                # Update user
DELETE /users/:id                # Delete user (Admin)
```

### Activity Log Endpoints

```http
GET /activity-logs               # List logs (Admin)
```

### Repository Context Endpoints

```http
GET    /context                  # List contexts (Admin)
POST   /context                  # Create context (Admin)
PATCH  /context/:id              # Update context (Admin)
DELETE /context/:id              # Delete context (Admin)
```

## 🔒 Security Features

### Authentication
- JWT-based authentication
- HTTP-only cookies
- Token expiration (7 days)
- Refresh token rotation

### Password Security
- Argon2 hashing (preferred)
- Bcrypt support (legacy)
- Minimum 6 characters
- Password strength validation

### Two-Factor Authentication
- TOTP (Time-based One-Time Password)
- QR code generation
- Backup codes (10 single-use)
- Multiple 2FA methods

### Rate Limiting
- Global: 100 requests per 15 minutes
- Auth: 5 attempts per 15 minutes
- Prevents brute force attacks

### CORS Protection
- Configured for specific frontend origin
- Credentials included
- Preflight requests handled

### Input Validation
- Email validation
- Password strength checks
- SQL injection prevention
- XSS protection

## 🚀 Deployment

### Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  client:
    build: ./client
    ports:
      - "5173:5173"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000/api
    depends_on:
      - server

  server:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/sentra
      - JWT_SECRET=${JWT_SECRET}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASS=${EMAIL_PASS}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
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

### Production Deployment

#### Environment Variables

**Backend (.env)**
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sentra
JWT_SECRET=<strong-random-secret>
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=<app-specific-password>
GEMINI_API_KEY=<your-api-key>
FRONTEND_URL=https://your-domain.com
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

#### Deployment Platforms

**Vercel (Frontend)**
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

**Railway/Render (Backend)**
1. Connect GitHub repository
2. Set environment variables
3. Configure build command: `npm install`
4. Configure start command: `npm start`
5. Deploy

**MongoDB Atlas (Database)**
1. Create cluster
2. Configure network access
3. Create database user
4. Get connection string
5. Update `MONGODB_URI`

## 🧪 Testing

### Manual Testing

#### Test Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get Profile
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <token>"
```

#### Test PR Analysis
```bash
# Create Analysis
curl -X POST http://localhost:3000/api/pr-analyses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"pr_url":"https://github.com/owner/repo/pull/123"}'

# List Analyses
curl http://localhost:3000/api/pr-analyses?limit=10&skip=0 \
  -H "Authorization: Bearer <token>"
```

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
**Problem**: Cannot connect to MongoDB
**Solution**: 
- Check MongoDB is running: `mongod --version`
- Verify `MONGODB_URI` in `.env`
- Check network connectivity

#### Email Not Sending
**Problem**: OTP emails not received
**Solution**:
- Enable "Less secure app access" in Gmail
- Use App-specific password
- Check `EMAIL_USER` and `EMAIL_PASS`
- Verify spam folder

#### JWT Verification Failed
**Problem**: Token invalid or expired
**Solution**:
- Check `JWT_SECRET` matches
- Clear cookies and login again
- Verify token expiration time

#### Gemini API Error
**Problem**: AI analysis failing
**Solution**:
- Verify `GEMINI_API_KEY` is valid
- Check API quota limits
- Review API error messages

#### CORS Error
**Problem**: Frontend cannot access backend
**Solution**:
- Check `FRONTEND_URL` in backend `.env`
- Verify CORS configuration
- Check browser console for details

#### Build Errors
**Problem**: npm install or build fails
**Solution**:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (18+)

## 📊 Performance

### Optimization Techniques

#### Frontend
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Dynamic imports for heavy components
- **Caching**: Redux Persist for state
- **Minification**: Production build optimization

#### Backend
- **Database Indexing**: Indexed fields for faster queries
- **Connection Pooling**: MongoDB connection reuse
- **Rate Limiting**: Prevent abuse
- **Compression**: Gzip compression for responses
- **Caching**: In-memory caching for frequent queries

## 📈 Monitoring

### Logging

#### Backend Logging
```javascript
// Success logs (green)
console.log(chalk.green('✓ Server started on port 3000'));

// Error logs (red)
console.log(chalk.red('✗ Database connection failed'));

// Info logs (blue)
console.log(chalk.blue('ℹ Processing PR analysis'));
```

#### Activity Logging
All user actions logged to database:
- User login/logout
- PR analysis creation
- User management actions
- Profile updates

### Health Checks

```bash
# Backend health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/db
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style

- **Frontend**: ESLint + Prettier
- **Backend**: ESLint
- **Commits**: Conventional Commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Your Name
- **Email**: your.email@example.com
- **GitHub**: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Express.js](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Google Gemini AI](https://ai.google.dev/) - AI analysis
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 📞 Support

For support, email support@sentra.com or open an issue on GitHub.

## 🔗 Links

- **Documentation**: [docs.sentra.com](https://docs.sentra.com)
- **Website**: [sentra.com](https://sentra.com)
- **GitHub**: [github.com/yourusername/sentra](https://github.com/yourusername/sentra)

---

<div align="center">

**Made with ❤️ by the Sentra Team**

[⬆ Back to Top](#sentra---ai-powered-code-risk-intelligence-platform)

</div>
