const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const multer = require('multer');

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
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Cars table
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
        description TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Insert sample cars
    insertSampleCars();
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
            description: 'Excellent condition, well maintained'
        },
        {
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            price: 24000,
            mileage: 22000,
            fuel_type: 'Gasoline',
            transmission: 'Manual',
            description: 'Sporty and fuel efficient'
        },
        {
            make: 'BMW',
            model: 'X5',
            year: 2023,
            price: 65000,
            mileage: 8000,
            fuel_type: 'Gasoline',
            transmission: 'Automatic',
            description: 'Luxury SUV with premium features'
        },
        {
            make: 'Tesla',
            model: 'Model 3',
            year: 2022,
            price: 45000,
            mileage: 12000,
            fuel_type: 'Electric',
            transmission: 'Automatic',
            description: 'Electric vehicle with autopilot'
        }
    ];

    // Check if cars already exist
    db.get('SELECT COUNT(*) as count FROM cars', (err, row) => {
        if (err) {
            console.error('Error checking cars:', err);
            return;
        }
        
        if (row.count === 0) {
            const stmt = db.prepare(`INSERT INTO cars (make, model, year, price, mileage, fuel_type, transmission, description) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            
            sampleCars.forEach(car => {
                stmt.run([car.make, car.model, car.year, car.price, car.mileage, car.fuel_type, car.transmission, car.description]);
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
    const query = req.query.q;
    
    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }
    
    const searchQuery = `%${query}%`;
    
    db.all(`SELECT * FROM cars 
            WHERE make LIKE ? OR model LIKE ? OR description LIKE ?
            ORDER BY created_at DESC`, 
        [searchQuery, searchQuery, searchQuery], 
        (err, cars) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            
            res.json(cars);
        }
    );
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
    
    // First check if car exists and belongs to user
    db.get('SELECT * FROM cars WHERE id = ? AND user_id = ?', [carId, userId], (err, car) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (!car) {
            return res.status(404).json({ message: 'Car not found or unauthorized' });
        }
        
        // Delete car
        db.run('DELETE FROM cars WHERE id = ?', [carId], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Error deleting car' });
            }
            
            res.json({ message: 'Car deleted successfully' });
        });
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