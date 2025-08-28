const mysql = require('mysql2/promise');

// MySQL Database Configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // XAMPP default password is empty
    database: 'car_site_db',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database successfully!');
        connection.release();
        return true;
    } catch (error) {
        console.error('Error connecting to MySQL database:', error.message);
        return false;
    }
}

// Initialize database and tables
async function initializeDatabase() {
    try {
        console.log('Initializing MySQL database...');
        
        // Create database if it doesn't exist
        const tempConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port
        });
        
        await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await tempConnection.end();
        
        // Create tables
        await createTables();
        
        // Insert sample data
        await insertSampleCars();
        
        console.log('Database initialization completed successfully!');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error.message);
        return false;
    }
}

// Create all tables
async function createTables() {
    const connection = await pool.getConnection();
    
    try {
        // Users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                profile_picture VARCHAR(255),
                role VARCHAR(50) DEFAULT 'user',
                status VARCHAR(20) DEFAULT 'active',
                is_admin BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table created/verified');
        
        // Add status and is_admin columns if they don't exist
        try {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN status VARCHAR(20) DEFAULT 'active'
            `);
            console.log('Status column added to users table');
        } catch (error) {
            // Column might already exist, ignore error
            if (!error.message.includes('Duplicate column name')) {
                console.log('Status column already exists or error:', error.message);
            }
        }
        
        try {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN is_admin BOOLEAN DEFAULT 0
            `);
            console.log('is_admin column added to users table');
        } catch (error) {
            // Column might already exist, ignore error
            if (!error.message.includes('Duplicate column name')) {
                console.log('is_admin column already exists or error:', error.message);
            }
        }
        
        // Cars table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS cars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                make VARCHAR(100) NOT NULL,
                model VARCHAR(100) NOT NULL,
                year INT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                mileage INT NOT NULL,
                fuel_type VARCHAR(50) NOT NULL,
                transmission VARCHAR(50) NOT NULL,
                body_type VARCHAR(50),
                color VARCHAR(50),
                engine_size VARCHAR(20),
                doors INT,
                seats INT,
                condition_rating INT DEFAULT 5,
                description TEXT,
                image VARCHAR(255),
                images TEXT,
                features TEXT,
                status VARCHAR(20) DEFAULT 'active',
                views INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Cars table created/verified');
        
        // Reviews table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reviewer_id INT,
                reviewed_user_id INT,
                car_id INT,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                helpful_votes INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
            )
        `);
        console.log('Reviews table created/verified');
        
        // Favorites table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                car_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
                UNIQUE KEY unique_favorite (user_id, car_id)
            )
        `);
        console.log('Favorites table created/verified');
        
        // Saved searches table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS saved_searches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                search_name VARCHAR(255) NOT NULL,
                search_criteria TEXT,
                email_alerts BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Saved searches table created/verified');
        
        // Search alerts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS search_alerts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                search_criteria TEXT,
                email VARCHAR(255),
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Search alerts table created/verified');
        
        // Contact messages table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255),
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Contact messages table created/verified');
        
        // Create indexes
        await connection.execute('CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model)');
        await connection.execute('CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price)');
        await connection.execute('CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year)');
        await connection.execute('CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars(user_id)');
        await connection.execute('CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(reviewed_user_id)');
        await connection.execute('CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)');
        
        console.log('All tables and indexes created successfully!');
        
    } finally {
        connection.release();
    }
}

// Insert sample cars for demonstration
async function insertSampleCars() {
    const sampleCars = [
        {
            make: 'Toyota',
            model: 'Camry',
            year: 2022,
            price: 28500,
            mileage: 15000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            body_type: 'Sedan',
            color: 'Silver',
            engine_size: '2.5L',
            doors: 4,
            seats: 5,
            condition_rating: 5,
            description: 'Excellent condition, well maintained Toyota Camry with full service history',
            image: 'https://via.placeholder.com/400x300/cccccc/666666?text=Toyota+Camry',
            features: JSON.stringify(['Air Conditioning', 'Bluetooth', 'Backup Camera', 'Cruise Control', 'Keyless Entry'])
        },
        {
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            price: 24000,
            mileage: 22000,
            fuel_type: 'Gasoline',
            transmission: 'Manual',
            body_type: 'Sedan',
            color: 'Blue',
            engine_size: '2.0L',
            doors: 4,
            seats: 5,
            condition_rating: 4,
            description: 'Sporty and fuel efficient Honda Civic with manual transmission',
            image: 'https://via.placeholder.com/400x300/4a90e2/ffffff?text=Honda+Civic',
            features: JSON.stringify(['Air Conditioning', 'Bluetooth', 'Sport Mode', 'USB Ports', 'Power Windows'])
        },
        {
            make: 'BMW',
            model: 'X5',
            year: 2023,
            price: 65000,
            mileage: 8000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            body_type: 'SUV',
            color: 'Black',
            engine_size: '3.0L',
            doors: 5,
            seats: 7,
            condition_rating: 5,
            description: 'Luxury BMW X5 with premium features and low mileage',
            image: 'https://via.placeholder.com/400x300/333333/ffffff?text=BMW+X5',
            features: JSON.stringify(['Leather Seats', 'Navigation', 'Panoramic Sunroof', 'Heated Seats', 'Premium Sound', 'All-Wheel Drive'])
        },
        {
            make: 'Ford',
            model: 'F-150',
            year: 2020,
            price: 35000,
            mileage: 45000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            body_type: 'Pickup',
            color: 'Red',
            engine_size: '5.0L',
            doors: 4,
            seats: 5,
            condition_rating: 4,
            description: 'Reliable Ford F-150 pickup truck, perfect for work and recreation',
            image: 'https://via.placeholder.com/400x300/dc3545/ffffff?text=Ford+F-150',
            features: JSON.stringify(['4WD', 'Towing Package', 'Bed Liner', 'Running Boards', 'Power Outlets'])
        },
        {
            make: 'Tesla',
            model: 'Model 3',
            year: 2022,
            price: 42000,
            mileage: 12000,
            fuel_type: 'Electric',
            transmission: 'Automatic',
            body_type: 'Sedan',
            color: 'White',
            engine_size: 'Electric',
            doors: 4,
            seats: 5,
            condition_rating: 5,
            description: 'Modern Tesla Model 3 with autopilot and supercharging capability',
            image: 'https://via.placeholder.com/400x300/ffffff/333333?text=Tesla+Model+3',
            features: JSON.stringify(['Autopilot', 'Supercharging', 'Glass Roof', 'Premium Audio', 'Mobile Connectivity', 'Over-the-Air Updates'])
        },
        {
            make: 'Mercedes-Benz',
            model: 'C-Class',
            year: 2023,
            price: 48000,
            mileage: 5000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            body_type: 'Sedan',
            color: 'Gray',
            engine_size: '2.0L',
            doors: 4,
            seats: 5,
            condition_rating: 5,
            description: 'Luxury Mercedes-Benz C-Class with premium interior and advanced safety features',
            image: 'https://via.placeholder.com/400x300/708090/ffffff?text=Mercedes+C-Class',
            features: JSON.stringify(['Leather Seats', 'Navigation', 'Heated Seats', 'Premium Sound', 'Adaptive Cruise Control', 'Lane Assist'])
        },
        {
            make: 'Audi',
            model: 'A4',
            year: 2021,
            price: 38000,
            mileage: 18000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            body_type: 'Sedan',
            color: 'Blue',
            engine_size: '2.0L',
            doors: 4,
            seats: 5,
            condition_rating: 4,
            description: 'Sporty Audi A4 with quattro all-wheel drive and premium features',
            image: 'https://via.placeholder.com/400x300/4a90e2/ffffff?text=Audi+A4',
            features: JSON.stringify(['All-Wheel Drive', 'Virtual Cockpit', 'Premium Sound', 'Heated Seats', 'Sport Mode', 'Parking Sensors'])
        },
        {
            make: 'Chevrolet',
            model: 'Silverado',
            year: 2022,
            price: 42000,
            mileage: 25000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            body_type: 'Pickup',
            color: 'Black',
            engine_size: '5.3L',
            doors: 4,
            seats: 6,
            condition_rating: 4,
            description: 'Powerful Chevrolet Silverado with towing capacity and work-ready features',
            image: 'https://via.placeholder.com/400x300/333333/ffffff?text=Chevrolet+Silverado',
            features: JSON.stringify(['4WD', 'Towing Package', 'Bed Cover', 'Running Boards', 'Backup Camera', 'Apple CarPlay'])
        },
        {
            make: 'Nissan',
            model: 'Altima',
            year: 2021,
            price: 26000,
            mileage: 28000,
            fuel_type: 'Gasoline',
            transmission: 'CVT',
            body_type: 'Sedan',
            color: 'White',
            engine_size: '2.5L',
            doors: 4,
            seats: 5,
            condition_rating: 4,
            description: 'Fuel-efficient Nissan Altima with comfortable interior and modern technology',
            image: 'https://via.placeholder.com/400x300/ffffff/333333?text=Nissan+Altima',
            features: JSON.stringify(['CVT Transmission', 'Bluetooth', 'Backup Camera', 'Keyless Entry', 'Power Windows', 'USB Ports'])
        },
        {
            make: 'Hyundai',
            model: 'Tucson',
            year: 2023,
            price: 32000,
            mileage: 8000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            body_type: 'SUV',
            color: 'Red',
            engine_size: '2.5L',
            doors: 5,
            seats: 5,
            condition_rating: 5,
            description: 'Modern Hyundai Tucson SUV with excellent warranty and fuel economy',
            image: 'https://via.placeholder.com/400x300/dc3545/ffffff?text=Hyundai+Tucson',
            features: JSON.stringify(['All-Wheel Drive', 'Heated Seats', 'Wireless Charging', 'Safety Suite', 'Panoramic Sunroof', 'Smart Cruise Control'])
        },
        {
            make: 'Volkswagen',
            model: 'Jetta',
            year: 2022,
            price: 23000,
            mileage: 16000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            body_type: 'Sedan',
            color: 'Silver',
            engine_size: '1.4L',
            doors: 4,
            seats: 5,
            condition_rating: 4,
            description: 'Efficient Volkswagen Jetta with German engineering and reliability',
            image: 'https://via.placeholder.com/400x300/c0c0c0/333333?text=Volkswagen+Jetta',
            features: JSON.stringify(['Turbo Engine', 'Digital Cockpit', 'App Connect', 'Heated Seats', 'Automatic Climate Control', 'Blind Spot Monitor'])
        },
        {
            make: 'Mazda',
            model: 'CX-5',
            year: 2021,
            price: 29000,
            mileage: 22000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            body_type: 'SUV',
            color: 'Blue',
            engine_size: '2.5L',
            doors: 5,
            seats: 5,
            condition_rating: 4,
            description: 'Stylish Mazda CX-5 with premium interior and excellent handling',
            image: 'https://via.placeholder.com/400x300/4a90e2/ffffff?text=Mazda+CX-5',
            features: JSON.stringify(['All-Wheel Drive', 'Bose Audio', 'Leather Seats', 'Navigation', 'Adaptive Headlights', 'Smart City Brake Support'])
        }
    ];

    try {
        // Check if cars already exist
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM cars');
        
        if (rows[0].count === 0) {
            for (const car of sampleCars) {
                await pool.execute(
                    `INSERT INTO cars (make, model, year, price, mileage, fuel_type, transmission, 
                     body_type, color, engine_size, doors, seats, condition_rating, description, features, image) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        car.make, car.model, car.year, car.price, car.mileage,
                        car.fuel_type, car.transmission, car.body_type, car.color,
                        car.engine_size, car.doors, car.seats, car.condition_rating,
                        car.description, car.features, car.image
                    ]
                );
            }
            console.log('Sample cars inserted successfully.');
        }
    } catch (error) {
        console.error('Error inserting sample cars:', error);
    }
}

module.exports = {
    pool,
    testConnection,
    initializeDatabase,
    createTables,
    insertSampleCars
};