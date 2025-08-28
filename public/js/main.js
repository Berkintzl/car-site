// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const filtersModal = document.getElementById('filtersModal');
const dashboardModal = document.getElementById('dashboardModal');
const carModal = document.getElementById('carModal');
const carDetailsModal = document.getElementById('carDetailsModal');
const comparisonModal = document.getElementById('comparisonModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
const logoutBtn = document.getElementById('logoutBtn');
const closeBtns = document.querySelectorAll('.close');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const filtersForm = document.getElementById('filtersForm');
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');
const carForm = document.getElementById('carForm');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const carsGrid = document.getElementById('carsGrid');
const advancedFiltersBtn = document.getElementById('advancedFiltersBtn');
const addCarBtn = document.getElementById('addCarBtn');

// Global variables
let currentUser = null;
let allCars = [];
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let userFavorites = [];
let comparisonList = [];
let maxComparisonItems = 4;

// Notification function
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Header navigation functionality
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const linkText = e.target.textContent.trim();
        
        // Skip login/register/dashboard/favorites/logout/admin panel buttons
        if (['Login', 'Register', 'Dashboard', 'Favorites', 'Logout', 'Admin Panel'].includes(linkText)) {
            return;
        }
        
        e.preventDefault();
        
        // Close mobile menu if open
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        
        // Handle navigation
        switch(linkText) {
            case 'Home':
                scrollToSection('hero');
                break;
            case 'Cars':
                scrollToSection('featuredCars');
                loadCars();
                break;
            case 'About':
                showAboutModal();
                break;
            case 'Contact':
                showContactModal();
                break;
        }
    });
});

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId) || document.querySelector(`.${sectionId}`);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showAboutModal() {
    const aboutModal = document.createElement('div');
    aboutModal.className = 'modal';
    aboutModal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>About CarHub</h2>
            <div class="about-content">
                <p>CarHub is your trusted platform for buying and selling quality cars. We connect car enthusiasts, dealers, and buyers in a secure and user-friendly environment.</p>
                
                <h3>Our Mission</h3>
                <p>To make car buying and selling simple, transparent, and trustworthy for everyone.</p>
                
                <h3>Why Choose CarHub?</h3>
                <ul>
                    <li>✓ Verified listings from trusted sellers</li>
                    <li>✓ Advanced search and filtering options</li>
                    <li>✓ Detailed car information and photos</li>
                    <li>✓ User reviews and ratings</li>
                    <li>✓ Secure messaging system</li>
                    <li>✓ Mobile-friendly platform</li>
                </ul>
                
                <h3>Contact Information</h3>
                <p>Email: info@carhub.com<br>
                Phone: +1 (555) 123-4567<br>
                Address: 123 Car Street, Auto City, AC 12345</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(aboutModal);
    aboutModal.style.display = 'block';
    
    // Close modal functionality
    const closeBtn = aboutModal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(aboutModal);
    });
    
    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            document.body.removeChild(aboutModal);
        }
    });
}

function showContactModal() {
    const contactModal = document.createElement('div');
    contactModal.className = 'modal';
    contactModal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Contact Us</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <h3>Get in Touch</h3>
                    <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
                    
                    <div class="contact-details">
                        <div class="contact-item">
                            <strong>📧 Email:</strong> info@carhub.com
                        </div>
                        <div class="contact-item">
                            <strong>📞 Phone:</strong> +1 (555) 123-4567
                        </div>
                        <div class="contact-item">
                            <strong>📍 Address:</strong> 123 Car Street, Auto City, AC 12345
                        </div>
                        <div class="contact-item">
                            <strong>🕒 Hours:</strong> Mon-Fri 9AM-6PM, Sat 10AM-4PM
                        </div>
                    </div>
                </div>
                
                <div class="contact-form">
                    <h3>Send Message</h3>
                    <form id="contactForm">
                        <div class="form-group">
                            <label for="contactName">Name:</label>
                            <input type="text" id="contactName" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="contactEmail">Email:</label>
                            <input type="email" id="contactEmail" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="contactSubject">Subject:</label>
                            <input type="text" id="contactSubject" name="subject" required>
                        </div>
                        <div class="form-group">
                            <label for="contactMessage">Message:</label>
                            <textarea id="contactMessage" name="message" rows="5" required></textarea>
                        </div>
                        <button type="submit">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(contactModal);
    contactModal.style.display = 'block';
    
    // Close modal functionality
    const closeBtn = contactModal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(contactModal);
    });
    
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            document.body.removeChild(contactModal);
        }
    });
    
    // Contact form functionality
    const contactForm = contactModal.querySelector('#contactForm');
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Thank you for your message! We will get back to you soon.');
                document.body.removeChild(contactModal);
            } else {
                alert(data.message || 'Failed to send message');
            }
        } catch (error) {
             console.error('Contact form error:', error);
             alert('An error occurred while sending your message');
         }
     });
}

// Modal functionality
loginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'block';
});

registerBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.style.display = 'block';
});

dashboardBtn?.addEventListener('click', () => {
    dashboardModal.style.display = 'block';
    loadDashboardData();
});

favoritesBtn?.addEventListener('click', () => {
    if (!currentUser) {
        showNotification('Please login to view favorites', 'warning');
        loginModal.style.display = 'block';
        return;
    }
    dashboardModal.style.display = 'block';
    loadDashboardData();
    // Switch to favorites tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-tab="favorites"]').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById('favoritesTab').classList.add('active');
});

advancedFiltersBtn?.addEventListener('click', () => {
    filtersModal.style.display = 'block';
});

addCarBtn?.addEventListener('click', () => {
    console.log('Add Car button clicked');
    
    // Check if user is logged in
    if (!currentUser) {
        alert('You must log in first to add a car.');
        loginModal.style.display = 'block';
        return;
    }
    
    carModal.style.display = 'block';
    document.getElementById('carModalTitle').textContent = 'Add New Car';
    document.getElementById('carSubmitBtn').textContent = 'Add Car';
    carForm.reset();
});

closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Close modals when clicking outside
carDetailsModal?.addEventListener('click', (e) => {
    if (e.target === carDetailsModal) {
        carDetailsModal.style.display = 'none';
    }
});

comparisonModal?.addEventListener('click', (e) => {
    if (e.target === comparisonModal) {
        comparisonModal.style.display = 'none';
    }
});

// Comparison functionality
function toggleComparison(carId) {
    const index = comparisonList.indexOf(carId);
    
    if (index > -1) {
        // Remove from comparison
        comparisonList.splice(index, 1);
        showNotification('Car removed from comparison', 'info');
    } else {
        // Add to comparison (max 4 items)
        if (comparisonList.length >= maxComparisonItems) {
            showNotification(`You can compare maximum ${maxComparisonItems} cars at once.`, 'warning');
            return;
        }
        comparisonList.push(carId);
        
        if (comparisonList.length === 1) {
            showNotification('Car added to comparison! Select another car to compare.', 'success');
        } else if (comparisonList.length === 2) {
            showNotification('Ready to compare! Click the Compare button or select more cars.', 'success');
            // Auto-open comparison modal when 2 cars are selected
            setTimeout(() => {
                openComparisonModal();
            }, 1500);
        } else {
            showNotification('Car added to comparison!', 'success');
        }
    }
    
    updateComparisonUI();
    displayCars(allCars); // Refresh to update button states
}

function updateComparisonUI() {
    const comparisonCount = comparisonList.length;
    const startComparisonBtn = document.getElementById('startComparison');
    const selectedCarsDiv = document.getElementById('selectedCarsForComparison');
    
    if (comparisonCount > 0) {
        // Show comparison indicator
        let comparisonIndicator = document.getElementById('comparisonIndicator');
        if (!comparisonIndicator) {
            comparisonIndicator = document.createElement('div');
            comparisonIndicator.id = 'comparisonIndicator';
            comparisonIndicator.className = 'comparison-indicator';
            document.body.appendChild(comparisonIndicator);
        }
        
        comparisonIndicator.innerHTML = `
            <div class="comparison-badge">
                <span>${comparisonCount} cars selected</span>
                <button onclick="openComparisonModal()" class="btn btn-primary btn-sm">Compare</button>
                <button onclick="clearComparison()" class="btn btn-outline btn-sm">Clear</button>
            </div>
        `;
        comparisonIndicator.style.display = 'block';
    } else {
        const comparisonIndicator = document.getElementById('comparisonIndicator');
        if (comparisonIndicator) {
            comparisonIndicator.style.display = 'none';
        }
    }
    
    // Update modal content
    if (selectedCarsDiv) {
        if (comparisonCount > 0) {
            const selectedCarsHtml = comparisonList.map(carId => {
                const car = allCars.find(c => c.id === carId);
                return car ? `
                    <div class="selected-car-item">
                        <span>${car.year} ${car.make} ${car.model}</span>
                        <button onclick="toggleComparison(${carId})" class="btn btn-sm btn-outline">Remove</button>
                    </div>
                ` : '';
            }).join('');
            
            selectedCarsDiv.innerHTML = selectedCarsHtml;
        } else {
            selectedCarsDiv.innerHTML = '<p>No cars selected for comparison.</p>';
        }
    }
    
    if (startComparisonBtn) {
        startComparisonBtn.style.display = comparisonCount >= 2 ? 'block' : 'none';
    }
}

function openComparisonModal() {
    comparisonModal.style.display = 'block';
    updateComparisonUI();
}

function clearComparison() {
    comparisonList = [];
    updateComparisonUI();
    displayCars(allCars); // Refresh to update button states
    
    // Hide comparison results
    const comparisonResults = document.getElementById('comparisonResults');
    const comparisonSelector = document.querySelector('.comparison-selector');
    if (comparisonResults && comparisonSelector) {
        comparisonResults.style.display = 'none';
        comparisonSelector.style.display = 'block';
    }
}

async function startComparison() {
    if (comparisonList.length < 2) {
        showNotification('Please select at least 2 cars to compare.', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/cars/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ carIds: comparisonList })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayComparisonResults(data);
        } else {
            alert(data.message || 'Failed to compare cars');
        }
    } catch (error) {
        console.error('Error comparing cars:', error);
        alert('Failed to compare cars');
    }
}

function displayComparisonResults(comparisonData) {
    const comparisonResults = document.getElementById('comparisonResults');
    const comparisonSelector = document.querySelector('.comparison-selector');
    
    if (!comparisonResults || !comparisonSelector) return;
    
    const { cars, summary } = comparisonData;
    
    let html = `
        <div class="comparison-table-container">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Specification</th>
                        ${cars.map(car => `<th>${car.year} ${car.make} ${car.model}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Price</strong></td>
                        ${cars.map(car => `<td class="${car.price === summary.lowestPrice ? 'best-value' : car.price === summary.highestPrice ? 'highest-value' : ''}">
                            $${car.price.toLocaleString()}
                        </td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Mileage</strong></td>
                        ${cars.map(car => `<td class="${car.mileage === summary.lowestMileage ? 'best-value' : car.mileage === summary.highestMileage ? 'highest-value' : ''}">
                            ${car.mileage.toLocaleString()} miles
                        </td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Year</strong></td>
                        ${cars.map(car => `<td class="${car.year === summary.newestYear ? 'best-value' : car.year === summary.oldestYear ? 'highest-value' : ''}">
                            ${car.year}
                        </td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Fuel Type</strong></td>
                        ${cars.map(car => `<td>${car.fuel_type}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Transmission</strong></td>
                        ${cars.map(car => `<td>${car.transmission}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Body Type</strong></td>
                        ${cars.map(car => `<td>${car.body_type}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Color</strong></td>
                        ${cars.map(car => `<td>${car.color}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Doors</strong></td>
                        ${cars.map(car => `<td>${car.doors}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Seats</strong></td>
                        ${cars.map(car => `<td>${car.seats}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Condition</strong></td>
                        ${cars.map(car => `<td>${car.condition_rating}/5</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Price per Mile</strong></td>
                        ${cars.map(car => `<td>$${car.pricePerMile}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Age</strong></td>
                        ${cars.map(car => `<td>${car.ageInYears} years</td>`).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="comparison-summary">
            <h3>Comparison Summary</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="label">Price Range:</span>
                    <span class="value">$${summary.lowestPrice.toLocaleString()} - $${summary.highestPrice.toLocaleString()}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Mileage Range:</span>
                    <span class="value">${summary.lowestMileage.toLocaleString()} - ${summary.highestMileage.toLocaleString()} miles</span>
                </div>
                <div class="summary-item">
                    <span class="label">Year Range:</span>
                    <span class="value">${summary.oldestYear} - ${summary.newestYear}</span>
                </div>
            </div>
        </div>
        
        <div class="comparison-actions">
            <button onclick="clearComparison()" class="btn btn-outline">Start New Comparison</button>
            <button onclick="comparisonModal.style.display = 'none'" class="btn btn-secondary">Close</button>
        </div>
    `;
    
    comparisonResults.innerHTML = html;
    comparisonResults.style.display = 'block';
    comparisonSelector.style.display = 'none';
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        if (tabName === 'favorites') {
            loadUserFavorites();
        } else if (tabName === 'listings') {
            loadUserListings();
        } else if (tabName === 'searches') {
            loadSavedSearches();
        }
    });
});

searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchCars();
    }
});

filtersForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters();
    filtersModal.style.display = 'none';
});

document.getElementById('clearFilters')?.addEventListener('click', () => {
    filtersForm.reset();
    currentFilters = {};
    searchCars();
});

// Form submissions
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Login successful! Welcome back to CarHub.');
            loginModal.style.display = 'none';
            loginForm.reset();
            currentUser = data.user;
            updateNavigation(true);
            loadUserFavorites();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
});

registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    
    // Check if passwords match
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful! Welcome to CarHub. Please login to continue.');
            registerModal.style.display = 'none';
            registerForm.reset();
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration');
    }
});

profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(profileForm);
    
    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Profile updated successfully!');
            currentUser = { ...currentUser, ...data.user };
        } else {
            alert(data.error || 'Profile update failed');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        alert('An error occurred while updating profile');
    }
});

passwordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(passwordForm);
    
    if (formData.get('newPassword') !== formData.get('confirmNewPassword')) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/user/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Password changed successfully!', 'success');
            passwordForm.reset();
        } else {
            showNotification(data.error || 'Password change failed', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showNotification('An error occurred while changing password', 'error');
    }
});

carForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(carForm);
    
    const featuresValue = formData.get('carFeatures') || '';
    const features = featuresValue.split(',').map(f => f.trim()).filter(f => f);
    formData.set('features', JSON.stringify(features));
    
    const submitBtn = document.getElementById('carSubmitBtn');
    const editId = submitBtn?.dataset.editId;
    
    try {
        let response;
        if (editId) {
            // Edit mode - PUT request
            response = await fetch(`/api/cars/${editId}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            // Add mode - POST request
            response = await fetch('/api/cars', {
                method: 'POST',
                body: formData
            });
        }
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(editId ? 'Car updated successfully!' : 'Car added successfully!', 'success');
            carModal.style.display = 'none';
            carForm.reset();
            
            // Reset form to add mode
            if (submitBtn) {
                submitBtn.textContent = 'Add Car';
                delete submitBtn.dataset.editId;
            }
            
            loadCars();
            loadUserListings();
        } else {
            showNotification(data.error || (editId ? 'Failed to update car' : 'Failed to add car'), 'error');
        }
    } catch (error) {
        console.error('Car submission error:', error);
        showNotification(editId ? 'An error occurred while updating car' : 'An error occurred while adding car', 'error');
    }
});

// Search functionality
searchBtn?.addEventListener('click', () => {
    searchCars();
});

async function loadCars() {
    try {
        const response = await fetch('/api/cars');
        const data = await response.json();
        
        if (response.ok) {
            allCars = data || [];
            displayCars(allCars);
        }
    } catch (error) {
        console.error('Error loading cars:', error);
    }
}

async function searchCars() {
    const query = searchInput?.value || '';
    const params = new URLSearchParams({
        q: query,
        page: currentPage,
        ...currentFilters
    });
    
    try {
        const response = await fetch(`/api/cars/search?${params}`);
        const data = await response.json();
        
        if (response.ok) {
            allCars = data.cars || [];
            totalPages = data.totalPages || 1;
            displayCars(allCars);
            updatePagination();
        }
    } catch (error) {
        console.error('Error searching cars:', error);
    }
}

function applyFilters() {
    const formData = new FormData(filtersForm);
    currentFilters = {};
    
    for (let [key, value] of formData.entries()) {
        if (value.trim()) {
            currentFilters[key.replace('Filter', '').replace('min', 'min_').replace('max', 'max_')] = value;
        }
    }
    
    currentPage = 1;
    searchCars();
}

function displayCars(cars) {
    const container = document.getElementById('carsGrid') || document.querySelector('.cars-grid');
    if (!container) return;
    
    if (cars.length === 0) {
        container.innerHTML = '<p>No cars found.</p>';
        return;
    }
    
    container.innerHTML = cars.map(car => {
        const isFavorite = userFavorites.includes(car.id);
        
        return `
            <div class="car-card compact">
                <div class="car-image-container">
                    <img src="${car.image ? '/uploads/' + car.image : '/images/default-car.jpg'}" alt="${car.make} ${car.model}" class="car-image">
                    <button class="favorite-btn-overlay ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${car.id})" title="${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}">
                        ${isFavorite ? '❤️' : '🤍'}
                    </button>
                </div>
                <div class="car-info">
                    <div class="car-header">
                        <div class="car-title">${car.make} ${car.model}</div>
                        <div class="car-year">${car.year}</div>
                    </div>
                    <div class="car-price">$${car.price.toLocaleString()}</div>
                    <div class="car-specs">
                        <span class="spec-item">${car.mileage.toLocaleString()} mi</span>
                        <span class="spec-item">${car.fuel_type}</span>
                        <span class="spec-item">${car.transmission}</span>
                    </div>
                    <div class="car-actions">
                        <button class="btn-primary" onclick="viewCarDetails(${car.id})">View Details</button>
                        <button class="btn-compare ${comparisonList.includes(car.id) ? 'active' : ''}" onclick="toggleComparison(${car.id})" title="${comparisonList.includes(car.id) ? 'Remove from Compare' : 'Add to Compare'}">
                            ⚖️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function viewCarDetails(carId) {
    // Redirect to car details page
    window.location.href = `car-details.html?id=${carId}`;
}

function displayCarDetailsModal(car, reputation, reviews) {
    const modal = document.getElementById('carDetailsModal');
    const content = document.getElementById('carDetailsContent');
    
    const features = car.features ? JSON.parse(car.features) : [];
    const images = car.images ? JSON.parse(car.images) : [];
    
    content.innerHTML = `
        <div class="car-details-header">
            <div class="car-images">
                ${images.length > 0 ? 
                    `<img src="/uploads/${images[0]}" alt="${car.make} ${car.model}" class="main-car-image">` :
                    `<div class="no-image">No Image Available</div>`
                }
            </div>
            <div class="car-info">
                <h2>${car.year} ${car.make} ${car.model}</h2>
                <p class="car-price">$${car.price.toLocaleString()}</p>
                <div class="car-specs">
                    <span><strong>Mileage:</strong> ${car.mileage.toLocaleString()} miles</span>
                    <span><strong>Fuel Type:</strong> ${car.fuel_type}</span>
                    <span><strong>Transmission:</strong> ${car.transmission}</span>
                    <span><strong>Body Type:</strong> ${car.body_type}</span>
                    <span><strong>Color:</strong> ${car.color}</span>
                    <span><strong>Doors:</strong> ${car.doors}</span>
                    <span><strong>Seats:</strong> ${car.seats}</span>
                    <span><strong>Condition:</strong> ${car.condition_rating}/5</span>
                </div>
                ${features.length > 0 ? `
                    <div class="car-features">
                        <h4>Features:</h4>
                        <div class="features-list">
                            ${features.map(feature => `<span class="feature-tag">${feature.trim()}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="car-description">
            <h3>Description</h3>
            <p>${car.description}</p>
        </div>
        
        <div class="seller-info">
            <h3>Seller Information</h3>
            <div class="seller-details">
                <div class="seller-basic">
                    <h4>${car.seller_name}</h4>
                    <p>Phone: ${car.seller_phone || 'Not provided'}</p>
                </div>
                <div class="seller-reputation">
                    <h4>Seller Reputation</h4>
                    <div class="reputation-score">
                        <span class="score">${reputation.reputation_score}/100</span>
                        <div class="stars">
                            ${generateStars(reputation.average_rating || 0)}
                        </div>
                        <span class="rating-text">${reputation.average_rating ? reputation.average_rating.toFixed(1) : '0.0'} (${reputation.total_reviews} reviews)</span>
                    </div>
                    ${reputation.total_reviews > 0 ? `
                        <div class="rating-breakdown">
                            <div class="rating-bar">
                                <span>5★</span>
                                <div class="bar"><div class="fill" style="width: ${(reputation.five_star / reputation.total_reviews) * 100}%"></div></div>
                                <span>${reputation.five_star}</span>
                            </div>
                            <div class="rating-bar">
                                <span>4★</span>
                                <div class="bar"><div class="fill" style="width: ${(reputation.four_star / reputation.total_reviews) * 100}%"></div></div>
                                <span>${reputation.four_star}</span>
                            </div>
                            <div class="rating-bar">
                                <span>3★</span>
                                <div class="bar"><div class="fill" style="width: ${(reputation.three_star / reputation.total_reviews) * 100}%"></div></div>
                                <span>${reputation.three_star}</span>
                            </div>
                            <div class="rating-bar">
                                <span>2★</span>
                                <div class="bar"><div class="fill" style="width: ${(reputation.two_star / reputation.total_reviews) * 100}%"></div></div>
                                <span>${reputation.two_star}</span>
                            </div>
                            <div class="rating-bar">
                                <span>1★</span>
                                <div class="bar"><div class="fill" style="width: ${(reputation.one_star / reputation.total_reviews) * 100}%"></div></div>
                                <span>${reputation.one_star}</span>
                            </div>
                        </div>
                    ` : '<p>No reviews yet</p>'}
                </div>
            </div>
        </div>
        
        ${reviews.length > 0 ? `
            <div class="seller-reviews">
                <h3>Recent Reviews</h3>
                <div class="reviews-list">
                    ${reviews.slice(0, 3).map(review => `
                        <div class="review-item">
                            <div class="review-header">
                                <span class="reviewer-name">${review.reviewer_name}</span>
                                <div class="review-rating">${generateStars(review.rating)}</div>
                                <span class="review-date">${new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                            ${review.comment ? `<p class="review-comment">${review.comment}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="car-actions">
            <div class="action-buttons">
                <button class="btn-primary" onclick="toggleFavorite(${car.id})">
                    ${userFavorites.includes(car.id) ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
                </button>
                ${currentUser && currentUser.id !== car.user_id ? `
                    <button class="btn-secondary" onclick="showReviewModal(${car.user_id}, ${car.id})">
                        ⭐ Leave Review
                    </button>
                ` : ''}
                <button class="btn-secondary" onclick="contactSeller('${car.seller_phone || ''}', '${car.make} ${car.model}')">
                    📞 Contact Seller
                </button>
            </div>
            
            <div class="social-sharing">
                <h4>Share this car:</h4>
                <div class="share-buttons">
                    <button class="share-btn facebook" onclick="shareOnSocial(${car.id}, 'facebook')">
                        📘 Facebook
                    </button>
                    <button class="share-btn twitter" onclick="shareOnSocial(${car.id}, 'twitter')">
                        🐦 Twitter
                    </button>
                    <button class="share-btn whatsapp" onclick="shareOnSocial(${car.id}, 'whatsapp')">
                        💬 WhatsApp
                    </button>
                    <button class="share-btn linkedin" onclick="shareOnSocial(${car.id}, 'linkedin')">
                        💼 LinkedIn
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '⭐'.repeat(fullStars) + (hasHalfStar ? '⭐' : '') + '☆'.repeat(emptyStars);
}

async function shareOnSocial(carId, platform) {
    try {
        const response = await fetch(`/api/share/car/${carId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ platform })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.open(data.shareUrl, '_blank', 'width=600,height=400');
        } else {
            alert('Failed to generate share link');
        }
    } catch (error) {
        console.error('Error sharing:', error);
        alert('Failed to share');
    }
}

function contactSeller(phone, carInfo) {
    if (phone) {
        const message = `Hi, I'm interested in your ${carInfo}. Is it still available?`;
        window.open(`tel:${phone}`);
    } else {
        alert('Seller contact information not available');
    }
}

function showReviewModal(userId, carId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>Leave a Review</h2>
            <form id="reviewForm">
                <div class="form-group">
                    <label for="reviewRating">Rating:</label>
                    <select id="reviewRating" required>
                        <option value="">Select Rating</option>
                        <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                        <option value="4">⭐⭐⭐⭐☆ Good</option>
                        <option value="3">⭐⭐⭐☆☆ Average</option>
                        <option value="2">⭐⭐☆☆☆ Poor</option>
                        <option value="1">⭐☆☆☆☆ Terrible</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="reviewComment">Comment (optional):</label>
                    <textarea id="reviewComment" rows="4" placeholder="Share your experience..."></textarea>
                </div>
                <button type="submit">Submit Review</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rating = document.getElementById('reviewRating').value;
        const comment = document.getElementById('reviewComment').value;
        
        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reviewed_user_id: userId,
                    car_id: carId,
                    rating: parseInt(rating),
                    comment: comment
                })
            });
            
            if (response.ok) {
                alert('Review submitted successfully!');
                modal.remove();
                // Refresh car details to show updated reputation
                viewCarDetails(carId);
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review');
        }
    });
}

async function toggleFavorite(carId) {
    if (!currentUser) {
        showNotification('Please login to add favorites', 'warning');
        return;
    }
    
    const isFavorite = userFavorites.includes(carId);
    const method = isFavorite ? 'DELETE' : 'POST';
    
    try {
        const response = await fetch(`/api/favorites/${carId}`, {
            method: method
        });
        
        if (response.ok) {
            if (isFavorite) {
                userFavorites = userFavorites.filter(id => id !== carId);
                showNotification('Removed from favorites!', 'success');
            } else {
                userFavorites.push(carId);
                showNotification('Added to favorites!', 'success');
            }
            displayCars(allCars);
        } else {
            showNotification('Failed to update favorites', 'error');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Failed to update favorites', 'error');
    }
}

async function loadUserFavorites() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/favorites');
        const data = await response.json();
        
        if (response.ok) {
            userFavorites = data.map(f => f.car_id);
            
            const favoriteCars = allCars.filter(car => userFavorites.includes(car.id));
            const container = document.getElementById('userFavorites');
            if (container) {
                if (favoriteCars.length === 0) {
                    container.innerHTML = '<p>No favorite cars yet.</p>';
                } else {
                    container.innerHTML = favoriteCars.map(car => `
                        <div class="car-card">
                            <img src="${car.image_url || '/images/default-car.jpg'}" alt="${car.make} ${car.model}" class="car-image">
                            <div class="car-info">
                                <div class="car-title">${car.make} ${car.model} (${car.year})</div>
                                <div class="car-price">$${car.price.toLocaleString()}</div>
                                <div class="car-actions">
                                    <button onclick="viewCarDetails(${car.id})">View Details</button>
                                    <button class="favorite-btn active" onclick="toggleFavorite(${car.id})">Remove</button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

async function loadDashboardData() {
    if (!currentUser) return;
    
    document.getElementById('profileName').value = currentUser.name || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    
    loadUserFavorites();
    loadUserListings();
    loadSavedSearches();
}

async function loadUserListings() {
    if (!currentUser) return;
    
    const container = document.getElementById('userListings');
    if (!container) return;
    
    try {
        const response = await fetch('/api/user-cars');
        const data = await response.json();
        
        if (response.ok) {
            if (data.cars.length === 0) {
                container.innerHTML = '<p>You haven\'t listed any cars yet. <button onclick="document.getElementById(\'addCarBtn\').click()">Add Your First Car</button></p>';
            } else {
                container.innerHTML = data.cars.map(car => `
                    <div class="user-car-item">
                        <div class="car-image">
                            <img src="${car.image || '/images/default-car.jpg'}" alt="${car.make} ${car.model}" onerror="this.src='/images/default-car.jpg'">
                        </div>
                        <div class="car-info">
                            <h4>${car.make} ${car.model} (${car.year})</h4>
                            <p class="price">$${parseFloat(car.price).toLocaleString()}</p>
                            <p class="details">${car.mileage.toLocaleString()} miles • ${car.fuel_type} • ${car.transmission}</p>
                            <p class="status">Status: <span class="${car.status === 'active' ? 'active' : 'inactive'}">${car.status}</span></p>
                            <div class="car-actions">
                                <button onclick="editCar(${car.id})" class="edit-btn">Edit</button>
                                <button onclick="toggleCarStatus(${car.id}, '${car.status}')" class="status-btn">
                                    ${car.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onclick="deleteCar(${car.id})" class="delete-btn">Delete</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            container.innerHTML = '<p>Error loading your listings. Please try again.</p>';
        }
    } catch (error) {
        console.error('Error loading user listings:', error);
        container.innerHTML = '<p>Error loading your listings. Please try again.</p>';
    }
}

async function loadSavedSearches() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/saved-searches');
        const data = await response.json();
        
        if (response.ok) {
            const container = document.getElementById('savedSearches');
            if (container) {
                if (data.searches.length === 0) {
                    container.innerHTML = '<p>No saved searches yet.</p>';
                } else {
                    container.innerHTML = data.searches.map(search => `
                        <div class="saved-search-item">
                            <h4>${search.name}</h4>
                            <p>Criteria: ${search.criteria}</p>
                            <p>Created: ${new Date(search.created_at).toLocaleDateString()}</p>
                            <button onclick="applySavedSearch('${search.criteria}')">Apply Search</button>
                            <button onclick="deleteSavedSearch(${search.id})">Delete</button>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Error loading saved searches:', error);
    }
}

function applySavedSearch(criteria) {
    alert('Applying saved search: ' + criteria);
}

// User car management functions
async function editCar(carId) {
    try {
        const response = await fetch(`/api/cars/${carId}`);
        const data = await response.json();
        
        if (response.ok) {
            const car = data;
            // Populate the car form with existing data
            document.getElementById('carMake').value = car.make || '';
            document.getElementById('carModel').value = car.model || '';
            document.getElementById('carYear').value = car.year || '';
            document.getElementById('carPrice').value = car.price || '';
            document.getElementById('carMileage').value = car.mileage || '';
            document.getElementById('carFuelType').value = car.fuel_type || '';
            document.getElementById('carTransmission').value = car.transmission || '';
            document.getElementById('carBodyType').value = car.body_type || '';
            document.getElementById('carColor').value = car.color || '';
            document.getElementById('carEngineSize').value = car.engine_size || '';
            document.getElementById('carDoors').value = car.doors || '';
            document.getElementById('carSeats').value = car.seats || '';
            document.getElementById('carCondition').value = car.condition || '';
            document.getElementById('carDescription').value = car.description || '';
            document.getElementById('carFeatures').value = car.features || '';
            
            // Change form to edit mode
            const submitBtn = document.getElementById('carSubmitBtn');
            submitBtn.textContent = 'Update Car';
            submitBtn.dataset.editId = carId;
            
            // Open the car modal
            carModal.style.display = 'block';
        } else {
            showNotification('Error loading car details', 'error');
        }
    } catch (error) {
        console.error('Error editing car:', error);
        showNotification('Error loading car details', 'error');
    }
}

async function toggleCarStatus(carId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
        const response = await fetch(`/api/cars/${carId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            loadUserListings(); // Reload the listings
            showNotification(`Car ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
        } else {
            showNotification('Error updating car status', 'error');
        }
    } catch (error) {
        console.error('Error toggling car status:', error);
        showNotification('Error updating car status', 'error');
    }
}

async function deleteCar(carId) {
    if (!confirm('Are you sure you want to delete this car listing?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/cars/${carId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadUserListings(); // Reload the listings
            showNotification('Car deleted successfully', 'success');
        } else {
            showNotification('Error deleting car', 'error');
        }
    } catch (error) {
        console.error('Error deleting car:', error);
        showNotification('Error deleting car', 'error');
    }
}

async function deleteSavedSearch(searchId) {
    try {
        const response = await fetch(`/api/saved-searches/${searchId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadSavedSearches();
        }
    } catch (error) {
        console.error('Error deleting saved search:', error);
    }
}

function updatePagination() {
    const container = document.querySelector('.pagination');
    if (!container) return;
    
    container.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
    `;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    searchCars();
}

function updateNavigation(isLoggedIn) {
    const loginNav = document.getElementById('loginBtn');
    const registerNav = document.getElementById('registerBtn');
    const dashboardNav = document.getElementById('dashboardBtn');
    const favoritesNav = document.getElementById('favoritesBtn');
    const logoutNav = document.getElementById('logoutBtn');
    const addCarButton = document.getElementById('addCarBtn');
    
    if (isLoggedIn) {
        loginNav?.parentElement.style.setProperty('display', 'none');
        registerNav?.parentElement.style.setProperty('display', 'none');
        dashboardNav?.parentElement.style.setProperty('display', 'block');
        favoritesNav?.parentElement.style.setProperty('display', 'block');
        logoutNav?.parentElement.style.setProperty('display', 'block');
        if (addCarButton) addCarButton.style.display = 'block';
    } else {
        loginNav?.parentElement.style.setProperty('display', 'block');
        registerNav?.parentElement.style.setProperty('display', 'block');
        dashboardNav?.parentElement.style.setProperty('display', 'none');
        favoritesNav?.parentElement.style.setProperty('display', 'none');
        logoutNav?.parentElement.style.setProperty('display', 'none');
        if (addCarButton) addCarButton.style.display = 'none';
    }
}

logoutBtn?.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            currentUser = null;
            userFavorites = [];
            updateNavigation(false);
            showNotification('Logged out successfully', 'success');
            // Redirect to home page or refresh
            window.location.reload();
        } else {
            showNotification('Failed to logout', 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
});

// Check login status on page load
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (response.ok && data.user) {
            currentUser = data.user;
            updateNavigation(true);
            loadUserFavorites();
        } else {
            updateNavigation(false);
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        updateNavigation(false);
    }
}

// Add event listeners for comparison modal
document.getElementById('clearComparison')?.addEventListener('click', clearComparison);
document.getElementById('startComparison')?.addEventListener('click', startComparison);

// Add event listener for car modal close
carModal?.addEventListener('click', (e) => {
    if (e.target === carModal || e.target.classList.contains('close')) {
        // Reset form to add mode when modal is closed
        const submitBtn = document.getElementById('carSubmitBtn');
        if (submitBtn) {
            submitBtn.textContent = 'Add Car';
            delete submitBtn.dataset.editId;
        }
        
        // Reset modal title
        const modalTitle = document.querySelector('#carModal h2');
        if (modalTitle) modalTitle.textContent = 'Add New Car';
        
        carModal.style.display = 'none';
        carForm?.reset();
    }
});

// Dashboard tab functionality
function showDashboardTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to selected tab button
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Load content based on tab
    if (tabName === 'listings') {
        loadUserListings();
    } else if (tabName === 'favorites') {
        loadUserFavorites();
    } else if (tabName === 'searches') {
        loadSavedSearches();
    }
}

// Add event listeners for dashboard tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        showDashboardTab(tabName);
    });
});

// Add event listener for favorites button
favoritesBtn?.addEventListener('click', () => {
    if (!currentUser) {
        showNotification('Please login to view your favorites', 'error');
        return;
    }
    
    // Open dashboard modal and switch to favorites tab
    dashboardModal.style.display = 'block';
    showDashboardTab('favorites');
});

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    // Add scroll reveal classes to elements
    const revealElements = document.querySelectorAll('.car-card, .hero-content, .search-box');
    revealElements.forEach((el, index) => {
        el.classList.add('scroll-reveal');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });
}

// Header scroll effect
function initHeaderScrollEffect() {
    const header = document.querySelector('header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadCars();
    initScrollAnimations();
    initHeaderScrollEffect();
    
    const carsContainer = document.getElementById('featuredCars');
    if (carsContainer && !document.querySelector('.pagination')) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';
        carsContainer.parentNode.insertBefore(paginationDiv, carsContainer.nextSibling);
    }
});