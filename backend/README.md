# GreatHire Teamora — Backend API

Node.js + Express + MongoDB backend API for the **GreatHire Teamora** Human Resource Management System.

The backend provides APIs for:

* Authentication and authorization
* Employee management
* Employee dashboard
* Employee profiles
* Attendance management
* Leave management
* Reports and analytics
* Notifications
* Messages
* MongoDB data persistence
* JWT-based authentication
* Optional Google and Microsoft OAuth
* Swagger/OpenAPI API documentation

The backend uses **MongoDB with Mongoose** for persistent data storage. The application can connect to a local MongoDB instance during development or **MongoDB Atlas** for production deployment.

---

# 1. Technology Stack

| Technology         | Purpose                   |
| ------------------ | ------------------------- |
| Node.js            | JavaScript runtime        |
| Express.js         | REST API framework        |
| MongoDB            | Database                  |
| MongoDB Atlas      | Cloud/production database |
| Mongoose           | MongoDB ODM               |
| JWT                | Authentication            |
| bcryptjs           | Password hashing          |
| Passport.js        | OAuth authentication      |
| Zod                | Request validation        |
| Helmet             | Security headers          |
| CORS               | Cross-origin requests     |
| Express Rate Limit | API rate limiting         |
| Pino               | Logging                   |
| Swagger/OpenAPI    | API documentation         |

---

# 2. System Architecture

The production architecture is:

```text
                    INTERNET
                       |
                       v
             +-------------------+
             |   React Frontend  |
             |  Vercel / Netlify |
             +---------+---------+
                       |
                       | HTTPS REST API
                       v
             +-------------------+
             | Node.js + Express |
             | Backend API       |
             | Vercel Serverless |
             +---------+---------+
                       |
                       | MongoDB URI
                       v
             +-------------------+
             |   MongoDB Atlas   |
             |   Cloud Database  |
             +-------------------+
```

All users of the application communicate with the same backend API and therefore use the same MongoDB Atlas database.

---

# 3. Project Structure

```text
backend/
│
├── server.js
├── package.json
├── package-lock.json
├── .env
├── .env.example
├── .gitignore
├── openapi.yaml
│
└── src/
    │
    ├── app.js
    │
    ├── config/
    │   ├── db.js
    │   ├── logger.js
    │   ├── passport.js
    │   ├── rateLimiters.js
    │   └── validateEnv.js
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── attendanceController.js
    │   ├── dashboardController.js
    │   ├── employeeDashboardController.js
    │   ├── employeeProfileController.js
    │   ├── leaveController.js
    │   ├── messageController.js
    │   ├── notificationController.js
    │   └── reportController.js
    │
    ├── data/
    │   └── Supporting application data
    │
    ├── db/
    │   ├── loadAll.js
    │   ├── schemas.js
    │   └── seed.js
    │
    ├── middleware/
    │   ├── asyncHandler.js
    │   ├── auth.js
    │   ├── errorHandler.js
    │   └── validate.js
    │
    ├── models/
    │   ├── Attendance.js
    │   ├── Dashboard.js
    │   ├── Employee.js
    │   ├── EmployeeDashboard.js
    │   ├── EmployeeProfile.js
    │   ├── LeaveRequest.js
    │   ├── Message.js
    │   ├── Notification.js
    │   └── Report.js
    │
    ├── routes/
    │   ├── authRoutes.js
    │   ├── attendanceRoutes.js
    │   ├── dashboardRoutes.js
    │   ├── employeeDashboardRoutes.js
    │   ├── employeeProfileRoutes.js
    │   ├── leaveRoutes.js
    │   ├── messageRoutes.js
    │   ├── notificationRoutes.js
    │   └── reportRoutes.js
    │
    └── utils/
        ├── dates.js
        ├── id.js
        ├── jwt.js
        └── paginate.js
```

---

# 4. Requirements

Before running the backend, install:

* Node.js 18+
* npm
* MongoDB Community Server for local development, OR
* MongoDB Atlas for cloud deployment

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

---

# 5. Installation

Clone the repository:

```bash
git clone <your-github-repository-url>
```

Go to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

---

# 6. Environment Variables

Create a `.env` file inside the backend directory.

```text
backend/
├── .env
├── .env.example
└── ...
```

Example:

```env
PORT=5000

CLIENT_ORIGIN=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/greathire
MONGODB_DB_NAME=greathire

# Shared conversation file storage (S3-compatible)
S3_BUCKET=
S3_REGION=
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=1d
JWT_REMEMBER_ME_EXPIRES_IN=30d

JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_REMEMBER_ME_EXPIRES_IN=30d

SEED_USER_PASSWORD=change-this-password

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/oauth/google/callback

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/oauth/microsoft/callback

# Gmail SMTP for forgot-password emails (not the same as Google login OAuth)
GMAIL_USER=
GMAIL_APP_PASSWORD=
GMAIL_FROM_EMAIL=
```

---

## Shared conversation files

The **Add files** control in a conversation's Shared Files panel uploads directly
to private S3-compatible object storage; uploaded files do not create chat
messages. Configure the five `S3_*` variables above on the backend. For AWS S3,
leave `S3_ENDPOINT` blank and use the bucket region. For Cloudflare R2, use the
bucket's S3 API endpoint and set `S3_REGION=auto`.

Configure the bucket CORS policy to allow `PUT`, `GET`, and `HEAD` from each
frontend origin. For example:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://greathire-teamora-deployment.vercel.app",
      "https://greathire-teamora-deployment-lz1a5d542.vercel.app"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

The storage credentials should have only the required object-level permissions
(`PutObject`, `GetObject`, and `DeleteObject`) for the shared-files prefix.
`GetObject` also authorizes the `HeadObject` verification request. The UI permits
general files up to 2 GB and videos up to 16 MB and 90
seconds. Video duration is checked by the browser before upload; image/video
compression and a status-video feature are not part of this implementation.
Uploads use short-lived signed URLs, and the backend checks stored size and
content type before listing a file as shared. Download links expire after 15
minutes.

# 7. Local MongoDB

For local development, MongoDB can run on:

```text
mongodb://127.0.0.1:27017/greathire
```

Set:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/greathire
```

For production, set `CLIENT_ORIGIN` in the backend hosting environment to the
exact frontend origin(s), including `https://` and separated by commas if more
than one frontend should be allowed. The first origin is used for OAuth
redirects and password-reset links. After changing it in Vercel, redeploy the
backend so the new CORS allowlist takes effect.

The backend connects using:

```javascript
mongoose.connect(process.env.MONGODB_URI)
```

---

# 8. MongoDB Atlas — Production Database

For production, MongoDB Atlas is recommended.

Create a cluster in:

https://www.mongodb.com/atlas

Then:

1. Create an Atlas project.
2. Create a MongoDB cluster.
3. Create a database user.
4. Configure Network Access.
5. Copy the MongoDB connection string.
6. Add the connection string to the production environment variables.

Example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/greathire?retryWrites=true&w=majority
```

Replace:

```text
USERNAME
PASSWORD
CLUSTER
```

with your actual Atlas credentials.

Do not commit the real connection string to GitHub.

---

# 9. MongoDB Database Flow

When the server starts:

```text
server.js
   |
   v
validateEnv()
   |
   v
connectDB()
   |
   v
MongoDB / MongoDB Atlas
   |
   v
seedDatabaseIfEmpty()
   |
   v
loadAllData()
   |
   v
Express API starts
```

The database connection is implemented in:

```text
src/config/db.js
```

Database schemas are maintained in:

```text
src/db/schemas.js
```

Initial database seeding is handled by:

```text
src/db/seed.js
```

Data loading is handled by:

```text
src/db/loadAll.js
```

---

# 10. Running the Backend

Development mode:

```bash
npm run dev
```

Production/start mode:

```bash
npm start
```

The default local server is:

```text
http://localhost:5000
```

---

# 11. Health Check

After starting the backend, test:

```text
GET /api/health
```

Example:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "GreatHire Teamora API is running"
}
```

For a deployed backend:

```text
https://your-backend-domain.com/api/health
```

---

# 12. Authentication

The application uses JWT authentication.

## Register

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

## Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

The response contains a JWT token.

Example:

```json
{
  "success": true,
  "data": {
    "user": {},
    "token": "JWT_TOKEN"
  }
}
```

Use the token in authenticated requests:

```http
Authorization: Bearer JWT_TOKEN
```

## Current User

```http
GET /api/auth/me
```

Requires:

```http
Authorization: Bearer JWT_TOKEN
```

---

# 13. API Modules

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

Optional OAuth:

```text
GET /api/auth/oauth/google
GET /api/auth/oauth/microsoft
```

---

## Dashboard

```text
GET /api/dashboard
GET /api/dashboard/overview
GET /api/dashboard/snapshot
GET /api/dashboard/metrics
GET /api/dashboard/live-workforce
GET /api/dashboard/activity
```

Dashboard provides:

* Total employees
* Working employees
* Employees on break
* Employees on leave
* Attendance percentage
* Recent activity
* Workforce information

---

# 14. Employee Dashboard

```text
GET /api/employee/dashboard
GET /api/employee/current-user
GET /api/employee/status
GET /api/employee/quick-actions
GET /api/employee/hours-stats
GET /api/employee/attendance-legend
GET /api/employee/attendance-month
GET /api/employee/timeline
GET /api/employee/leave-balances
GET /api/employee/upcoming-holidays
GET /api/employee/quick-links
GET /api/employee/attendance-summary
GET /api/employee/announcement
```

Employee dashboard provides:

* Current work status
* Check-in/check-out information
* Working hours
* Attendance calendar
* Leave balance
* Upcoming holidays
* Attendance summary
* Company announcements

---

# 15. Employee Profile

```text
GET /api/employees/:id/profile
GET /api/employees/:id/profile/bundle
GET /api/employees/:id/profile/stat-cards
GET /api/employees/:id/profile/work-summary
GET /api/employees/:id/profile/activity-map
GET /api/employees/:id/profile/personal-info
PUT /api/employees/:id/profile/personal-info
GET /api/employees/:id/profile/documents
```

The profile module provides:

* Employee information
* Department
* Designation
* Joining date
* Contact information
* Attendance statistics
* Working hours
* Performance information
* Documents

---

# 16. Attendance Management

```text
GET   /api/attendance/stats
GET   /api/attendance/live
GET   /api/attendance/summary
GET   /api/attendance/departments
GET   /api/attendance
GET   /api/attendance/export
POST  /api/attendance/check-in
POST  /api/attendance/check-out
PATCH /api/attendance/:id
```

Features include:

* Employee check-in
* Employee check-out
* Attendance tracking
* Late tracking
* Live workforce status
* Department filtering
* Attendance export
* Attendance corrections

---

# 17. Leave Management

```text
GET   /api/leave/stats
GET   /api/leave/team-availability
GET   /api/leave/types
GET   /api/leave/requests
GET   /api/leave/requests/:id
POST  /api/leave/requests
POST  /api/leave/requests/approve-all
PATCH /api/leave/requests/:id/approve
PATCH /api/leave/requests/:id/reject
GET   /api/leave/export
```

Features include:

* Leave requests
* Leave approval
* Leave rejection
* Leave balances
* Team availability
* Leave statistics
* Leave export

---

# 18. Reports & Analytics

```text
GET  /api/reports/stats
GET  /api/reports/attendance-trends
GET  /api/reports/working-hours
GET  /api/reports/departments
POST /api/reports/generate
GET  /api/reports
```

Supported report ranges:

```text
7d
30d
12m
```

Reports include:

* Attendance trends
* Working hours
* Department statistics
* Employee statistics
* Generated report snapshots

---

# 19. Notifications

```text
GET /api/notifications
GET /api/notifications/summary
GET /api/notifications/preferences
```

Notification filters:

```text
all
unread
attendance
leave
system
```

---

# 20. Messages

The messaging module supports:

* Channels
* Direct messages
* Message history
* Sending messages
* Conversation data

API routes are available under:

```text
/api/messages
```

See:

```text
src/routes/messageRoutes.js
```

for the complete route definition.

---

# 21. Database Seeding

The application can initialize the database with demo data.

The startup sequence calls:

```javascript
await seedDatabaseIfEmpty();
await loadAllData();
```

The seed logic is located at:

```text
src/db/seed.js
```

For the first production deployment, demo data can be seeded.

After confirming the production database is correctly initialized, disable unnecessary demo seeding according to your deployment configuration.

---

# 22. CORS Configuration

The backend uses CORS to control which frontend can communicate with the API.

Local development:

```env
CLIENT_ORIGIN=http://localhost:5173
```

Production:

```env
CLIENT_ORIGIN=https://your-frontend-domain.com
```

Example:

```env
CLIENT_ORIGIN=https://greathire-teamora.vercel.app
```

After changing production environment variables, redeploy/restart the backend.

---

# 23. Production Deployment

The recommended production architecture is:

```text
React Application
       |
       | HTTPS
       v
Vercel / Netlify
       |
       | API Requests
       v
Node.js + Express
       |
       | MongoDB URI
       v
MongoDB Atlas
```

The backend can be deployed on platforms such as:

* Vercel (Serverless Functions)
* Railway / AWS / Azure / Google Cloud

---

# 24. Vercel Deployment

For deploying the backend to Vercel:

### Root Directory

```text
backend
```

### Serverless Handler

The backend includes `backend/api/index.js` and `backend/vercel.json` pre-configured to run the Express API on Vercel.

Add the required environment variables in the Vercel dashboard.

Example:

```env
NODE_ENV=production

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/greathire?retryWrites=true&w=majority

CLIENT_ORIGIN=https://your-frontend-project.vercel.app

JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=1d
JWT_REMEMBER_ME_EXPIRES_IN=30d

JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_REMEMBER_ME_EXPIRES_IN=30d

SEED_USER_PASSWORD=YOUR_SECURE_PASSWORD
```

Do not commit these production values to GitHub.

---

# 25. Frontend Configuration

The React frontend uses the deployed backend URL instead of localhost.

Local development:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Production on Vercel:

```env
VITE_API_BASE_URL=https://your-backend-project.vercel.app/api
```

After changing the environment variable, rebuild/redeploy the frontend.

---

# 26. Production Data Flow

When User A creates a leave request:

```text
User A
   |
   v
React Frontend
   |
   v
Production Backend
   |
   v
MongoDB Atlas
   |
   v
Leave Request Stored
```

When User B opens the leave management page:

```text
User B
   |
   v
React Frontend
   |
   v
Same Production Backend
   |
   v
Same MongoDB Atlas
   |
   v
User B sees updated data
```

Therefore, all users work with the same centralized database.

---

# 27. Security

Never commit:

```text
.env
```

to GitHub.

Production secrets must be stored in the hosting platform's environment-variable settings.

Important secrets include:

```text
MONGODB_URI
JWT_SECRET
SEED_USER_PASSWORD
GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_SECRET
```

Use strong, randomly generated secrets in production.

MongoDB Atlas Network Access should also be configured appropriately for the production backend.

---

# 28. .gitignore

The backend `.gitignore` should include:

```gitignore
node_modules/
.env
.env.*
!.env.example
npm-debug.log*
```

The real `.env` file should remain local or be configured through the deployment platform.

---

# 29. API Documentation

The project contains an OpenAPI specification:

```text
openapi.yaml
```

Swagger/OpenAPI can be used to inspect and test the API endpoints.

The API documentation is exposed by the backend according to the configuration in:

```text
src/app.js
```

---

# 30. Error Handling

The backend uses centralized error handling.

Main middleware:

```text
src/middleware/errorHandler.js
```

API errors follow the general structure:

```json
{
  "success": false,
  "error": "Error message"
}
```

Successful responses generally follow:

```json
{
  "success": true,
  "data": {}
}
```

---

# 31. Validation

Request validation is handled using Zod.

Validation middleware:

```text
src/middleware/validate.js
```

This helps prevent invalid request data from reaching the controllers.

---

# 32. Authentication Middleware

Authentication functionality is implemented in:

```text
src/middleware/auth.js
```

Available middleware includes functionality for:

```text
attachUser
requireAuth
requireRole
```

These can be used to protect routes and enforce role-based access.

---

# 33. Logging

The backend uses Pino for logging.

Configuration:

```text
src/config/logger.js
```

Logs are useful for:

* MongoDB connection status
* Server startup
* API errors
* Runtime problems
* Production debugging

---

# 34. Rate Limiting and Security

The backend uses:

* Helmet
* CORS
* Express Rate Limit
* JWT
* bcryptjs
* Zod validation

These provide a baseline security layer for the API.

---

# 35. Development Workflow

Recommended development flow:

```text
1. Start MongoDB
        |
        v
2. Configure .env
        |
        v
3. npm install
        |
        v
4. npm run dev
        |
        v
5. Start React frontend
        |
        v
6. Test API
        |
        v
7. Test authentication
        |
        v
8. Test dashboard/modules
```

---

# 36. Production Workflow

```text
MongoDB Atlas
      |
      v
Deploy Backend
      |
      v
Configure Production Environment Variables
      |
      v
Test Backend Health
      |
      v
Deploy React Frontend
      |
      v
Configure VITE_API_URL
      |
      v
Configure CLIENT_ORIGIN
      |
      v
Test Authentication
      |
      v
Test All Modules
```

---

# 37. Troubleshooting

## MongoDB connection error

Check:

```env
MONGODB_URI=...
```

Make sure:

* MongoDB is running locally, or Atlas is available.
* Username is correct.
* Password is correct.
* Atlas Network Access allows the backend.
* Cluster URL is correct.
* Special characters in the password are properly URL encoded.

---

## CORS error

Check:

```env
CLIENT_ORIGIN=https://your-frontend-domain.com
```

Make sure the URL exactly matches the deployed frontend origin.

---

## JWT authentication error

Check:

```env
JWT_SECRET=...
```

Make sure the frontend sends:

```http
Authorization: Bearer YOUR_TOKEN
```

---

## Backend works locally but not after deployment

Check:

1. Production environment variables.
2. MongoDB Atlas Network Access.
3. Backend deployment logs.
4. `MONGODB_URI`.
5. `CLIENT_ORIGIN`.
6. Frontend `VITE_API_URL`.
7. Backend health endpoint.

---

# 38. Useful Commands

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Run production server:

```bash
npm start
```

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

---

# 39. Environment Summary

## Local

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/greathire
```

Frontend:

```env
VITE_API_URL=http://localhost:5000
```

## Production

```env
PORT=<provided-by-hosting-platform>

CLIENT_ORIGIN=https://your-frontend-domain.com

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/greathire?retryWrites=true&w=majority

JWT_SECRET=<strong-production-secret>
```

Frontend:

```env
VITE_API_URL=https://your-backend-domain.com
```

---

# 40. Final Production Architecture

```text
                         USERS
                           |
              +------------+------------+
              |            |            |
              v            v            v
           User 1       User 2       User 3
              \            |            /
               \           |           /
                +----------+----------+
                           |
                           v
                +---------------------+
                |   React Frontend    |
                |  Vercel / Netlify   |
                +----------+----------+
                           |
                           | HTTPS
                           v
                +---------------------+
                | Node.js + Express   |
                |    Backend API      |
                +----------+----------+
                           |
                           | Mongoose
                           v
                +---------------------+
                |    MongoDB Atlas    |
                |  Central Database    |
                +---------------------+
                           |
                           v
                 Persistent Application
                       Data
```

All users access the same backend and the same MongoDB Atlas database.

---

# 41. Project Status

GreatHire Teamora backend currently provides the foundation for a production-ready HRMS application with:

* REST API architecture
* MongoDB/Mongoose persistence
* JWT authentication
* Employee management
* Attendance management
* Leave management
* Employee dashboard
* Employee profiles
* Reports and analytics
* Notifications
* Messaging
* Validation
* Error handling
* Security middleware
* API documentation
* Cloud database deployment support

The next production steps are:

```text
MongoDB Atlas
      ↓
Backend Deployment
      ↓
Frontend Deployment
      ↓
CORS Configuration
      ↓
Production Testing
      ↓
Security Hardening
      ↓
Live HRMS Application
```

---

# 42. License

This project is intended for educational, portfolio, and application-development purposes.
