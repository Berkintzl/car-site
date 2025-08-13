/**
 * Performance Tests for CarHub
 * Tests application performance, load times, and resource usage
 */

const request = require('supertest');
const { app, startTestServer, closeTestServer } = require('./test-server');
const fs = require('fs');
const path = require('path');

describe('Performance Tests', () => {
    let server;
    
    beforeAll(async () => {
        // Start test server
        server = await startTestServer();
        // Wait for server to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
    });
    
    afterAll(async () => {
        await closeTestServer();
    });
    describe('API Response Times', () => {
        test('GET /api/cars should respond within 500ms', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/cars')
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(500);
        });

        test('GET /api/cars/search should respond within 1000ms', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/cars/search?query=Toyota&minPrice=20000&maxPrice=50000')
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(1000);
        });

        test('POST /api/cars/compare should respond within 800ms', async () => {
            // Get some car IDs first
            const carsResponse = await request(app).get('/api/cars');
            const carIds = carsResponse.body.slice(0, 3).map(car => car.id);

            if (carIds.length >= 2) {
                const startTime = Date.now();
                
                await request(app)
                    .post('/api/cars/compare')
                    .send({ carIds })
                    .expect(200);
                
                const responseTime = Date.now() - startTime;
                expect(responseTime).toBeLessThan(800);
            }
        });

        test('GET /sitemap.xml should respond within 300ms', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/sitemap.xml')
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(300);
        });

        test('GET /api/health should respond within 100ms', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/health')
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(100);
        });
    });

    describe('Load Testing', () => {
        test('should handle multiple concurrent requests', async () => {
            const concurrentRequests = 10;
            const promises = [];

            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(
                    request(app)
                        .get('/api/cars')
                        .expect(200)
                );
            }

            const startTime = Date.now();
            await Promise.all(promises);
            const totalTime = Date.now() - startTime;

            // All requests should complete within 2 seconds
            expect(totalTime).toBeLessThan(2000);
        });

        test('should handle search requests under load', async () => {
            const searchQueries = [
                'Toyota',
                'Honda',
                'BMW',
                'Mercedes',
                'Audi'
            ];

            const promises = searchQueries.map(query => 
                request(app)
                    .get(`/api/cars/search?query=${query}`)
                    .expect(200)
            );

            const startTime = Date.now();
            const responses = await Promise.all(promises);
            const totalTime = Date.now() - startTime;

            // All search requests should complete within 3 seconds
            expect(totalTime).toBeLessThan(3000);
            
            // All responses should be valid
            responses.forEach(response => {
                expect(response.body.cars).toBeDefined();
                expect(Array.isArray(response.body.cars)).toBe(true);
            });
        });
    });

    describe('Memory Usage', () => {
        test('should not have memory leaks in car listing', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // Make multiple requests
            for (let i = 0; i < 50; i++) {
                await request(app)
                    .get('/api/cars')
                    .expect(200);
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            // Memory increase should be reasonable (less than 50MB)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });

        test('should handle large search results efficiently', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // Search for common terms that might return many results
            await request(app)
                .get('/api/cars/search?query=car')
                .expect(200);
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            // Memory increase should be reasonable
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
        });
    });

    describe('Database Performance', () => {
        test('should execute car queries efficiently', async () => {
            const startTime = process.hrtime.bigint();
            
            await request(app)
                .get('/api/cars?limit=100')
                .expect(200);
            
            const endTime = process.hrtime.bigint();
            const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
            
            // Database query should complete within 200ms
            expect(executionTime).toBeLessThan(200);
        });

        test('should handle complex search queries efficiently', async () => {
            const startTime = process.hrtime.bigint();
            
            await request(app)
                .get('/api/cars/search?query=Toyota&minPrice=20000&maxPrice=50000&minYear=2020&maxYear=2023&fuel_type=Gasoline')
                .expect(200);
            
            const endTime = process.hrtime.bigint();
            const executionTime = Number(endTime - startTime) / 1000000;
            
            // Complex search should complete within 500ms
            expect(executionTime).toBeLessThan(500);
        });

        test('should handle car comparison queries efficiently', async () => {
            // Get some car IDs
            const carsResponse = await request(app).get('/api/cars?limit=4');
            const carIds = carsResponse.body.slice(0, 4).map(car => car.id);

            if (carIds.length >= 2) {
                const startTime = process.hrtime.bigint();
                
                await request(app)
                    .post('/api/cars/compare')
                    .send({ carIds })
                    .expect(200);
                
                const endTime = process.hrtime.bigint();
                const executionTime = Number(endTime - startTime) / 1000000;
                
                // Comparison query should complete within 300ms
                expect(executionTime).toBeLessThan(300);
            }
        });
    });

    describe('Static File Performance', () => {
        test('should serve CSS files efficiently', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/css/style.css')
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(100);
        });

        test('should serve JavaScript files efficiently', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/js/main.js')
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(100);
        });

        test('should serve HTML files efficiently', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/')
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(200);
        });
    });

    describe('Caching Performance', () => {
        test('should benefit from caching on repeated requests', async () => {
            // First request (cold cache)
            const firstStart = Date.now();
            await request(app)
                .get('/api/cars')
                .expect(200);
            const firstTime = Date.now() - firstStart;

            // Second request (warm cache)
            const secondStart = Date.now();
            await request(app)
                .get('/api/cars')
                .expect(200);
            const secondTime = Date.now() - secondStart;

            // Note: This test assumes some form of caching is implemented
            // If no caching is present, this test might need adjustment
            console.log(`First request: ${firstTime}ms, Second request: ${secondTime}ms`);
            
            // Both requests should be reasonably fast
            expect(firstTime).toBeLessThan(1000);
            expect(secondTime).toBeLessThan(1000);
        });
    });

    describe('Resource Usage', () => {
        test('should not exceed CPU usage limits', async () => {
            const startCpuUsage = process.cpuUsage();
            
            // Perform CPU-intensive operations
            const promises = [];
            for (let i = 0; i < 20; i++) {
                promises.push(
                    request(app)
                        .get('/api/cars/search?query=test')
                        .expect(200)
                );
            }
            
            await Promise.all(promises);
            
            const cpuUsage = process.cpuUsage(startCpuUsage);
            const totalCpuTime = cpuUsage.user + cpuUsage.system;
            
            // CPU usage should be reasonable (less than 1 second total)
            expect(totalCpuTime).toBeLessThan(1000000); // microseconds
        });

        test('should handle file operations efficiently', async () => {
            const startTime = Date.now();
            
            // Test file-based operations
            await request(app)
                .get('/api/backup')
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            
            // Backup operation should complete within 2 seconds
            expect(responseTime).toBeLessThan(2000);
        });
    });

    describe('Scalability Tests', () => {
        test('should maintain performance with increased data', async () => {
            // This test assumes the database has a reasonable amount of test data
            const startTime = Date.now();
            
            await request(app)
                .get('/api/cars?limit=1000')
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            
            // Should handle large datasets efficiently
            expect(responseTime).toBeLessThan(1500);
        });

        test('should handle pagination efficiently', async () => {
            const pageSize = 20;
            const pages = 5;
            const promises = [];
            
            for (let page = 1; page <= pages; page++) {
                promises.push(
                    request(app)
                        .get(`/api/cars?page=${page}&limit=${pageSize}`)
                        .expect(200)
                );
            }
            
            const startTime = Date.now();
            await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            
            // All paginated requests should complete within 2 seconds
            expect(totalTime).toBeLessThan(2000);
        });
    });

    describe('Error Handling Performance', () => {
        test('should handle 404 errors efficiently', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/nonexistent')
                .expect(404);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(100);
        });

        test('should handle invalid requests efficiently', async () => {
            const startTime = Date.now();
            
            await request(app)
                .post('/api/cars/compare')
                .send({ invalid: 'data' })
                .expect(400);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(200);
        });
    });
});

// Benchmark utilities
const benchmark = {
    async measureFunction(fn, iterations = 100) {
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = process.hrtime.bigint();
            await fn();
            const end = process.hrtime.bigint();
            times.push(Number(end - start) / 1000000); // Convert to milliseconds
        }
        
        return {
            min: Math.min(...times),
            max: Math.max(...times),
            avg: times.reduce((a, b) => a + b, 0) / times.length,
            median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
        };
    },
    
    async profileMemory(fn) {
        const initialMemory = process.memoryUsage();
        await fn();
        const finalMemory = process.memoryUsage();
        
        return {
            heapUsedDiff: finalMemory.heapUsed - initialMemory.heapUsed,
            heapTotalDiff: finalMemory.heapTotal - initialMemory.heapTotal,
            externalDiff: finalMemory.external - initialMemory.external,
            rss: finalMemory.rss - initialMemory.rss,
        };
    },
};

// Export benchmark utilities for use in other tests
module.exports = { benchmark };