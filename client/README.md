# Sentra Client

The frontend application for Sentra - an AI-powered code risk intelligence platform built with Next.js 16, React 19, and TypeScript.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, Custom CSS
- **State Management**: Redux Toolkit with Redux Persist
- **HTTP Client**: Axios
- **Notifications**: React Toastify
- **Markdown Rendering**: React Markdown with remark-gfm

## 📁 Project Structure

```
client/
├── app/                          # Next.js App Router pages
│   ├── about/                    # About page
│   ├── activity-log/             # Activity logs (Admin only)
│   ├── analyze/                  # PR analysis page
│   ├── context/                  # Repository context (Admin only)
│   ├── forgot-password/          # Password reset flow
│   ├── login/                    # Login with 2FA support
│   ├── pr-analyses/              # PR analyses list with filters
│   ├── profile/                  # User profile management
│   ├── signup/                   # Multi-step signup flow
│   ├── users/                    # User management (Admin only)
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Dashboard home page
│   ├── not-found.tsx             # 404 error page
│   └── globals.css               # Global styles and CSS variables
│
├── components/                   # React components
│   ├── activity-log/             # Activity log components
│   ├── analyze/                  # PR analysis helpers
│   ├── auth/                     # Authentication components
│   │   ├── AuthCard.tsx          # Auth page wrapper
│   │   ├── OtpVerifyForm.tsx     # OTP verification
│   │   └── TwoFAVerifyForm.tsx   # 2FA verification
│   ├── common/                   # Shared components
│   │   ├── Modal.tsx             # Confirmation modal
│   │   ├── OffCanvas.tsx         # Slide-out panel
│   │   ├── LogoutModal.tsx       # Logout confirmation
│   │   └── ToastProvider.tsx     # Toast notifications
│   ├── context/                  # Repository context components
│   ├── dashboard/                # Dashboard components
│   │   ├── DashCard.tsx          # Feature cards
│   │   ├── FAQSection.tsx        # FAQ with tabs
│   │   ├── Footer.tsx            # Footer section
│   │   ├── HowItWorksSection.tsx # How it works
│   │   └── WelcomeBanner.tsx     # Welcome banner
│   ├── pr-analyses/              # PR analyses components
│   │   ├── PRCard.tsx            # PR analysis card
│   │   └── SeverityHelpers.tsx   # Severity badge logic
│   ├── profile/                  # Profile components
│   │   ├── ChangePasswordForm.tsx
│   │   ├── ChangePasswordViaEmail.tsx
│   │   ├── ProfileBanner.tsx
│   │   └── ProfileInfoForm.tsx
│   ├── ui/                       # UI components
│   │   ├── AIBrainLoader.tsx     # Loading animation
│   │   ├── EmptyState.tsx        # Empty state message
│   │   ├── MarkdownRenderer.tsx  # Markdown display
│   │   ├── PageHeader.tsx        # Page title header
│   │   └── Pagination.tsx        # Pagination controls
│   ├── users/                    # User management components
│   │   ├── UserPanels.tsx        # Create/Edit panels
│   │   └── UsersTable.tsx        # Users table
│   ├── AppShell.tsx              # App layout with sidebar
│   ├── ReduxProvider.tsx         # Redux store provider
│   └── Sidebar.tsx               # Collapsible sidebar
│
├── lib/                          # Utility libraries
│   ├── api.ts                    # Client-side API calls
│   ├── axios.ts                  # Axios instance
│   └── serverApi.ts              # Server-side API calls
│
├── store/                        # Redux store
│   ├── slices/
│   │   └── authSlice.ts          # Authentication state
│   └── index.ts                  # Store configuration
│
└── public/                       # Static assets

```

## 🎨 Key Features

### Authentication & Security
- **Multi-step Signup Flow**: Email verification → Profile setup → 2FA setup → Backup codes
- **Two-Factor Authentication (2FA)**: Phone, Authenticator app, and Backup codes
- **Password Reset**: Email-based OTP verification
- **JWT Authentication**: Secure token-based auth with Redux persistence
- **Role-Based Access Control**: Admin and User roles

### Dashboard
- **Welcome Banner**: Personalized greeting with role display
- **Features Section**: Non-clickable feature cards (Analyze PR, PR Analyses, Profile)
- **How It Works**: 4-step platform overview
- **FAQ Section**: 4 tabs (General, GitHub PR, Gemini AI, Security) with 10 questions each
- **Footer**: Links and branding

### PR Analysis
- **Manual Analysis**: Paste GitHub PR URL or code diff
- **AI-Powered Risk Assessment**: Powered by Google Gemini AI
- **Severity Ratings**: Critical, High, Medium, Low
- **Markdown Results**: Formatted analysis with syntax highlighting

### PR Analyses Management
- **Advanced Filtering**:
  - Search by owner, repo, title, severity
  - Type filter (Manual, Webhook, All)
  - Date range (Latest, Oldest, 1d, 1w, 1m, 1y)
- **Pagination**: Customizable items per page (5, 10, 20, 50, 100)
- **Multi-Select Delete**: Checkbox selection with bulk delete
- **Filter Chips**: Visual display of active filters
- **Smart Navigation**: Auto-navigate to previous page when current becomes empty

### User Profile
- **Profile Information**: Update name and email
- **Change Password**: Two methods
  - Direct password change (requires current password)
  - Email-based reset (OTP verification)
- **2FA Management**: Enable/disable 2FA methods

### Admin Features
- **User Management**: Create, edit, delete users
- **Role Toggle**: Switch between Admin and User roles
- **Activity Logs**: View all system activities with method badges
- **Repository Context**: Manage repository context data

### UI/UX Features
- **Collapsible Sidebar**: Toggle button with smooth animations
- **Responsive Design**: Mobile-friendly layouts
- **Dark Mode Ready**: CSS variables for theming
- **Toast Notifications**: Success, error, info messages
- **Loading States**: Skeleton loaders and spinners
- **Empty States**: Helpful messages when no data
- **Modal Dialogs**: Confirmation modals for destructive actions
- **Password Visibility Toggle**: Eye icons for all password fields
- **Form Validation**: Real-time validation with error messages

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Backend server running on `http://localhost:3000`

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Run Development Server

```bash
npm run dev
# or
yarn dev
```

The app will run on `http://localhost:5173`

### Build for Production

```bash
npm run build
npm start
```

## 🔧 Configuration

### Axios Configuration (`lib/axios.ts`)
- Base URL: `http://localhost:3000/api`
- Credentials: Included for cookie-based auth
- Interceptors: Automatic token refresh and error handling

### Redux Store (`store/index.ts`)
- **Persisted State**: Auth state persisted to localStorage
- **Middleware**: Redux Thunk for async actions
- **DevTools**: Enabled in development

### Tailwind CSS (`tailwind.config.js`)
- Custom colors and spacing
- Typography plugin for markdown
- Responsive breakpoints

## 📱 Pages Overview

### Public Pages
- `/login` - Login with 2FA support
- `/signup` - Multi-step registration
- `/forgot-password` - Password reset flow

### Protected Pages
- `/` - Dashboard home
- `/analyze` - Analyze PR
- `/pr-analyses` - View all analyses
- `/profile` - User profile
- `/about` - About page

### Admin Only Pages
- `/users` - User management
- `/activity-log` - Activity logs
- `/context` - Repository context

## 🎯 State Management

### Auth Slice (`store/slices/authSlice.ts`)

**State:**
```typescript
{
  user: User | null,
  status: 'idle' | 'loading' | 'succeeded' | 'failed',
  error: string | null
}
```

**Actions:**
- `loginThunk` - Login with credentials
- `logoutThunk` - Logout and clear state
- `fetchProfile` - Get current user profile

## 🔐 Authentication Flow

### Login Flow
1. User enters email and password
2. If unverified → Email verification (OTP)
3. If 2FA enabled → 2FA verification (Phone/Authenticator/Backup code)
4. Success → Redirect to dashboard

### Signup Flow
1. Enter email → Send OTP
2. Verify email → OTP verification
3. Setup profile → Name and password
4. Setup 2FA (Phone) → Optional
5. Setup 2FA (Authenticator) → Optional
6. Generate backup codes → Download
7. Complete signup → Redirect to dashboard

### Password Reset Flow
1. Enter email → Send OTP
2. Verify OTP → 6-digit code
3. Set new password → Confirm password
4. Success → Redirect to login

## 🎨 Styling Guide

### CSS Variables (`globals.css`)
```css
--bg: #f8f9fb
--surface: #ffffff
--text-primary: #111827
--text-secondary: #6b7280
--accent: #4f46e5
--success: #059669
--danger: #dc2626
--warning: #d97706
```

### Component Styling
- **Inline Styles**: Used for dynamic values and complex layouts
- **CSS Classes**: Used for reusable patterns
- **Tailwind**: Used for utility classes

## 📦 Key Dependencies

```json
{
  "next": "16.1.6",
  "react": "19.2.3",
  "react-redux": "^9.1.2",
  "@reduxjs/toolkit": "^2.2.1",
  "axios": "^1.7.9",
  "react-toastify": "^11.0.5",
  "react-markdown": "^10.1.0",
  "tailwindcss": "^4"
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Docker
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

## 🐛 Troubleshooting

### Common Issues

**Issue**: Axios requests failing
- **Solution**: Check `NEXT_PUBLIC_API_URL` in `.env.local`

**Issue**: Redux state not persisting
- **Solution**: Clear localStorage and refresh

**Issue**: Tailwind classes not working
- **Solution**: Restart dev server after config changes

**Issue**: 2FA not working
- **Solution**: Ensure backend is running and OTP is sent

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
