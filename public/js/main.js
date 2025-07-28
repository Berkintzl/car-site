// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeBtns = document.querySelectorAll('.close');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const carsGrid = document.getElementById('carsGrid');

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Modal functionality
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'block';
});

registerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.style.display = 'block';
});

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === registerModal) {
        registerModal.style.display = 'none';
    }
});

// Form submissions
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Login successful!');
            loginModal.style.display = 'none';
            updateNavigation(true);
            loadCars();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful! Please login.');
            registerModal.style.display = 'none';
            loginModal.style.display = 'block';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
});

// Search functionality
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        searchCars(query);
    } else {
        loadCars();
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            searchCars(query);
        } else {
            loadCars();
        }
    }
});

// Load cars function
async function loadCars() {
    try {
        const response = await fetch('/api/cars');
        const cars = await response.json();
        displayCars(cars);
    } catch (error) {
        console.error('Error loading cars:', error);
        carsGrid.innerHTML = '<p>Error loading cars. Please try again later.</p>';
    }
}

// Search cars function
async function searchCars(query) {
    try {
        const response = await fetch(`/api/cars/search?q=${encodeURIComponent(query)}`);
        const cars = await response.json();
        displayCars(cars);
    } catch (error) {
        console.error('Error searching cars:', error);
        carsGrid.innerHTML = '<p>Error searching cars. Please try again later.</p>';
    }
}

// Display cars function
function displayCars(cars) {
    if (cars.length === 0) {
        carsGrid.innerHTML = '<p>No cars found.</p>';
        return;
    }
    
    carsGrid.innerHTML = cars.map(car => `
        <div class="car-card">
            <div class="car-image">
                ${car.image ? `<img src="${car.image}" alt="${car.make} ${car.model}" style="width: 100%; height: 100%; object-fit: cover;">` : 'No Image Available'}
            </div>
            <div class="car-info">
                <h3>${car.make} ${car.model}</h3>
                <div class="car-price">$${car.price.toLocaleString()}</div>
                <div class="car-details">
                    <span>Year: ${car.year}</span>
                    <span>Mileage: ${car.mileage.toLocaleString()} mi</span>
                </div>
                <div class="car-details">
                    <span>Fuel: ${car.fuel_type}</span>
                    <span>Transmission: ${car.transmission}</span>
                </div>
                <button class="view-btn" onclick="viewCarDetails(${car.id})">View Details</button>
            </div>
        </div>
    `).join('');
}

// View car details function
function viewCarDetails(carId) {
    // This will be implemented later when we add car details page
    alert(`Car details for ID: ${carId} - Feature coming soon!`);
}

// Update navigation based on login status
function updateNavigation(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (isLoggedIn) {
        loginBtn.textContent = 'Dashboard';
        loginBtn.href = '/dashboard';
        registerBtn.textContent = 'Logout';
        registerBtn.onclick = logout;
    } else {
        loginBtn.textContent = 'Login';
        registerBtn.textContent = 'Register';
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            alert('Logged out successfully!');
            updateNavigation(false);
            loadCars();
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Check login status on page load
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            updateNavigation(true);
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadCars();
});