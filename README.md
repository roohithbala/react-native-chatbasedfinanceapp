# SecureFinance - Encrypted Chat-Based Finance App

A comprehensive MERN stack finance application with real-time chat, AI-powered insights, and collaborative money management.

## 🚀 Features

### Core Functionality
- **End-to-end encrypted chat** with financial command parsing
- **Intelligent bill splitting** with flexible percentage allocation
- **AI-powered spending predictions** with emotion analysis
- **Collaborative group budget management** with real-time sync
- **Advanced expense tracking** with categorization and analytics
- **Secure authentication** with JWT and optional biometric login

### Chat Commands
- `@split Dinner $120 @alice @bob` - Split bills among tagged users
- `@addexpense Coffee $5` - Add personal expenses
- `@setbudget Food $500` - Set category budgets
- `@predict` - Get AI spending predictions
- `@summary` - View expense summaries

## 🛠 Technology Stack

### Frontend (React Native + Expo)
- **React Native** with Expo Go for cross-platform mobile development
- **Expo Router** for navigation
- **Zustand** for state management
- **Socket.io Client** for real-time communication
- **React Native Gifted Chat** for chat interface
- **Axios** for API communication

### Backend (Node.js + Express)
- **Express.js** REST API server
- **MongoDB Atlas** cloud database
- **Socket.io** for real-time messaging
- **JWT** authentication
- **Mongoose** ODM for MongoDB
- **Helmet** for security headers
- **Rate limiting** for API protection

## 📱 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Expo CLI installed globally: `npm install -g @expo/cli`

### Backend Setup

1. **Configure MongoDB Atlas:**
   - Create a MongoDB Atlas account at https://cloud.mongodb.com
   - Create a new cluster
   - Get your connection string
   - Update `.env` file with your MongoDB URI

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Update .env file with your values
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/securefinance
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3001
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Expo development server:**
   ```bash
   npm run dev
   ```

3. **Open in Expo Go:**
   - Install Expo Go app on your mobile device
   - Scan the QR code displayed in terminal
   - Or press 'w' to open in web browser

## 🏗 Project Structure

```
├── app/                          # React Native frontend
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx            # Chat screen
│   │   ├── expenses.tsx         # Expenses management
│   │   ├── budget.tsx           # Budget tracking
│   │   ├── insights.tsx         # AI insights & analytics
│   │   └── profile.tsx          # User profile & settings
│   ├── components/              # Reusable components
│   │   └── AuthScreen.tsx       # Authentication screen
│   ├── services/                # API and socket services
│   │   ├── api.ts              # REST API client
│   │   └── socketService.ts    # Socket.io client
│   └── store/                   # State management
│       └── financeStore.ts      # Zustand store
├── backend/                     # Node.js backend
│   ├── models/                  # MongoDB schemas
│   │   ├── User.js             # User model
│   │   ├── Expense.js          # Expense model
│   │   ├── SplitBill.js        # Split bill model
│   │   ├── Group.js            # Group model
│   │   ├── Message.js          # Chat message model
│   │   └── Budget.js           # Budget model
│   ├── routes/                  # API routes
│   │   ├── auth.js             # Authentication routes
│   │   ├── expenses.js         # Expense management
│   │   ├── groups.js           # Group management
│   │   ├── chat.js             # Chat functionality
│   │   ├── ai.js               # AI insights & predictions
│   │   ├── budgets.js          # Budget management
│   │   └── users.js            # User management
│   ├── middleware/              # Express middleware
│   │   └── auth.js             # JWT authentication
│   └── server.js               # Main server file
└── .env                        # Environment variables
```

## 🔐 Security Features

- **End-to-end encryption** for all financial data
- **JWT authentication** with secure token management
- **Rate limiting** to prevent API abuse
- **Input validation** and sanitization
- **CORS protection** for cross-origin requests
- **Helmet.js** for security headers
- **Password hashing** with bcrypt

## 🤖 AI Features

### Spending Predictions
- Analyzes historical spending patterns
- Predicts budget overages before they happen
- Provides personalized saving suggestions
- Tracks spending trends and anomalies

### Emotional Analysis
- Detects emotional spending patterns
- Identifies stress-induced purchases
- Provides mindful spending recommendations
- Tracks spending behavior changes

### Smart Insights
- Category-based spending analysis
- Weekly and monthly trend reports
- Collaborative group spending insights
- Automated budget optimization suggestions

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - User logout

### Expenses
- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Add new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/stats` - Get spending statistics

### Groups
- `GET /api/groups` - Get user groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/members` - Add group member
- `POST /api/groups/:id/split` - Split bill in group

### Chat
- `GET /api/chat/:groupId/messages` - Get group messages
- `POST /api/chat/:groupId/messages` - Send message
- `PUT /api/chat/:groupId/messages/read` - Mark as read

### AI & Insights
- `GET /api/ai/predict` - Get spending predictions
- `GET /api/ai/emotions` - Get emotional analysis
- `GET /api/ai/summary/:period` - Get spending summary

## 🚀 Deployment

### Backend Deployment
1. Deploy to services like Railway, Render, or Heroku
2. Set environment variables in production
3. Update CORS settings for production domain

### Frontend Deployment
1. Build for production: `expo build`
2. Deploy to app stores or use Expo's hosting
3. Update API URLs for production

## 🔧 Development

### Running in Development
1. Start backend: `npm run server:dev`
2. Start frontend: `npm run dev`
3. Open Expo Go app and scan QR code

### Testing
- Backend API can be tested with Postman or similar tools
- Frontend can be tested in Expo Go or web browser
- Socket.io connections can be tested with socket.io client tools

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/securefinance

# JWT Secret (use a strong, random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:8081
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## SecureFinance App

## Setup Instructions

1. **MongoDB Connection**: Ensure the `.env` file contains the correct `MONGODB_URI`.
2. **Logout Endpoint**: Use the `/logout` endpoint to terminate user sessions.

## Environment Variables

- `MONGODB_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: Secret key for JWT authentication.
- `PORT`: Server port (default: 5000).
- `FRONTEND_URL`: URL for CORS configuration.