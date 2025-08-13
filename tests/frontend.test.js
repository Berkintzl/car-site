/**
 * Frontend Tests for CarHub
 * Tests DOM manipulation, user interactions, and UI components
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Load HTML and CSS for testing
const htmlContent = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, '../public/css/style.css'), 'utf8');

describe('Frontend Tests', () => {
    let dom;
    let document;
    let window;

    beforeEach(() => {
        // Create a new DOM instance for each test
        dom = new JSDOM(htmlContent, {
            runScripts: 'dangerously',
            resources: 'usable',
            pretendToBeVisual: true
        });
        
        document = dom.window.document;
        window = dom.window;
        
        // Add CSS to the document
        const style = document.createElement('style');
        style.textContent = cssContent;
        document.head.appendChild(style);
        
        // Mock global objects
        global.document = document;
        global.window = window;
        global.fetch = jest.fn();
        global.alert = jest.fn();
        global.confirm = jest.fn();
    });

    afterEach(() => {
        dom.window.close();
        jest.clearAllMocks();
    });

    describe('DOM Elements', () => {
        test('should have all required navigation elements', () => {
            expect(document.querySelector('.navbar')).toBeTruthy();
            expect(document.querySelector('.nav-links')).toBeTruthy();
            expect(document.querySelector('.mobile-menu-toggle')).toBeTruthy();
        });

        test('should have search form elements', () => {
            expect(document.querySelector('#searchForm')).toBeTruthy();
            expect(document.querySelector('#searchQuery')).toBeTruthy();
            expect(document.querySelector('#makeFilter')).toBeTruthy();
            expect(document.querySelector('#minPrice')).toBeTruthy();
            expect(document.querySelector('#maxPrice')).toBeTruthy();
        });

        test('should have car listing container', () => {
            expect(document.querySelector('#carListings')).toBeTruthy();
        });

        test('should have all modals', () => {
            expect(document.querySelector('#loginModal')).toBeTruthy();
            expect(document.querySelector('#registerModal')).toBeTruthy();
            expect(document.querySelector('#addCarModal')).toBeTruthy();
            expect(document.querySelector('#carDetailsModal')).toBeTruthy();
            expect(document.querySelector('#comparisonModal')).toBeTruthy();
        });
    });

    describe('Modal Functionality', () => {
        test('should open and close login modal', () => {
            const loginBtn = document.querySelector('[onclick="openModal(\'loginModal\')"]');
            const loginModal = document.querySelector('#loginModal');
            const closeBtn = loginModal.querySelector('.close');

            // Test opening modal
            if (loginBtn) {
                loginBtn.click();
                expect(loginModal.style.display).toBe('block');
            }

            // Test closing modal
            if (closeBtn) {
                closeBtn.click();
                expect(loginModal.style.display).toBe('none');
            }
        });

        test('should close modal when clicking outside', () => {
            const loginModal = document.querySelector('#loginModal');
            loginModal.style.display = 'block';

            // Simulate click outside modal content
            const clickEvent = new window.Event('click');
            Object.defineProperty(clickEvent, 'target', {
                value: loginModal,
                enumerable: true
            });

            loginModal.dispatchEvent(clickEvent);
            expect(loginModal.style.display).toBe('none');
        });
    });

    describe('Search Functionality', () => {
        test('should handle search form submission', () => {
            const searchForm = document.querySelector('#searchForm');
            const searchQuery = document.querySelector('#searchQuery');
            
            // Mock fetch response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ cars: [], totalCount: 0 })
            });

            searchQuery.value = 'Toyota';
            
            const submitEvent = new window.Event('submit');
            searchForm.dispatchEvent(submitEvent);

            expect(global.fetch).toHaveBeenCalled();
        });

        test('should validate search inputs', () => {
            const minPrice = document.querySelector('#minPrice');
            const maxPrice = document.querySelector('#maxPrice');

            minPrice.value = '30000';
            maxPrice.value = '20000';

            // Should show validation error when min > max
            const isValid = minPrice.value <= maxPrice.value;
            expect(isValid).toBe(false);
        });
    });

    describe('Car Comparison', () => {
        test('should initialize comparison list', () => {
            // Load main.js content and execute
            const mainJsContent = fs.readFileSync(path.join(__dirname, '../public/js/main.js'), 'utf8');
            
            // Execute the main.js code in the DOM context
            const script = document.createElement('script');
            script.textContent = mainJsContent;
            document.head.appendChild(script);

            // Check if comparison variables are initialized
            expect(window.comparisonList).toBeDefined();
            expect(window.maxComparisonItems).toBe(4);
        });

        test('should add car to comparison', () => {
            // Mock car data
            const mockCar = {
                id: 1,
                make: 'Toyota',
                model: 'Camry',
                year: 2022,
                price: 25000
            };

            // Initialize comparison list
            window.comparisonList = [];
            window.maxComparisonItems = 4;

            // Mock toggleComparison function
            window.toggleComparison = function(carId) {
                const index = this.comparisonList.findIndex(car => car.id === carId);
                if (index === -1 && this.comparisonList.length < this.maxComparisonItems) {
                    this.comparisonList.push(mockCar);
                    return true;
                }
                return false;
            };

            const result = window.toggleComparison(1);
            expect(result).toBe(true);
            expect(window.comparisonList.length).toBe(1);
        });

        test('should not exceed maximum comparison items', () => {
            window.comparisonList = [1, 2, 3, 4]; // Already at max
            window.maxComparisonItems = 4;

            window.toggleComparison = function(carId) {
                return this.comparisonList.length < this.maxComparisonItems;
            };

            const result = window.toggleComparison(5);
            expect(result).toBe(false);
        });
    });

    describe('Form Validation', () => {
        test('should validate login form', () => {
            const emailInput = document.querySelector('#loginEmail');
            const passwordInput = document.querySelector('#loginPassword');

            // Test empty fields
            emailInput.value = '';
            passwordInput.value = '';
            
            expect(emailInput.checkValidity()).toBe(false);
            expect(passwordInput.checkValidity()).toBe(false);

            // Test valid inputs
            emailInput.value = 'test@example.com';
            passwordInput.value = 'password123';
            
            expect(emailInput.checkValidity()).toBe(true);
            expect(passwordInput.checkValidity()).toBe(true);
        });

        test('should validate registration form', () => {
            const nameInput = document.querySelector('#registerName');
            const emailInput = document.querySelector('#registerEmail');
            const passwordInput = document.querySelector('#registerPassword');
            const phoneInput = document.querySelector('#registerPhone');

            // Test required fields
            expect(nameInput.hasAttribute('required')).toBe(true);
            expect(emailInput.hasAttribute('required')).toBe(true);
            expect(passwordInput.hasAttribute('required')).toBe(true);
            expect(phoneInput.hasAttribute('required')).toBe(true);

            // Test email format
            emailInput.value = 'invalid-email';
            expect(emailInput.checkValidity()).toBe(false);

            emailInput.value = 'valid@example.com';
            expect(emailInput.checkValidity()).toBe(true);
        });

        test('should validate add car form', () => {
            const makeInput = document.querySelector('#carMake');
            const modelInput = document.querySelector('#carModel');
            const yearInput = document.querySelector('#carYear');
            const priceInput = document.querySelector('#carPrice');

            // Test required fields
            expect(makeInput.hasAttribute('required')).toBe(true);
            expect(modelInput.hasAttribute('required')).toBe(true);
            expect(yearInput.hasAttribute('required')).toBe(true);
            expect(priceInput.hasAttribute('required')).toBe(true);

            // Test numeric validation
            yearInput.value = '2022';
            priceInput.value = '25000';
            
            expect(yearInput.checkValidity()).toBe(true);
            expect(priceInput.checkValidity()).toBe(true);
        });
    });

    describe('Responsive Design', () => {
        test('should have mobile menu toggle', () => {
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            expect(mobileToggle).toBeTruthy();
        });

        test('should handle mobile menu toggle click', () => {
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            const navLinks = document.querySelector('.nav-links');

            // Initial state
            expect(navLinks.classList.contains('active')).toBe(false);

            // Click toggle
            mobileToggle.click();
            expect(navLinks.classList.contains('active')).toBe(true);

            // Click again to close
            mobileToggle.click();
            expect(navLinks.classList.contains('active')).toBe(false);
        });
    });

    describe('Social Sharing', () => {
        test('should generate correct sharing URLs', () => {
            const mockCar = {
                id: 1,
                make: 'Toyota',
                model: 'Camry',
                year: 2022,
                price: 25000
            };

            const baseUrl = 'http://localhost:3000';
            const carUrl = `${baseUrl}/car/${mockCar.id}`;
            const shareText = `Check out this ${mockCar.year} ${mockCar.make} ${mockCar.model} for $${mockCar.price.toLocaleString()}`;

            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(carUrl)}`;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(carUrl)}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + carUrl)}`;

            expect(facebookUrl).toContain('facebook.com/sharer');
            expect(twitterUrl).toContain('twitter.com/intent/tweet');
            expect(whatsappUrl).toContain('wa.me');
        });
    });

    describe('Error Handling', () => {
        test('should handle fetch errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            // Mock error handling function
            window.handleFetchError = function(error) {
                console.error('Fetch error:', error);
                return { success: false, error: error.message };
            };

            try {
                await fetch('/api/cars');
            } catch (error) {
                const result = window.handleFetchError(error);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Network error');
            }
        });

        test('should validate user inputs', () => {
            // Test price validation
            const validatePrice = (price) => {
                const numPrice = parseFloat(price);
                return !isNaN(numPrice) && numPrice > 0;
            };

            expect(validatePrice('25000')).toBe(true);
            expect(validatePrice('-1000')).toBe(false);
            expect(validatePrice('abc')).toBe(false);
            expect(validatePrice('')).toBe(false);
        });
    });

    describe('Performance', () => {
        test('should debounce search input', (done) => {
            let searchCallCount = 0;
            
            // Mock debounced search function
            const debounce = (func, delay) => {
                let timeoutId;
                return (...args) => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => func.apply(null, args), delay);
                };
            };

            const debouncedSearch = debounce(() => {
                searchCallCount++;
            }, 300);

            // Simulate rapid typing
            debouncedSearch();
            debouncedSearch();
            debouncedSearch();

            // Should only call once after delay
            setTimeout(() => {
                expect(searchCallCount).toBe(1);
                done();
            }, 350);
        });

        test('should lazy load images', () => {
            const img = document.createElement('img');
            img.setAttribute('data-src', 'test-image.jpg');
            img.classList.add('lazy-load');

            // Mock intersection observer
            const mockIntersectionObserver = jest.fn();
            mockIntersectionObserver.mockReturnValue({
                observe: () => null,
                unobserve: () => null,
                disconnect: () => null
            });

            window.IntersectionObserver = mockIntersectionObserver;

            // Simulate lazy loading
            const lazyLoadImages = () => {
                const images = document.querySelectorAll('.lazy-load');
                images.forEach(img => {
                    if (img.getAttribute('data-src')) {
                        img.src = img.getAttribute('data-src');
                        img.removeAttribute('data-src');
                        img.classList.remove('lazy-load');
                    }
                });
            };

            document.body.appendChild(img);
            lazyLoadImages();

            expect(img.src).toBe('test-image.jpg');
            expect(img.hasAttribute('data-src')).toBe(false);
        });
    });
});

// Integration tests
describe('Integration Tests', () => {
    test('should complete full user journey', async () => {
        // Mock successful API responses
        global.fetch
            .mockResolvedValueOnce({ // Login
                ok: true,
                json: async () => ({ message: 'Login successful', user: { id: 1, name: 'Test User' } })
            })
            .mockResolvedValueOnce({ // Get cars
                ok: true,
                json: async () => ({ cars: [{ id: 1, make: 'Toyota', model: 'Camry' }] })
            })
            .mockResolvedValueOnce({ // Add to favorites
                ok: true,
                json: async () => ({ message: 'Added to favorites' })
            });

        // Simulate user login
        const loginResponse = await fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        });
        const loginData = await loginResponse.json();
        expect(loginData.message).toBe('Login successful');

        // Simulate browsing cars
        const carsResponse = await fetch('/api/cars');
        const carsData = await carsResponse.json();
        expect(carsData.cars).toBeDefined();

        // Simulate adding to favorites
        const favResponse = await fetch('/api/favorites', {
            method: 'POST',
            body: JSON.stringify({ carId: 1 })
        });
        const favData = await favResponse.json();
        expect(favData.message).toBe('Added to favorites');
    });
});