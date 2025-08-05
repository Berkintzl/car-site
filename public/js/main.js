// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const filtersModal = document.getElementById('filtersModal');
const dashboardModal = document.getElementById('dashboardModal');
const carModal = document.getElementById('carModal');
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
let currentFilters = {};
let currentPage = 1;
let totalPages = 1;
let allCars = [];
let userFavorites = [];

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

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

advancedFiltersBtn?.addEventListener('click', () => {
    filtersModal.style.display = 'block';
});

addCarBtn?.addEventListener('click', () => {
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
        const response = await fetch('/api/auth/login', {
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
            alert('Login successful!');
            loginModal.style.display = 'none';
            loginForm.reset();
            currentUser = data.user;
            updateNavigation(true);
            loadUserFavorites();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
});

registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    
    try {
        const response = await fetch('/api/auth/register', {
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
            alert('Registration successful! Please login.');
            registerModal.style.display = 'none';
            registerForm.reset();
        } else {
            alert(data.error || 'Registration failed');
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
        alert('New passwords do not match');
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
            alert('Password changed successfully!');
            passwordForm.reset();
        } else {
            alert(data.error || 'Password change failed');
        }
    } catch (error) {
        console.error('Password change error:', error);
        alert('An error occurred while changing password');
    }
});

carForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(carForm);
    
    const features = formData.get('carFeatures').split(',').map(f => f.trim()).filter(f => f);
    formData.set('features', JSON.stringify(features));
    
    try {
        const response = await fetch('/api/cars', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Car added successfully!');
            carModal.style.display = 'none';
            carForm.reset();
            loadCars();
            loadUserListings();
        } else {
            alert(data.error || 'Failed to add car');
        }
    } catch (error) {
        console.error('Car submission error:', error);
        alert('An error occurred while adding car');
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
            allCars = data.cars || [];
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
    const container = document.getElementById('featuredCars') || document.querySelector('.cars-grid');
    if (!container) return;
    
    if (cars.length === 0) {
        container.innerHTML = '<p>No cars found.</p>';
        return;
    }
    
    container.innerHTML = cars.map(car => {
        const features = car.features ? JSON.parse(car.features) : [];
        const isFavorite = userFavorites.includes(car.id);
        
        return `
            <div class="car-card">
                <img src="${car.image_url || '/images/default-car.jpg'}" alt="${car.make} ${car.model}" class="car-image">
                <div class="car-info">
                    <div class="car-title">${car.make} ${car.model} (${car.year})</div>
                    <div class="car-price">$${car.price.toLocaleString()}</div>
                    <div class="car-details">
                        <p>${car.mileage.toLocaleString()} miles • ${car.fuel_type} • ${car.transmission}</p>
                        ${car.body_type ? `<p>Body Type: ${car.body_type}</p>` : ''}
                        ${car.color ? `<p>Color: ${car.color}</p>` : ''}
                    </div>
                    <p class="car-description">${car.description}</p>
                    ${features.length > 0 ? `<p><strong>Features:</strong> ${features.join(', ')}</p>` : ''}
                    <div class="car-actions">
                        <button onclick="viewCarDetails(${car.id})">View Details</button>
                        ${currentUser ? `<button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${car.id})">${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function viewCarDetails(carId) {
    alert(`Viewing details for car ID: ${carId}`);
}

async function toggleFavorite(carId) {
    if (!currentUser) {
        alert('Please login to add favorites');
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
            } else {
                userFavorites.push(carId);
            }
            displayCars(allCars);
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

async function loadUserFavorites() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/favorites');
        const data = await response.json();
        
        if (response.ok) {
            userFavorites = data.favorites.map(f => f.car_id);
            
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
    const container = document.getElementById('userListings');
    if (container) {
        container.innerHTML = '<p>User listings feature coming soon...</p>';
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
    
    if (isLoggedIn) {
        loginNav?.parentElement.style.setProperty('display', 'none');
        registerNav?.parentElement.style.setProperty('display', 'none');
        dashboardNav?.parentElement.style.setProperty('display', 'block');
        favoritesNav?.parentElement.style.setProperty('display', 'block');
        logoutNav?.parentElement.style.setProperty('display', 'block');
    } else {
        loginNav?.parentElement.style.setProperty('display', 'block');
        registerNav?.parentElement.style.setProperty('display', 'block');
        dashboardNav?.parentElement.style.setProperty('display', 'none');
        favoritesNav?.parentElement.style.setProperty('display', 'none');
        logoutNav?.parentElement.style.setProperty('display', 'none');
    }
}

logoutBtn?.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            currentUser = null;
            userFavorites = [];
            updateNavigation(false);
            alert('Logged out successfully');
        }
    } catch (error) {
        console.error('Logout error:', error);
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadCars();
    
    const carsContainer = document.getElementById('featuredCars');
    if (carsContainer && !document.querySelector('.pagination')) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';
        carsContainer.parentNode.insertBefore(paginationDiv, carsContainer.nextSibling);
    }
});