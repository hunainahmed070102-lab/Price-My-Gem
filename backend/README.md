# PriceMyGem Backend API

Backend API for PriceMyGem - AI-Powered Gemstone Price Evaluation System

## Tech Stack

- Node.js + Express.js
- MySQL Database
- JWT Authentication
- Multer (File Upload)
- Axios (AI Model Communication)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
- Database credentials
- JWT secret key
- AI Model URL

### 3. Initialize Database

Make sure MySQL is running, then:

```bash
npm run init-db
```

This will:
- Create the database
- Create all tables
- Insert default gemstone prices
- Create default admin user

**Default Admin Credentials:**
- Email: `admin@pricemygem.com`
- Password: `admin123`

### 4. Start Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication

**Register**
```
POST /api/auth/register
Body: { "email": "user@example.com", "password": "password123" }
```

**Login**
```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password123" }
```

**Get Profile**
```
GET /api/auth/profile
Headers: { "Authorization": "Bearer <token>" }
```

### Analysis

**Analyze Gemstone**
```
POST /api/analyze
Headers: { "Authorization": "Bearer <token>" }
Body: FormData with "image" field
```

**Get History**
```
GET /api/history
Headers: { "Authorization": "Bearer <token>" }
```

**Get Report by ID**
```
GET /api/report/:id
Headers: { "Authorization": "Bearer <token>" }
```

### Admin (Requires Admin Role)

**Get All Users**
```
GET /api/admin/users
Headers: { "Authorization": "Bearer <admin_token>" }
```

**Get All Reports**
```
GET /api/admin/reports
Headers: { "Authorization": "Bearer <admin_token>" }
```

**Get Statistics**
```
GET /api/admin/statistics
Headers: { "Authorization": "Bearer <admin_token>" }
```

**Get All Prices**
```
GET /api/admin/prices
Headers: { "Authorization": "Bearer <admin_token>" }
```

**Update Price**
```
PUT /api/admin/prices/:id
Headers: { "Authorization": "Bearer <admin_token>" }
Body: { "minPrice": 1000, "maxPrice": 5000 }
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Database connection
│   │   └── initDatabase.js      # Database initialization
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── analysisController.js # Analysis logic
│   │   └── adminController.js   # Admin logic
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Report.js            # Report model
│   │   └── Price.js             # Price model
│   ├── routes/
│   │   ├── authRoutes.js        # Auth routes
│   │   ├── analysisRoutes.js    # Analysis routes
│   │   └── adminRoutes.js       # Admin routes
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── upload.js            # File upload config
│   │   └── errorHandler.js     # Error handling
│   └── server.js                # Main server file
├── uploads/                     # Uploaded images
├── .env.example                 # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Database Schema

### Users Table
- id (INT, PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- role (ENUM: 'user', 'admin')
- created_at (TIMESTAMP)

### Reports Table
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- image_url (VARCHAR)
- gemstone_type (VARCHAR)
- confidence (DECIMAL)
- authenticity (ENUM: 'real', 'synthetic', 'uncertain')
- price_range (VARCHAR)
- created_at (TIMESTAMP)

### Prices Table
- id (INT, PRIMARY KEY)
- gemstone_type (VARCHAR, UNIQUE)
- min_price (DECIMAL)
- max_price (DECIMAL)
- currency (VARCHAR)
- updated_at (TIMESTAMP)

## Error Handling

All errors return JSON in this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- File type validation
- File size limits
- SQL injection prevention (parameterized queries)

## Notes

- Make sure the AI Model service is running on the configured URL
- Default file upload limit is 5MB
- JWT tokens expire after 7 days (configurable)
- All timestamps are in UTC
