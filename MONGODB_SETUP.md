# MongoDB Setup and Testing Guide

## Prerequisites

1. **MongoDB installed on Ubuntu WSL**
2. **Node.js and npm installed**
3. **Project dependencies installed** (`npm install`)

## Quick Start

### 1. Start MongoDB Service
```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot (optional)
sudo systemctl enable mongod

# Check MongoDB status
sudo systemctl status mongod
```

### 2. Environment Configuration
Make sure your `.env.local` file exists with the correct MongoDB URI:
```bash
cp .env.example .env.local
```

Update `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/3mages
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### 3. Test MongoDB Connection
```bash
npm run db:test
```

### 4. Seed Database with Dummy Data
```bash
npm run db:seed
```

### 5. Test Login System
```bash
# Test all users
npm run test:login

# Test specific user
npm run test:login admin@3mages.org admin123456
```

### 6. Start the Application
```bash
npm run dev
```

Visit `http://localhost:3000` and navigate to `/auth/login` to test the login system.

## Test User Credentials

After seeding, you can use these credentials to test the login system:

### Admin User
- **Email**: `admin@3mages.org`
- **Password**: `admin123456`
- **Role**: Admin
- **Temple Level**: Master

### Test Members
- **Email**: `member1@3mages.org`
  - **Password**: `password123`
  - **Name**: Marie Dubois
  - **Temple Level**: Apprentice

- **Email**: `member2@3mages.org`
  - **Password**: `password123`
  - **Name**: Jean Martin
  - **Temple Level**: Journeyman

- **Email**: `initiate@3mages.org`
  - **Password**: `password123`
  - **Name**: Sophie Mercier
  - **Temple Level**: Initiate

- **Email**: `craftsman@3mages.org`
  - **Password**: `password123`
  - **Name**: Pierre Rousseau
  - **Temple Level**: Craftsman

- **Email**: `inactive@3mages.org`
  - **Password**: `password123`
  - **Name**: Paul Inactive
  - **Status**: Inactive

## Manual MongoDB Commands

### Connect to MongoDB Shell
```bash
mongosh mongodb://localhost:27017/3mages
```

### Useful MongoDB Queries
```javascript
// Show all collections
show collections

// Count users
db.users.countDocuments()

// Find all users
db.users.find({}, { password: 0 }).pretty()

// Find admin users
db.users.find({ role: "ADMIN" }, { password: 0 }).pretty()

// Find active members
db.users.find({ isActive: true, role: "MEMBER" }, { password: 0 }).pretty()

// Drop all users (reset database)
db.users.deleteMany({})
```

## Troubleshooting

### MongoDB Not Starting
```bash
# Check MongoDB logs
sudo journalctl -u mongod

# Check if MongoDB is running
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

### Connection Issues
1. Verify MongoDB is running: `sudo systemctl status mongod`
2. Check the port: `sudo netstat -tlnp | grep 27017`
3. Verify .env.local configuration
4. Check firewall settings if needed

### Authentication Issues
1. Run `npm run test:login` to verify user credentials
2. Check if users exist in database: `npm run db:test`
3. Re-seed database if needed: `npm run db:seed`

## Database Schema

The User model includes:
- **Authentication**: email, password (hashed with bcrypt)
- **Personal Info**: firstName, lastName, bio, phoneNumber, address
- **Spiritual Progress**: templeLevel, purificationProgram
- **System**: role, isActive, joinedAt, createdAt, updatedAt

## Security Notes

- Passwords are hashed using bcrypt with salt rounds of 12
- Admin password should be changed in production
- Use strong secrets for NEXTAUTH_SECRET in production
- Consider implementing rate limiting for login attempts