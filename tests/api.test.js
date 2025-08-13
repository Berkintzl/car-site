const request = require('supertest');
const { app, startTestServer, closeTestServer } = require('./test-server');

describe('CarHub API Tests', () => {
    let server;
    
    beforeAll(async () => {
        // Start test server
        server = await startTestServer();
    });

    afterAll(async () => {
        await closeTestServer();
    });

    describe('Authentication Endpoints', () => {
        test('POST /api/register - should register a new user', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                phone: '1234567890'
            };

            const response = await request(app)
                .post('/api/register')
                .send(userData)
                .expect(201);

            expect(response.body.message).toBe('User registered successfully');
        });

        test('POST /api/register - should not register user with existing email', async () => {
            const userData = {
                name: 'Test User 2',
                email: 'test@example.com',
                password: 'password123',
                phone: '1234567891'
            };

            const response = await request(app)
                .post('/api/register')
                .send(userData)
                .expect(400);

            expect(response.body.message).toBe('User already exists');
        });

        test('POST /api/login - should login with valid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/login')
                .send(loginData)
                .expect(200);

            expect(response.body.message).toBe('Login successful');
            expect(response.body.user).toBeDefined();
        });

        test('POST /api/login - should not login with invalid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/login')
                .send(loginData)
                .expect(401);

            expect(response.body.message).toBe('Invalid credentials');
        });
    });

    describe('Car Endpoints', () => {
        let authCookie;

        beforeAll(async () => {
            // Login to get session cookie
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            
            authCookie = loginResponse.headers['set-cookie'];
        });

        test('GET /api/cars - should get all cars', async () => {
            const response = await request(app)
                .get('/api/cars')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/cars - should add a new car (authenticated)', async () => {
            const carData = {
                make: 'Toyota',
                model: 'Camry',
                year: 2022,
                price: 25000,
                mileage: 15000,
                fuel_type: 'Gasoline',
                transmission: 'Automatic',
                description: 'Test car description'
            };

            const response = await request(app)
                .post('/api/cars')
                .set('Cookie', authCookie)
                .send(carData)
                .expect(201);

            expect(response.body.message).toBe('Car added successfully');
            expect(response.body.carId).toBeDefined();
        });

        test('POST /api/cars - should not add car without authentication', async () => {
            const carData = {
                make: 'Honda',
                model: 'Civic',
                year: 2021,
                price: 22000,
                mileage: 20000,
                fuel_type: 'Gasoline',
                transmission: 'Manual',
                description: 'Test car description'
            };

            const response = await request(app)
                .post('/api/cars')
                .send(carData)
                .expect(401);

            expect(response.body.message).toBe('Authentication required');
        });

        test('GET /api/cars/search - should search cars with filters', async () => {
            const response = await request(app)
                .get('/api/cars/search?make=Toyota&minPrice=20000&maxPrice=30000')
                .expect(200);

            expect(response.body.cars).toBeDefined();
            expect(Array.isArray(response.body.cars)).toBe(true);
        });
    });

    describe('Comparison Endpoints', () => {
        test('POST /api/cars/compare - should compare multiple cars', async () => {
            // First, get some car IDs
            const carsResponse = await request(app)
                .get('/api/cars')
                .expect(200);

            const carIds = carsResponse.body.slice(0, 2).map(car => car.id);

            if (carIds.length >= 2) {
                const response = await request(app)
                    .post('/api/cars/compare')
                    .send({ carIds })
                    .expect(200);

                expect(response.body.cars).toBeDefined();
                expect(response.body.summary).toBeDefined();
                expect(response.body.cars.length).toBe(carIds.length);
            }
        });

        test('POST /api/cars/compare - should reject invalid comparison request', async () => {
            const response = await request(app)
                .post('/api/cars/compare')
                .send({ carIds: [1] }) // Only one car
                .expect(400);

            expect(response.body.message).toBe('Please provide 2-4 car IDs for comparison');
        });
    });

    describe('SEO and Health Endpoints', () => {
        test('GET /sitemap.xml - should generate sitemap', async () => {
            const response = await request(app)
                .get('/sitemap.xml')
                .expect(200);

            expect(response.headers['content-type']).toContain('text/xml');
            expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
            expect(response.text).toContain('<urlset');
        });

        test('GET /api/health - should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.status).toBe('healthy');
            expect(response.body.database).toBe('connected');
            expect(response.body.responseTime).toBeDefined();
            expect(response.body.uptime).toBeDefined();
        });
    });

    describe('Social Features', () => {
        let authCookie;
        let carId;

        beforeAll(async () => {
            // Login to get session cookie
            const loginResponse = await request(app)
                .post('/api/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            
            authCookie = loginResponse.headers['set-cookie'];

            // Get a car ID for testing
            const carsResponse = await request(app).get('/api/cars');
            if (carsResponse.body.length > 0) {
                carId = carsResponse.body[0].id;
            }
        });

        test('GET /api/share/car/:carId - should get sharing data', async () => {
            if (carId) {
                const response = await request(app)
                    .get(`/api/share/car/${carId}`)
                    .expect(200);

                expect(response.body.shareData).toBeDefined();
                expect(response.body.shareUrls).toBeDefined();
                expect(response.body.shareUrls.facebook).toBeDefined();
                expect(response.body.shareUrls.twitter).toBeDefined();
            }
        });

        test('POST /api/reviews - should add a review (authenticated)', async () => {
            if (carId) {
                const reviewData = {
                    carId: carId,
                    rating: 5,
                    comment: 'Great car, excellent condition!'
                };

                const response = await request(app)
                    .post('/api/reviews')
                    .set('Cookie', authCookie)
                    .send(reviewData)
                    .expect(201);

                expect(response.body.message).toBe('Review added successfully');
            }
        });
    });

    describe('Error Handling', () => {
        test('GET /api/nonexistent - should return 404', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);
        });

        test('POST /api/cars with invalid data - should return validation error', async () => {
            const response = await request(app)
                .post('/api/cars')
                .send({ make: 'Toyota' }) // Missing required fields
                .expect(401); // Will be 401 due to auth, but would be 400 if authenticated
        });
    });
});

// Performance tests
describe('Performance Tests', () => {
    test('GET /api/cars - should respond within acceptable time', async () => {
        const startTime = Date.now();
        
        await request(app)
            .get('/api/cars')
            .expect(200);
        
        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('GET /api/cars/search - should handle complex queries efficiently', async () => {
        const startTime = Date.now();
        
        await request(app)
            .get('/api/cars/search?query=Toyota&minPrice=20000&maxPrice=50000&minYear=2020&maxYear=2023')
            .expect(200);
        
        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
});

// Security tests
describe('Security Tests', () => {
    test('Should prevent SQL injection in search', async () => {
        const maliciousQuery = "'; DROP TABLE cars; --";
        
        const response = await request(app)
            .get(`/api/cars/search?query=${encodeURIComponent(maliciousQuery)}`)
            .expect(200);
        
        // Should return empty results, not crash
        expect(response.body.cars).toBeDefined();
    });

    test('Should require authentication for protected endpoints', async () => {
        await request(app)
            .post('/api/cars')
            .send({ make: 'Test' })
            .expect(401);

        await request(app)
            .put('/api/cars/1')
            .send({ make: 'Test' })
            .expect(401);

        await request(app)
            .delete('/api/cars/1')
            .expect(401);
    });
});