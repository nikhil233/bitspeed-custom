# Bitespeed Identity Reconciliation Service

A Node.js TypeScript service that implements identity reconciliation for Bitespeed's backend task. This service helps identify and link customer contacts across multiple purchases using email and phone number matching.

## 🚀 Features

- **Identity Reconciliation**: Automatically links customer contacts based on email and phone number matches
- **Primary/Secondary Contact Management**: Maintains a hierarchy of contacts with the oldest contact as primary
- **Contact Merging**: Intelligently merges multiple contact groups when new connections are discovered
- **RESTful API**: Clean, well-documented API endpoints
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Database Integration**: Direct MySQL connection using mysql2 for data persistence

## 📋 Requirements

- Node.js 18+ 
- npm or yarn
- MySQL 8.0+

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bitspeed-custom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MySQL database**
   ```sql
   CREATE DATABASE bitespeed_db;
   CREATE USER 'bitespeed_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON bitespeed_db.* TO 'bitespeed_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your MySQL credentials:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=bitespeed_user
   DB_PASSWORD=your_password
   DB_NAME=bitespeed_db
   DB_PORT=3306

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The service will automatically create the required database tables on startup.

The service will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── routes/          # Express route definitions
├── types/           # TypeScript type definitions
├── validation/      # Request validation schemas
├── database/        # Database connection and utilities
└── index.ts         # Application entry point
```

## 📡 API Endpoints

### POST /identify

Identifies and reconciles contact information based on email and phone number.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["user@example.com", "user2@example.com"],
    "phoneNumbers": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Example Requests:**

1. **New Contact Creation:**
   ```bash
   curl -X POST http://localhost:3000/identify \
     -H "Content-Type: application/json" \
     -d '{"email": "doc@hillvalley.edu", "phoneNumber": "123456"}'
   ```

2. **Existing Contact Match:**
   ```bash
   curl -X POST http://localhost:3000/identify \
     -H "Content-Type: application/json" \
     -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'
   ```

3. **Contact Group Merging:**
   ```bash
   curl -X POST http://localhost:3000/identify \
     -H "Content-Type: application/json" \
     -d '{"email": "george@hillvalley.edu", "phoneNumber": "717171"}'
   ```

### GET /health

Health check endpoint to verify service status.

**Response:**
```json
{
  "status": "OK",
  "message": "Identity reconciliation service is running",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

## 🔧 Database Schema

The service automatically creates a `contacts` table with the following structure:

```sql
CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phoneNumber VARCHAR(255),
  email VARCHAR(255),
  linkedId INT,
  linkPrecedence ENUM('primary', 'secondary') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_phone (phoneNumber),
  INDEX idx_linked_id (linkedId),
  INDEX idx_precedence (linkPrecedence)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 🧪 Testing

### Manual Testing

You can test the service using the provided examples in the API documentation above.

### Example Test Scenarios

1. **Scenario 1: New Customer**
   - Request: `{"email": "new@example.com", "phoneNumber": "111111"}`
   - Expected: Creates new primary contact

2. **Scenario 2: Existing Customer (Email Match)**
   - Request: `{"email": "existing@example.com", "phoneNumber": "222222"}`
   - Expected: Links to existing contact or creates secondary

3. **Scenario 3: Contact Group Merging**
   - Request: `{"email": "merge@example.com", "phoneNumber": "333333"}`
   - Expected: Merges multiple contact groups

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables

- `DB_HOST`: MySQL host (default: localhost)
- `DB_USER`: MySQL username (default: root)
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: MySQL database name (default: bitespeed_db)
- `DB_PORT`: MySQL port (default: 3306)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## 📝 Implementation Details

### Identity Reconciliation Logic

1. **Contact Matching**: Searches for existing contacts with matching email or phone
2. **Group Formation**: Groups related contacts by their primary contact
3. **Secondary Creation**: Creates secondary contacts for new information
4. **Group Merging**: Merges multiple groups when new connections are discovered
5. **Primary Selection**: Always selects the oldest contact as primary

### Key Features

- **Direct MySQL Connection**: Uses mysql2 for efficient database operations
- **Connection Pooling**: Optimized database connection management
- **Fuzzy Matching**: Exact email and phone number matching
- **Hierarchical Linking**: Primary/secondary contact relationship
- **Data Integrity**: Preserves all contact information during merges
- **Audit Trail**: Tracks creation and update timestamps

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Live Demo**: [Your deployed URL here]
- **API Documentation**: [Your API docs URL here]
- **Repository**: [Your GitHub repo URL here] 