import mysql from 'mysql2/promise';

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: mysql.Pool;

  private constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bitespeed_db',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPool(): mysql.Pool {
    return this.pool;
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  public async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] || null : null;
  }

  public async execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
    try {
      const [result] = await this.pool.execute(sql, params);
      return result as mysql.ResultSetHeader;
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  public async initializeTables(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS contacts (
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
    `;

    try {
      await this.execute(createTableSQL);
      console.log('✅ Database tables initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database tables:', error);
      throw error;
    }
  }
} 