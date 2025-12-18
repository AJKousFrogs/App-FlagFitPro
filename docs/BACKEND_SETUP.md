# Backend API Setup Guide

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready

---

## Overview

This guide will help you set up the Express.js backend API that connects to your Neon PostgreSQL database for authentication.

### Prerequisites Checklist

- [ ] Neon PostgreSQL database connection string
- [ ] Node.js version 18 or higher installed
- [ ] npm package manager installed
- [ ] Environment variables configured

## Prerequisites

1. **Neon PostgreSQL Database**: You need a Neon database connection string
2. **Node.js**: Version 18 or higher
3. **npm**: For package management

## Setup Steps

### 1. Install Dependencies

The required dependencies have already been installed:

```bash
npm install express cors bcryptjs jsonwebtoken pg
```

### 2. Configure Environment Variables

Create or update your `.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://your-neon-connection-string-here

# JWT Configuration (change in production)
JWT_SECRET=your-secret-key-change-in-production

# API Configuration
VITE_API_BASE_URL=http://localhost:3001
```

### 3. Get Your Neon Database Connection String

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to "Connection Details"
4. Copy the connection string
5. Replace `your-neon-connection-string-here` in your `.env` file

### 4. Start the Backend Server

```bash
# Start only the backend server
npm run server

# Or start both frontend and backend together
npm run dev:full
```

### 5. Test the API

The server will start on `http://localhost:3001`. You can test it with:

```bash
# Health check
curl http://localhost:3001/api/health

# Should return: {"message":"API is healthy","code":200,"data":{}}
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/register` | Register a new user |
| POST   | `/api/auth/login`    | Login user          |
| GET    | `/api/auth/me`       | Get current user    |
| POST   | `/api/auth/logout`   | Logout user         |

### Health Check

| Method | Endpoint      | Description      |
| ------ | ------------- | ---------------- |
| GET    | `/api/health` | API health check |

## Database Schema

The API will automatically create a `users` table with the following structure:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

1. **Password Hashing**: Uses bcryptjs with salt rounds
2. **JWT Authentication**: Secure token-based authentication
3. **CORS Protection**: Configured for your frontend domains
4. **Input Validation**: Server-side validation for all inputs

## Development Workflow

### Start Development Environment

```bash
# Start both frontend and backend
npm run dev:full
```

This will start:

- Frontend: `http://localhost:3000` (or 5173)
- Backend: `http://localhost:3001`

### Testing Authentication

1. **Register a new user**:
   - Go to `/register` in your app
   - Fill out the form
   - Should create a user in your Neon database

2. **Login with the user**:
   - Go to `/login` in your app
   - Use the credentials you just created
   - Should authenticate and redirect to dashboard

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check your `DATABASE_URL` in `.env`
   - Ensure your Neon database is active
   - Verify the connection string format

2. **CORS Errors**:
   - The backend is configured for `localhost:3000` and `localhost:5173`
   - If using a different port, update the CORS configuration in `server.js`

3. **Port Already in Use**:
   - Change the port in `server.js` or kill the process using port 3001

### Debug Mode

To enable debug logging, add to your `.env`:

```env
NODE_ENV=development
```

## Production Deployment

For production deployment:

1. **Environment Variables**:

   ```env
   NODE_ENV=production
   DATABASE_URL=your-production-neon-connection-string
   JWT_SECRET=your-secure-production-secret
   PORT=3001
   ```

2. **Security**:
   - Change the JWT secret
   - Use HTTPS
   - Configure proper CORS origins
   - Set up rate limiting

3. **Database**:
   - Use a production Neon database
   - Enable SSL connections
   - Set up proper backups

## 🔗 **Related Documentation**

- [Authentication Pattern](AUTHENTICATION_PATTERN.md) - Authentication architecture
- [Database Setup](DATABASE_SETUP.md) - Database configuration
- [Architecture](ARCHITECTURE.md) - System architecture overview
- [Error Handling Guide](ERROR_HANDLING_GUIDE.md) - Error handling patterns
- [API Documentation](API_DOCUMENTATION.md) - Complete API reference

## 📝 **Changelog**

- **v1.0 (2025-01)**: Initial backend setup guide
- Express.js backend documented
- Neon PostgreSQL integration guide added
- Security features documented

## Next Steps

1. **Test the authentication flow**
2. **Add more API endpoints** as needed
3. **Implement additional security measures**
4. **Set up monitoring and logging**
5. **Deploy to production**

Your authentication system is now ready to use with your Neon PostgreSQL database!
