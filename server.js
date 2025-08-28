const express = require('express');
const { pool, testConnection, initializeDatabase } = require('./config/database');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const validator = require('validator');
const sharp = require('sharp');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
(async () => {
    const connected = await testConnection();
    if (connected) {
        await initializeDatabase();
        console.log('MySQL database setup completed.');
    } else {
        console.error('Failed to connect to MySQL database. Please check your XAMPP MySQL service.');
    }
})();

app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["*", "data:", "blob:", "'self'"],
            "script-src": ["'self'", "'unsafe-inline'"],
            "script-src-attr": null
        }
    }
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// Session configuration
app.use(session({
    secret: 'car-site-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Sample data will be inserted by the MySQL database configuration

// Temporary endpoint to clear and reset cars data
app.post('/api/reset-cars', async (req, res) => {
    try {
        // Delete all existing cars
        await pool.execute('DELETE FROM cars');
        
        // Reset auto increment
        await pool.execute('ALTER TABLE cars AUTO_INCREMENT = 1');
        
        // Force re-insert sample cars by directly calling the insertion logic
        const sampleCars = [
            {
                make: 'Toyota', model: 'Camry', year: 2022, price: 28500, mileage: 15000,
                fuel_type: 'Gasoline', transmission: 'Automatic', body_type: 'Sedan', color: 'Silver',
                engine_size: '2.5L', doors: 4, seats: 5, condition_rating: 5,
                description: 'Excellent condition, well maintained Toyota Camry with full service history',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSAxPC90ZXh0Pjwvc3ZnPg==',
                features: JSON.stringify(['Air Conditioning', 'Bluetooth', 'Backup Camera', 'Cruise Control', 'Keyless Entry'])
            },
            {
                make: 'Honda', model: 'Civic', year: 2021, price: 24000, mileage: 22000,
                fuel_type: 'Gasoline', transmission: 'Manual', body_type: 'Sedan', color: 'Blue',
                engine_size: '2.0L', doors: 4, seats: 5, condition_rating: 4,
                description: 'Sporty and fuel efficient Honda Civic with manual transmission',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjYmJiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzc3NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSAyPC90ZXh0Pjwvc3ZnPg==',
                features: JSON.stringify(['Air Conditioning', 'Bluetooth', 'Sport Mode', 'USB Ports', 'Power Windows'])
            },
            {
                make: 'BMW', model: 'X5', year: 2023, price: 65000, mileage: 8000,
                fuel_type: 'Gasoline', transmission: 'Automatic', body_type: 'SUV', color: 'Black',
                engine_size: '3.0L', doors: 5, seats: 7, condition_rating: 5,
                description: 'Luxury BMW X5 with premium features and low mileage',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjYWFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSAzPC90ZXh0Pjwvc3ZnPg==',
                features: JSON.stringify(['Leather Seats', 'Navigation', 'Panoramic Sunroof', 'Heated Seats', 'Premium Sound', 'All-Wheel Drive'])
            },
            {
                make: 'Ford', model: 'F-150', year: 2020, price: 35000, mileage: 45000,
                fuel_type: 'Gasoline', transmission: 'Automatic', body_type: 'Pickup', color: 'Red',
                engine_size: '5.0L', doors: 4, seats: 5, condition_rating: 4,
                description: 'Reliable Ford F-150 pickup truck, perfect for work and recreation',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOTk5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzU1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSA0PC90ZXh0Pjwvc3ZnPg==',
                features: JSON.stringify(['4WD', 'Towing Package', 'Bed Liner', 'Running Boards', 'Power Outlets'])
            },
            {
                make: 'Tesla', model: 'Model 3', year: 2022, price: 42000, mileage: 12000,
                fuel_type: 'Electric', transmission: 'Automatic', body_type: 'Sedan', color: 'White',
                engine_size: 'Electric', doors: 4, seats: 5, condition_rating: 5,
                description: 'Modern Tesla Model 3 with autopilot and supercharging capability',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjODg4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzQ0NCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSA1PC90ZXh0Pjwvc3ZnPg==',
                features: JSON.stringify(['Autopilot', 'Supercharging', 'Glass Roof', 'Premium Audio', 'Mobile Connectivity', 'Over-the-Air Updates'])
            },
            {
                make: 'Mercedes-Benz', model: 'C-Class', year: 2023, price: 48000, mileage: 5000,
                fuel_type: 'Gasoline', transmission: 'Automatic', body_type: 'Sedan', color: 'Gray',
                engine_size: '2.0L', doors: 4, seats: 5, condition_rating: 5,
                description: 'Luxury Mercedes-Benz C-Class with premium interior and advanced safety features',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNzc3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSA2PC90ZXh0Pjwvc3ZnPg==',
                features: JSON.stringify(['Leather Seats', 'Navigation', 'Heated Seats', 'Premium Sound', 'Adaptive Cruise Control', 'Lane Assist'])
            },
            {
                make: 'Audi', model: 'A4', year: 2021, price: 38000, mileage: 18000,
                fuel_type: 'Gasoline', transmission: 'Automatic', body_type: 'Sedan', color: 'Blue',
                engine_size: '2.0L', doors: 4, seats: 5, condition_rating: 4,
                description: 'Sporty Audi A4 with quattro all-wheel drive and premium features',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSA3PC90ZXh0Pjwvc3ZnPg==',
                features: JSON.stringify(['All-Wheel Drive', 'Virtual Cockpit', 'Premium Sound', 'Heated Seats', 'Sport Mode', 'Parking Sensors'])
            },
            {
                make: 'Chevrolet', model: 'Silverado', year: 2022, price: 42000, mileage: 25000,
                fuel_type: 'Gasoline', transmission: 'Automatic', body_type: 'Pickup', color: 'Black',
                engine_size: '5.3L', doors: 4, seats: 6, condition_rating: 4,
                description: 'Powerful Chevrolet Silverado with towing capacity and work-ready features',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNTU1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzExMSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSA4PC90ZXh0Pjwvc3ZnPg==',
                features: JSON.stringify(['4WD', 'Towing Package', 'Bed Cover', 'Running Boards', 'Backup Camera', 'Apple CarPlay'])
            },
            {
                make: 'Nissan', model: 'Altima', year: 2021, price: 26000, mileage: 28000,
                fuel_type: 'Gasoline', transmission: 'CVT', body_type: 'Sedan', color: 'White',
                engine_size: '2.5L', doors: 4, seats: 5, condition_rating: 4,
                description: 'Fuel-efficient Nissan Altima with comfortable interior and modern technology',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSA5PC90ZXh0Pjwvc3ZnPg==',
                features: JSON.stringify(['CVT Transmission', 'Bluetooth', 'Backup Camera', 'Keyless Entry', 'Power Windows', 'USB Ports'])
            },
            {
                make: 'Hyundai', model: 'Tucson', year: 2023, price: 32000, mileage: 8000,
                fuel_type: 'Gasoline', transmission: 'Automatic', body_type: 'SUV', color: 'Red',
                engine_size: '2.5L', doors: 5, seats: 5, condition_rating: 5,
                description: 'Modern Hyundai Tucson SUV with excellent warranty and fuel economy',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzg4OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSAxMDwvdGV4dD48L3N2Zz4=',
                features: JSON.stringify(['All-Wheel Drive', 'Heated Seats', 'Wireless Charging', 'Safety Suite', 'Panoramic Sunroof', 'Smart Cruise Control'])
            },
            {
                make: 'Volkswagen', model: 'Jetta', year: 2022, price: 23000, mileage: 16000,
                fuel_type: 'Gasoline', transmission: 'Automatic', body_type: 'Sedan', color: 'Silver',
                engine_size: '1.4L', doors: 4, seats: 5, condition_rating: 4,
                description: 'Efficient Volkswagen Jetta with German engineering and reliability',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjYmJiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzc3NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSAxMTwvdGV4dD48L3N2Zz4=',
                features: JSON.stringify(['Turbo Engine', 'Digital Cockpit', 'App Connect', 'Heated Seats', 'Automatic Climate Control', 'Blind Spot Monitor'])
            },
            {
                make: 'Mazda', model: 'CX-5', year: 2021, price: 29000, mileage: 22000,
                fuel_type: 'Gasoline', transmission: 'Automatic', body_type: 'SUV', color: 'Blue',
                engine_size: '2.5L', doors: 5, seats: 5, condition_rating: 4,
                description: 'Stylish Mazda CX-5 with premium interior and excellent handling',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjYWFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZSAxMjwvdGV4dD48L3N2Zz4=',
                features: JSON.stringify(['All-Wheel Drive', 'Bose Audio', 'Leather Seats', 'Navigation', 'Adaptive Headlights', 'Smart City Brake Support'])
            }
        ];
        
        // Insert all cars
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
        
        res.json({ message: 'Cars data reset successfully with 12 cars' });
    } catch (error) {
        console.error('Reset cars error:', error);
        res.status(500).json({ message: 'Error resetting cars data' });
    }
});

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: 'Authentication required' });
    }
}

// Routes

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User registration
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    try {
        // Check if user already exists
        const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        
        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Store user session
        req.session.userId = user.id;
        req.session.userName = user.name;
        
        res.json({ 
            message: 'Login successful', 
            user: { id: user.id, name: user.name, email: user.email } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// User logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Get current user
app.get('/api/user', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
        const [rows] = await pool.execute('SELECT id, name, email FROM users WHERE id = ?', [req.session.userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ user: rows[0] });
    } catch (error) {
        console.error('User error:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get all cars
app.get('/api/cars', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM cars ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Cars error:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Search cars
app.get('/api/cars/search', async (req, res) => {
    const { 
        query, 
        minPrice, 
        maxPrice, 
        minYear, 
        maxYear, 
        minMileage, 
        maxMileage, 
        fuelType, 
        transmission, 
        bodyType, 
        make,
        page = 1,
        limit = 12
    } = req.query;
    
    try {
        let sql = `SELECT * FROM cars WHERE status = 'active'`;
        let params = [];
        
        if (query) {
            sql += ` AND (make LIKE ? OR model LIKE ? OR description LIKE ? OR features LIKE ?)`;
            const searchTerm = `%${query}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        if (minPrice) {
            sql += ` AND price >= ?`;
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            sql += ` AND price <= ?`;
            params.push(parseFloat(maxPrice));
        }
        
        if (minYear) {
            sql += ` AND year >= ?`;
            params.push(parseInt(minYear));
        }
        if (maxYear) {
            sql += ` AND year <= ?`;
            params.push(parseInt(maxYear));
        }
        
        if (minMileage) {
            sql += ` AND mileage >= ?`;
            params.push(parseInt(minMileage));
        }
        if (maxMileage) {
            sql += ` AND mileage <= ?`;
            params.push(parseInt(maxMileage));
        }
        
        if (fuelType) {
            sql += ` AND fuel_type = ?`;
            params.push(fuelType);
        }
        if (transmission) {
            sql += ` AND transmission = ?`;
            params.push(transmission);
        }
        if (bodyType) {
            sql += ` AND body_type = ?`;
            params.push(bodyType);
        }
        if (make) {
            sql += ` AND make = ?`;
            params.push(make);
        }
        
        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countRows] = await pool.execute(countSql, params);
        const total = countRows[0].total;
        
        const offset = (page - 1) * limit;
        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);
        
        const [rows] = await pool.execute(sql, params);
        
        const cars = rows.map(car => ({
            ...car,
            features: car.features ? JSON.parse(car.features) : [],
            images: car.images ? JSON.parse(car.images) : []
        }));
        
        res.json({
            cars,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
});

// Get car by ID
app.get('/api/cars/:id', async (req, res) => {
    const carId = req.params.id;
    
    try {
        const [rows] = await pool.execute('SELECT * FROM cars WHERE id = ?', [carId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Car not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Car by ID error:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Add new car (requires authentication)
app.post('/api/cars', requireAuth, upload.single('image'), async (req, res) => {
    const { make, model, year, price, mileage, fuel_type, transmission, description } = req.body;
    const userId = req.session.userId;
    const image = req.file ? req.file.filename : null;
    
    if (!make || !model || !year || !price || !mileage || !fuel_type || !transmission) {
        return res.status(400).json({ message: 'All required fields must be provided' });
    }
    
    try {
        const [result] = await pool.execute(
            `INSERT INTO cars (user_id, make, model, year, price, mileage, fuel_type, transmission, description, image) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, make, model, year, price, mileage, fuel_type, transmission, description, image]
        );
        
        res.status(201).json({ message: 'Car added successfully', carId: result.insertId });
    } catch (error) {
        console.error('Add car error:', error);
        res.status(500).json({ message: 'Error adding car' });
    }
});

// Update car (requires authentication and ownership)
app.put('/api/cars/:id', requireAuth, upload.single('image'), async (req, res) => {
    const carId = req.params.id;
    const userId = req.session.userId;
    const { make, model, year, price, mileage, fuel_type, transmission, description } = req.body;
    const image = req.file ? req.file.filename : null;
    
    try {
        // First check if car exists and belongs to user
        const [rows] = await pool.execute('SELECT * FROM cars WHERE id = ? AND user_id = ?', [carId, userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Car not found or unauthorized' });
        }
        
        // Update car
        const updateQuery = image ? 
            `UPDATE cars SET make = ?, model = ?, year = ?, price = ?, mileage = ?, fuel_type = ?, transmission = ?, description = ?, image = ? WHERE id = ?` :
            `UPDATE cars SET make = ?, model = ?, year = ?, price = ?, mileage = ?, fuel_type = ?, transmission = ?, description = ? WHERE id = ?`;
        
        const params = image ? 
            [make, model, year, price, mileage, fuel_type, transmission, description, image, carId] :
            [make, model, year, price, mileage, fuel_type, transmission, description, carId];
        
        await pool.execute(updateQuery, params);
        
        res.json({ message: 'Car updated successfully' });
    } catch (error) {
        console.error('Update car error:', error);
        res.status(500).json({ message: 'Error updating car' });
    }
});

// Delete car (requires authentication and ownership)
app.delete('/api/cars/:id', requireAuth, async (req, res) => {
    const carId = req.params.id;
    const userId = req.session.userId;
    
    try {
        const [rows] = await pool.execute('SELECT * FROM cars WHERE id = ? AND user_id = ?', [carId, userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Car not found or unauthorized' });
        }
        
        // Delete the car
        await pool.execute('DELETE FROM cars WHERE id = ?', [carId]);
        
        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        console.error('Delete car error:', error);
        res.status(500).json({ message: 'Failed to delete car' });
    }
});

app.post('/api/favorites/:carId', requireAuth, async (req, res) => {
    const carId = req.params.carId;
    const userId = req.session.userId;
    
    try {
        await pool.execute('INSERT IGNORE INTO favorites (user_id, car_id) VALUES (?, ?)', [userId, carId]);
        res.json({ message: 'Added to favorites' });
    } catch (error) {
        console.error('Add favorites error:', error);
        res.status(500).json({ message: 'Failed to add to favorites' });
    }
});

app.delete('/api/favorites/:carId', requireAuth, async (req, res) => {
    const carId = req.params.carId;
    const userId = req.session.userId;
    
    try {
        await pool.execute('DELETE FROM favorites WHERE user_id = ? AND car_id = ?', [userId, carId]);
        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Remove favorites error:', error);
        res.status(500).json({ message: 'Failed to remove from favorites' });
    }
});

app.get('/api/favorites', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    
    try {
        const [rows] = await pool.execute(
            `SELECT c.*, f.created_at as favorited_at 
             FROM cars c 
             JOIN favorites f ON c.id = f.car_id 
             WHERE f.user_id = ? 
             ORDER BY f.created_at DESC`,
            [userId]
        );
        
        const cars = rows.map(car => ({
            ...car,
            features: car.features ? JSON.parse(car.features) : [],
            images: car.images ? JSON.parse(car.images) : []
        }));
        
        res.json(cars);
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ message: 'Failed to get favorites' });
    }
});

app.get('/api/user-cars', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM cars WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        res.json({ cars: rows });
    } catch (error) {
        console.error('User cars error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Compare cars endpoint
app.post('/api/cars/compare', async (req, res) => {
    try {
        const { carIds } = req.body;
        
        if (!carIds || !Array.isArray(carIds) || carIds.length < 2 || carIds.length > 4) {
            return res.status(400).json({ message: 'Please provide 2-4 car IDs for comparison' });
        }
        
        const placeholders = carIds.map(() => '?').join(',');
        const [rows] = await pool.execute(
            `SELECT * FROM cars WHERE id IN (${placeholders})`,
            carIds
        );
        
        if (rows.length !== carIds.length) {
            return res.status(404).json({ message: 'One or more cars not found' });
        }
        
        // Parse features and images for each car
        const cars = rows.map(car => ({
            ...car,
            features: car.features ? JSON.parse(car.features) : [],
            images: car.images ? JSON.parse(car.images) : []
        }));
        
        // Calculate summary statistics
        const summary = {
            lowestPrice: Math.min(...cars.map(car => car.price)),
            highestPrice: Math.max(...cars.map(car => car.price)),
            lowestMileage: Math.min(...cars.map(car => car.mileage)),
            highestMileage: Math.max(...cars.map(car => car.mileage)),
            oldestYear: Math.min(...cars.map(car => car.year)),
            newestYear: Math.max(...cars.map(car => car.year)),
            priceRange: {
                min: Math.min(...cars.map(car => car.price)),
                max: Math.max(...cars.map(car => car.price))
            },
            yearRange: {
                min: Math.min(...cars.map(car => car.year)),
                max: Math.max(...cars.map(car => car.year))
            }
        };
        
        res.json({ cars, summary });
    } catch (error) {
        console.error('Compare cars error:', error);
        res.status(500).json({ message: 'Comparison failed' });
    }
});

// Update car status (active/inactive)
app.put('/api/cars/:id/status', requireAuth, async (req, res) => {
    const carId = req.params.id;
    const userId = req.session.userId;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    try {
        // Check if the car belongs to the user
        const [rows] = await pool.execute('SELECT user_id FROM cars WHERE id = ?', [carId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        // Update the car status
        await pool.execute('UPDATE cars SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, carId]);
        
        res.json({ message: 'Car status updated successfully' });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Reviews endpoints
app.post('/api/reviews', requireAuth, async (req, res) => {
    const { reviewed_user_id, car_id, rating, comment } = req.body;
    const reviewer_id = req.session.userId;
    
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    try {
        const [result] = await pool.execute(
            'INSERT INTO reviews (reviewer_id, reviewed_user_id, car_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [reviewer_id, reviewed_user_id, car_id, rating, comment]
        );
        
        res.json({ message: 'Review added successfully', id: result.insertId });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ message: 'Failed to add review' });
    }
});

app.get('/api/reviews/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
        const [rows] = await pool.execute(
            `SELECT r.*, u.name as reviewer_name, c.make, c.model 
             FROM reviews r 
             JOIN users u ON r.reviewer_id = u.id 
             LEFT JOIN cars c ON r.car_id = c.id 
             WHERE r.reviewed_user_id = ? 
             ORDER BY r.created_at DESC`,
            [userId]
        );
        
        res.json(rows);
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ message: 'Failed to get reviews' });
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    try {
        await pool.execute('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject, message]);
        
        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
});

// User profile endpoints
app.put('/api/user/profile', requireAuth, upload.single('profile_picture'), async (req, res) => {
    const userId = req.session.userId;
    const { name, phone } = req.body;
    let profile_picture = null;
    
    if (req.file) {
        profile_picture = req.file.filename;
    }
    
    try {
        let sql = 'UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP';
        let params = [name, phone];
        
        if (profile_picture) {
            sql += ', profile_picture = ?';
            params.push(profile_picture);
        }
        
        sql += ' WHERE id = ?';
        params.push(userId);
        
        await pool.execute(sql, params);
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

app.put('/api/user/password', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    
    try {
        const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = rows[0];
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await pool.execute('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, userId]);
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ message: 'Failed to update password' });
    }
});

app.post('/api/saved-searches', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const { search_name, search_criteria, email_alerts } = req.body;
    
    try {
        const [result] = await pool.execute(`INSERT INTO saved_searches (user_id, search_name, search_criteria, email_alerts) 
                VALUES (?, ?, ?, ?)`, 
            [userId, search_name, JSON.stringify(search_criteria), email_alerts]);
        
        res.json({ message: 'Search saved successfully', id: result.insertId });
    } catch (error) {
        console.error('Saved search error:', error);
        res.status(500).json({ message: 'Failed to save search' });
    }
});

app.get('/api/saved-searches', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    
    try {
        const [searches] = await pool.execute('SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC', 
            [userId]);
        
        const parsedSearches = searches.map(search => ({
            ...search,
            search_criteria: JSON.parse(search.search_criteria)
        }));
        
        res.json({ searches: parsedSearches });
    } catch (error) {
        console.error('Saved searches error:', error);
        res.status(500).json({ message: 'Failed to get saved searches' });
    }
});

app.delete('/api/saved-searches/:id', requireAuth, async (req, res) => {
    const searchId = req.params.id;
    const userId = req.session.userId;
    
    try {
        await pool.execute('DELETE FROM saved_searches WHERE id = ? AND user_id = ?', 
            [searchId, userId]);
        
        res.json({ message: 'Saved search deleted successfully' });
    } catch (error) {
        console.error('Delete saved search error:', error);
        res.status(500).json({ message: 'Failed to delete saved search' });
    }
});

// Admin authentication middleware
function requireAdminAuth(req, res, next) {
    if (req.session.userId && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ message: 'Admin authentication required' });
    }
}

// Admin Routes

// Admin login
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    try {
        // Check for admin user (you can modify this logic as needed)
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND is_admin = 1', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
        
        const admin = rows[0];
        const isValidPassword = await bcrypt.compare(password, admin.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
        
        // Store admin session
        req.session.userId = admin.id;
        req.session.userName = admin.name;
        req.session.isAdmin = true;
        
        res.json({ 
            success: true,
            message: 'Admin login successful', 
            user: { id: admin.id, name: admin.name, email: admin.email } 
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin auth check
app.get('/api/admin/auth', (req, res) => {
    if (req.session.userId && req.session.isAdmin) {
        res.json({ 
            isAdmin: true, 
            user: { 
                id: req.session.userId, 
                name: req.session.userName 
            } 
        });
    } else {
        res.status(401).json({ isAdmin: false, message: 'Not authenticated as admin' });
    }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.json({ message: 'Admin logout successful' });
    });
});

// Admin dashboard
app.get('/api/admin/dashboard', requireAdminAuth, async (req, res) => {
    try {
        // Get dashboard statistics
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [carCount] = await pool.execute('SELECT COUNT(*) as count FROM cars');
        const [activeCarCount] = await pool.execute('SELECT COUNT(*) as count FROM cars WHERE status = "active"');
        const [pendingCarCount] = await pool.execute('SELECT COUNT(*) as count FROM cars WHERE status = "pending"');
        const [reviewCount] = await pool.execute('SELECT COUNT(*) as count FROM reviews');
        const [contactCount] = await pool.execute('SELECT COUNT(*) as count FROM contact_messages');
        
        // Get recent activities
        const [recentCars] = await pool.execute(
            'SELECT id, make, model, year, price, status, created_at FROM cars ORDER BY created_at DESC LIMIT 5'
        );
        const [recentUsers] = await pool.execute(
            'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
        );
        const [recentReviews] = await pool.execute(
            'SELECT r.id, r.rating, r.comment, r.created_at, u.name as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id ORDER BY r.created_at DESC LIMIT 5'
        );
        
        res.json({
            stats: {
                totalUsers: userCount[0].count,
                totalCars: carCount[0].count,
                activeCars: activeCarCount[0].count,
                pendingCars: pendingCarCount[0].count,
                totalReviews: reviewCount[0].count,
                totalMessages: contactCount[0].count
            },
            recentActivities: {
                cars: recentCars,
                users: recentUsers,
                reviews: recentReviews
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Failed to load dashboard data' });
    }
});

// Admin users management
app.get('/api/admin/users', requireAdminAuth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    try {
        let whereClause = '';
        let params = [];
        
        if (search) {
            whereClause = 'WHERE name LIKE ? OR email LIKE ?';
            params = [`%${search}%`, `%${search}%`];
        }
        
        // Get total count
        const [countResult] = await pool.execute(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
        const total = countResult[0].total;
        
        // Get users with pagination
        const [users] = await pool.execute(
            `SELECT id, name, email, phone, profile_picture, is_admin, created_at, updated_at 
             FROM users ${whereClause} 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        
        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Failed to get users' });
    }
});

// Get single user
app.get('/api/admin/users/:id', requireAdminAuth, async (req, res) => {
    const userId = req.params.id;
    
    try {
        const [users] = await pool.execute(
            'SELECT id, name, email, phone, profile_picture, is_admin, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get user's cars
        const [cars] = await pool.execute(
            'SELECT id, make, model, year, price, status, created_at FROM cars WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        // Get user's reviews
        const [reviews] = await pool.execute(
            'SELECT id, rating, comment, created_at FROM reviews WHERE reviewer_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        res.json({
            user: users[0],
            cars,
            reviews
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Failed to get user' });
    }
});

// Update user
app.put('/api/admin/users/:id', requireAdminAuth, async (req, res) => {
    const userId = req.params.id;
    const { name, email, phone, status, is_admin } = req.body;
    
    try {
        let sql = 'UPDATE users SET name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP';
        let params = [name, email, phone];
        
        if (status !== undefined) {
            sql += ', status = ?';
            params.push(status);
        }
        
        if (is_admin !== undefined) {
            sql += ', is_admin = ?';
            params.push(is_admin ? 1 : 0);
        }
        
        sql += ' WHERE id = ?';
        params.push(userId);
        
        await pool.execute(sql, params);
        
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Failed to update user' });
    }
});

// Delete user
app.delete('/api/admin/users/:id', requireAdminAuth, async (req, res) => {
    const userId = req.params.id;
    
    try {
        // Don't allow deleting the current admin
        if (userId == req.session.userId) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

// Admin cars management
app.get('/api/admin/cars', requireAdminAuth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    try {
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (search) {
            whereClause += ' AND (make LIKE ? OR model LIKE ? OR CONCAT(make, " ", model) LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (status && status !== 'all') {
            whereClause += ' AND c.status = ?';
            params.push(status);
        }
        
        // Get total count
        const [countResult] = await pool.execute(`SELECT COUNT(*) as total FROM cars c ${whereClause}`, params);
        const total = countResult[0].total;
        
        // Get cars with pagination
        const [cars] = await pool.execute(
            `SELECT c.*, u.name as owner_name, u.email as owner_email 
             FROM cars c 
             LEFT JOIN users u ON c.user_id = u.id 
             ${whereClause} 
             ORDER BY c.created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        
        res.json({
            cars,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get cars error:', error);
        res.status(500).json({ message: 'Failed to get cars' });
    }
});

// Get single car
app.get('/api/admin/cars/:id', requireAdminAuth, async (req, res) => {
    const carId = req.params.id;
    
    try {
        const [cars] = await pool.execute(
            `SELECT c.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone 
             FROM cars c 
             LEFT JOIN users u ON c.user_id = u.id 
             WHERE c.id = ?`,
            [carId]
        );
        
        if (cars.length === 0) {
            return res.status(404).json({ message: 'Car not found' });
        }
        
        // Get car reviews
        const [reviews] = await pool.execute(
            `SELECT r.*, u.name as reviewer_name 
             FROM reviews r 
             JOIN users u ON r.reviewer_id = u.id 
             WHERE r.car_id = ? 
             ORDER BY r.created_at DESC`,
            [carId]
        );
        
        res.json({
            car: cars[0],
            reviews
        });
    } catch (error) {
        console.error('Get car error:', error);
        res.status(500).json({ message: 'Failed to get car' });
    }
});



// Delete car
app.delete('/api/admin/cars/:id', requireAdminAuth, async (req, res) => {
    const carId = req.params.id;
    
    try {
        await pool.execute('DELETE FROM cars WHERE id = ?', [carId]);
        
        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        console.error('Delete car error:', error);
        res.status(500).json({ message: 'Failed to delete car' });
    }
});

// Admin reviews management
app.get('/api/admin/reviews', requireAdminAuth, async (req, res) => {
    const status = req.query.status || '';
    const rating = req.query.rating || '';
    
    try {
        let whereClause = 'WHERE 1=1';
        let params = [];
        
        if (status === 'flagged') {
            whereClause += ' AND r.is_flagged = 1';
        }
        
        if (rating) {
            whereClause += ' AND r.rating = ?';
            params.push(rating);
        }
        
        const [reviews] = await pool.execute(
            `SELECT r.*, 
                    u1.name as reviewer_name, u1.email as reviewer_email,
                    u2.name as reviewed_user_name, u2.email as reviewed_user_email,
                    c.make, c.model, c.year
             FROM reviews r 
             JOIN users u1 ON r.reviewer_id = u1.id 
             LEFT JOIN users u2 ON r.reviewed_user_id = u2.id 
             LEFT JOIN cars c ON r.car_id = c.id 
             ${whereClause} 
             ORDER BY r.created_at DESC`,
            params
        );
        
        res.json({ reviews });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ message: 'Failed to get reviews' });
    }
});

// Approve review
app.post('/api/admin/reviews/:id/approve', requireAdminAuth, async (req, res) => {
    const reviewId = req.params.id;
    
    try {
        await pool.execute(
            'UPDATE reviews SET is_flagged = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [reviewId]
        );
        
        res.json({ message: 'Review approved successfully' });
    } catch (error) {
        console.error('Approve review error:', error);
        res.status(500).json({ message: 'Failed to approve review' });
    }
});

// Reject/Flag review
app.post('/api/admin/reviews/:id/reject', requireAdminAuth, async (req, res) => {
    const reviewId = req.params.id;
    const { reason } = req.body;
    
    try {
        await pool.execute(
            'UPDATE reviews SET is_flagged = 1, flag_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [reason || 'Inappropriate content', reviewId]
        );
        
        res.json({ message: 'Review flagged successfully' });
    } catch (error) {
        console.error('Flag review error:', error);
        res.status(500).json({ message: 'Failed to flag review' });
    }
});

// Delete review
app.delete('/api/admin/reviews/:id', requireAdminAuth, async (req, res) => {
    const reviewId = req.params.id;
    
    try {
        await pool.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);
        
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ message: 'Failed to delete review' });
    }
});



// Admin settings
app.get('/api/admin/settings', requireAdminAuth, async (req, res) => {
    try {
        // Return mock settings - you can implement actual settings storage
        const settings = {
            general: {
                siteName: 'Car Marketplace',
                siteDescription: 'Buy and sell cars online',
                contactEmail: 'admin@carsite.com',
                maintenanceMode: false
            },
            listing: {
                maxImagesPerListing: 10,
                requireApproval: true,
                autoDeleteAfterDays: 90,
                featuredListingPrice: 29.99
            },
            email: {
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                smtpUser: '',
                notificationsEnabled: true
            },
            security: {
                maxLoginAttempts: 5,
                sessionTimeout: 24,
                requireEmailVerification: false,
                twoFactorEnabled: false
            }
        };
        
        res.json(settings);
    } catch (error) {
        console.error('Settings error:', error);
        res.status(500).json({ message: 'Failed to get settings' });
    }
});

// Update admin settings
app.put('/api/admin/settings/:type', requireAdminAuth, async (req, res) => {
    const settingsType = req.params.type;
    const settings = req.body;
    
    try {
        // Here you would typically save to database
        // For now, just return success
        console.log(`Updating ${settingsType} settings:`, settings);
        
        res.json({ message: `${settingsType} settings updated successfully` });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Failed to update settings' });
    }
});

// Admin export data
app.get('/api/admin/export/:format', requireAdminAuth, async (req, res) => {
    const format = req.params.format;
    
    try {
        if (format === 'csv') {
            // Export users as CSV
            const [users] = await pool.execute(
                'SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC'
            );
            
            let csv = 'ID,Name,Email,Phone,Created At\n';
            users.forEach(user => {
                csv += `${user.id},"${user.name}","${user.email}","${user.phone || ''}","${user.created_at}"\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
            res.send(csv);
        } else {
            res.status(400).json({ message: 'Unsupported export format' });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Failed to export data' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    try {
        await pool.end();
        console.log('Database connection closed.');
    } catch (error) {
        console.error('Error closing database:', error.message);
    }
    process.exit(0);
});