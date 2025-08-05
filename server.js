const express = require('express');
const sqlite3 = require('sqlite3').verbose();
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
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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
        cb(null, 'public/images/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Initialize database tables
function initializeDatabase() {
    console.log('Initializing database tables...');
    
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            profile_picture TEXT,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating users table:', err);
            else console.log('Users table created/verified');
        });

        db.run(`CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            mileage INTEGER NOT NULL,
            fuel_type TEXT NOT NULL,
            transmission TEXT NOT NULL,
            body_type TEXT,
            color TEXT,
            engine_size TEXT,
            doors INTEGER,
            seats INTEGER,
            condition_rating INTEGER DEFAULT 5,
            description TEXT,
            image TEXT,
            images TEXT,
            features TEXT,
            status TEXT DEFAULT 'active',
            views INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) console.error('Error creating cars table:', err);
            else console.log('Cars table created/verified');
        });

        db.run(`CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reviewer_id INTEGER,
            reviewed_user_id INTEGER,
            car_id INTEGER,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            helpful_votes INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reviewer_id) REFERENCES users (id),
            FOREIGN KEY (reviewed_user_id) REFERENCES users (id),
            FOREIGN KEY (car_id) REFERENCES cars (id)
        )`, (err) => {
            if (err) console.error('Error creating reviews table:', err);
            else console.log('Reviews table created/verified');
        });

        db.run(`CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            car_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (car_id) REFERENCES cars (id),
            UNIQUE(user_id, car_id)
        )`, (err) => {
            if (err) console.error('Error creating favorites table:', err);
            else console.log('Favorites table created/verified');
        });

        db.run(`CREATE TABLE IF NOT EXISTS saved_searches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            search_name TEXT NOT NULL,
            search_criteria TEXT,
            email_alerts BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) console.error('Error creating saved_searches table:', err);
            else console.log('Saved searches table created/verified');
        });

        db.run(`CREATE TABLE IF NOT EXISTS search_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            search_criteria TEXT,
            email TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) console.error('Error creating search_alerts table:', err);
            else console.log('Search alerts table created/verified');
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(reviewed_user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)`);

        db.run(`SELECT name FROM sqlite_master WHERE type='table' AND name='cars'`, (err, row) => {
            if (!err) {
                console.log('All tables created successfully. Inserting sample data...');
                insertSampleCars();
            }
        });
    });
    
    console.log('Database initialization completed');
}

// Insert sample cars for demonstration
function insertSampleCars() {
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
            features: JSON.stringify(['Autopilot', 'Supercharging', 'Glass Roof', 'Premium Audio', 'Mobile Connectivity', 'Over-the-Air Updates'])
        }
    ];

    // Check if cars already exist
    db.get('SELECT COUNT(*) as count FROM cars', (err, row) => {
        if (err) {
            console.error('Error checking cars:', err);
            return;
        }
        
        if (row.count === 0) {
            const stmt = db.prepare(`INSERT INTO cars (make, model, year, price, mileage, fuel_type, transmission, 
                                    body_type, color, engine_size, doors, seats, condition_rating, description, features) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            
            sampleCars.forEach(car => {
                stmt.run([
                    car.make, car.model, car.year, car.price, car.mileage, 
                    car.fuel_type, car.transmission, car.body_type, car.color, 
                    car.engine_size, car.doors, car.seats, car.condition_rating, 
                    car.description, car.features
                ]);
            });
            
            stmt.finalize();
            console.log('Sample cars inserted successfully.');
        }
    });
}

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
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (row) {
                return res.status(400).json({ message: 'User already exists' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert new user
            db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
                [name, email, hashedPassword], 
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Error creating user' });
                    }
                    
                    res.status(201).json({ message: 'User created successfully', userId: this.lastID });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// User login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        try {
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
            
            // Set session
            req.session.userId = user.id;
            req.session.userName = user.name;
            
            res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    });
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
app.get('/api/user', requireAuth, (req, res) => {
    db.get('SELECT id, name, email FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    });
});

// Get all cars
app.get('/api/cars', (req, res) => {
    db.all('SELECT * FROM cars ORDER BY created_at DESC', (err, cars) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        
        res.json(cars);
    });
});

// Search cars
app.get('/api/cars/search', (req, res) => {
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
    
    db.get(countSql, params, (err, countRow) => {
        if (err) {
            console.error('Count error:', err);
            return res.status(500).json({ message: 'Search failed' });
        }
        
        const total = countRow.total;
        const offset = (page - 1) * limit;
        
        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);
        
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Search error:', err);
                return res.status(500).json({ message: 'Search failed' });
            }
            
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
        });
    });
});

// Get car by ID
app.get('/api/cars/:id', (req, res) => {
    const carId = req.params.id;
    
    db.get('SELECT * FROM cars WHERE id = ?', [carId], (err, car) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        
        res.json(car);
    });
});

// Add new car (requires authentication)
app.post('/api/cars', requireAuth, upload.single('image'), (req, res) => {
    const { make, model, year, price, mileage, fuel_type, transmission, description } = req.body;
    const userId = req.session.userId;
    const image = req.file ? req.file.filename : null;
    
    if (!make || !model || !year || !price || !mileage || !fuel_type || !transmission) {
        return res.status(400).json({ message: 'All required fields must be provided' });
    }
    
    db.run(`INSERT INTO cars (user_id, make, model, year, price, mileage, fuel_type, transmission, description, image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, make, model, year, price, mileage, fuel_type, transmission, description, image],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Error adding car' });
            }
            
            res.status(201).json({ message: 'Car added successfully', carId: this.lastID });
        }
    );
});

// Update car (requires authentication and ownership)
app.put('/api/cars/:id', requireAuth, upload.single('image'), (req, res) => {
    const carId = req.params.id;
    const userId = req.session.userId;
    const { make, model, year, price, mileage, fuel_type, transmission, description } = req.body;
    const image = req.file ? req.file.filename : null;
    
    // First check if car exists and belongs to user
    db.get('SELECT * FROM cars WHERE id = ? AND user_id = ?', [carId, userId], (err, car) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (!car) {
            return res.status(404).json({ message: 'Car not found or unauthorized' });
        }
        
        // Update car
        const updateQuery = image ? 
            `UPDATE cars SET make = ?, model = ?, year = ?, price = ?, mileage = ?, fuel_type = ?, transmission = ?, description = ?, image = ? WHERE id = ?` :
            `UPDATE cars SET make = ?, model = ?, year = ?, price = ?, mileage = ?, fuel_type = ?, transmission = ?, description = ? WHERE id = ?`;
        
        const params = image ? 
            [make, model, year, price, mileage, fuel_type, transmission, description, image, carId] :
            [make, model, year, price, mileage, fuel_type, transmission, description, carId];
        
        db.run(updateQuery, params, function(err) {
            if (err) {
                return res.status(500).json({ message: 'Error updating car' });
            }
            
            res.json({ message: 'Car updated successfully' });
        });
    });
});

// Delete car (requires authentication and ownership)
app.delete('/api/cars/:id', requireAuth, (req, res) => {
    const carId = req.params.id;
    const userId = req.session.userId;
    
    db.get('SELECT * FROM cars WHERE id = ? AND user_id = ?', [carId, userId], (err, car) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (!car) {
            return res.status(404).json({ message: 'Car not found or unauthorized' });
        }
        
        // Delete the car
        db.run('DELETE FROM cars WHERE id = ?', [carId], function(err) {
            if (err) {
                console.error('Delete error:', err);
                return res.status(500).json({ message: 'Failed to delete car' });
            }
            
            res.json({ message: 'Car deleted successfully' });
        });
    });
});

app.post('/api/favorites/:carId', requireAuth, (req, res) => {
    const carId = req.params.carId;
    const userId = req.session.userId;
    
    db.run('INSERT OR IGNORE INTO favorites (user_id, car_id) VALUES (?, ?)', 
        [userId, carId], function(err) {
        if (err) {
            console.error('Favorites error:', err);
            return res.status(500).json({ message: 'Failed to add to favorites' });
        }
        res.json({ message: 'Added to favorites' });
    });
});

app.delete('/api/favorites/:carId', requireAuth, (req, res) => {
    const carId = req.params.carId;
    const userId = req.session.userId;
    
    db.run('DELETE FROM favorites WHERE user_id = ? AND car_id = ?', 
        [userId, carId], function(err) {
        if (err) {
            console.error('Favorites error:', err);
            return res.status(500).json({ message: 'Failed to remove from favorites' });
        }
        res.json({ message: 'Removed from favorites' });
    });
});

app.get('/api/favorites', requireAuth, (req, res) => {
    const userId = req.session.userId;
    
    db.all(`SELECT c.*, f.created_at as favorited_at 
            FROM cars c 
            JOIN favorites f ON c.id = f.car_id 
            WHERE f.user_id = ? 
            ORDER BY f.created_at DESC`, 
        [userId], (err, rows) => {
        if (err) {
            console.error('Favorites error:', err);
            return res.status(500).json({ message: 'Failed to get favorites' });
        }
        
        const cars = rows.map(car => ({
            ...car,
            features: car.features ? JSON.parse(car.features) : [],
            images: car.images ? JSON.parse(car.images) : []
        }));
        
        res.json(cars);
    });
});

// Reviews endpoints
app.post('/api/reviews', requireAuth, (req, res) => {
    const { reviewed_user_id, car_id, rating, comment } = req.body;
    const reviewer_id = req.session.userId;
    
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    db.run(`INSERT INTO reviews (reviewer_id, reviewed_user_id, car_id, rating, comment) 
            VALUES (?, ?, ?, ?, ?)`, 
        [reviewer_id, reviewed_user_id, car_id, rating, comment], function(err) {
        if (err) {
            console.error('Review error:', err);
            return res.status(500).json({ message: 'Failed to add review' });
        }
        res.json({ message: 'Review added successfully', id: this.lastID });
    });
});

app.get('/api/reviews/user/:userId', (req, res) => {
    const userId = req.params.userId;
    
    db.all(`SELECT r.*, u.name as reviewer_name, c.make, c.model 
            FROM reviews r 
            JOIN users u ON r.reviewer_id = u.id 
            LEFT JOIN cars c ON r.car_id = c.id 
            WHERE r.reviewed_user_id = ? 
            ORDER BY r.created_at DESC`, 
        [userId], (err, reviews) => {
        if (err) {
            console.error('Reviews error:', err);
            return res.status(500).json({ message: 'Failed to get reviews' });
        }
        res.json(reviews);
    });
});

// User profile endpoints
app.put('/api/user/profile', requireAuth, upload.single('profile_picture'), (req, res) => {
    const userId = req.session.userId;
    const { name, phone } = req.body;
    let profile_picture = null;
    
    if (req.file) {
        profile_picture = req.file.filename;
    }
    
    let sql = 'UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [name, phone];
    
    if (profile_picture) {
        sql += ', profile_picture = ?';
        params.push(profile_picture);
    }
    
    sql += ' WHERE id = ?';
    params.push(userId);
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('Profile update error:', err);
            return res.status(500).json({ message: 'Failed to update profile' });
        }
        res.json({ message: 'Profile updated successfully' });
    });
});

app.put('/api/user/password', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        db.run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
            [hashedPassword, userId], function(err) {
            if (err) {
                console.error('Password update error:', err);
                return res.status(500).json({ message: 'Failed to update password' });
            }
            res.json({ message: 'Password updated successfully' });
        });
    });
});

app.post('/api/saved-searches', requireAuth, (req, res) => {
    const userId = req.session.userId;
    const { search_name, search_criteria, email_alerts } = req.body;
    
    db.run(`INSERT INTO saved_searches (user_id, search_name, search_criteria, email_alerts) 
            VALUES (?, ?, ?, ?)`, 
        [userId, search_name, JSON.stringify(search_criteria), email_alerts], function(err) {
        if (err) {
            console.error('Saved search error:', err);
            return res.status(500).json({ message: 'Failed to save search' });
        }
        res.json({ message: 'Search saved successfully', id: this.lastID });
    });
});

app.get('/api/saved-searches', requireAuth, (req, res) => {
    const userId = req.session.userId;
    
    db.all('SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC', 
        [userId], (err, searches) => {
        if (err) {
            console.error('Saved searches error:', err);
            return res.status(500).json({ message: 'Failed to get saved searches' });
        }
        
        const parsedSearches = searches.map(search => ({
            ...search,
            search_criteria: JSON.parse(search.search_criteria)
        }));
        
        res.json(parsedSearches);
    });
});

app.delete('/api/saved-searches/:id', requireAuth, (req, res) => {
    const searchId = req.params.id;
    const userId = req.session.userId;
    
    db.run('DELETE FROM saved_searches WHERE id = ? AND user_id = ?', 
        [searchId, userId], function(err) {
        if (err) {
            console.error('Delete saved search error:', err);
            return res.status(500).json({ message: 'Failed to delete saved search' });
        }
        res.json({ message: 'Saved search deleted successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});