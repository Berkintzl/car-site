const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createAdmin() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'car_site_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        // First, add is_admin column if it doesn't exist
        try {
            await pool.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0');
            console.log('Added is_admin column to users table');
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                console.log('is_admin column already exists or other error:', error.message);
            }
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Insert admin user
        await pool.execute(
            `INSERT INTO users (name, email, password, phone, is_admin, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE is_admin = 1`,
            ['Admin User', 'admin@carsite.com', hashedPassword, '555-0123', 1]
        );
        
        console.log('Admin user created successfully!');
        console.log('Email: admin@carsite.com');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await pool.end();
    }
}

createAdmin();