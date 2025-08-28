// Car Details Page JavaScript
// currentUser, userFavorites are inherited from main.js
let currentCar = null;

// Get car ID from URL parameters
function getCarIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Notification function (matching main.js style)
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

// Load car details
async function loadCarDetails() {
    const carId = getCarIdFromUrl();
    
    if (!carId) {
        document.getElementById('carDetailsContainer').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error</h4>
                <p>No car ID provided. Please go back and select a car.</p>
                <button onclick="goHome()" class="btn btn-primary">Back to Home</button>
            </div>
        `;
        return;
    }

    try {
        // Fetch car details
        const carResponse = await fetch(`/api/cars/${carId}`);
        const car = await carResponse.json();
        
        if (!carResponse.ok) {
            throw new Error(car.message || 'Failed to load car details');
        }
        
        currentCar = car;
        
        // Fetch seller reputation and reviews only if user_id exists
        let reputation = { reputation_score: 0, average_rating: 0, total_reviews: 0 };
        let reviews = [];
        
        if (car.user_id) {
            try {
                const reputationResponse = await fetch(`/api/user/${car.user_id}/reputation`);
                if (reputationResponse.ok) {
                    reputation = await reputationResponse.json();
                }
                
                const reviewsResponse = await fetch(`/api/reviews/user/${car.user_id}`);
                if (reviewsResponse.ok) {
                    reviews = await reviewsResponse.json();
                }
            } catch (err) {
                console.warn('Could not load seller reputation/reviews:', err);
            }
        }
        
        // Display car details
        displayCarDetails(car, reputation, reviews);
        
        // Update page title
        document.title = `${car.year} ${car.make} ${car.model} - AutoMarket`;
        
    } catch (error) {
        console.error('Error loading car details:', error);
        document.getElementById('carDetailsContainer').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Loading Car Details</h4>
                <p>${error.message}</p>
                <button onclick="goHome()" class="btn btn-primary">Back to Home</button>
            </div>
        `;
    }
}

// Display car details
function displayCarDetails(car, reputation, reviews) {
    const container = document.getElementById('carDetailsContainer');
    const features = car.features ? JSON.parse(car.features) : [];
    const images = car.images ? JSON.parse(car.images) : [];
    const isFavorite = userFavorites.includes(car.id);
    
    container.innerHTML = `
        <div class="row">
            <div class="col-lg-8">
                <!-- Car Images -->
                <div class="car-images-section mb-4">
                    ${car.image || (images && images.length > 0) ? `
                        <div class="main-image mb-3">
                            <img src="${car.image ? '/uploads/' + car.image : '/images/default-car.jpg'}" alt="${car.make} ${car.model}" class="img-fluid rounded" style="width: 100%; height: 400px; object-fit: cover;">
                        </div>
                        ${images && images.length > 1 ? `
                            <div class="thumbnail-images">
                                <div class="row">
                                    ${images.slice(0, 4).map(img => `
                                        <div class="col-3">
                                            <img src="/uploads/${img}" alt="Car image" class="img-fluid rounded thumbnail" style="height: 100px; object-fit: cover; cursor: pointer;" onclick="changeMainImage('/uploads/${img}')">
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="no-image-placeholder bg-light rounded d-flex align-items-center justify-content-center" style="height: 400px;">
                            <div class="text-center text-muted">
                                <i class="fas fa-car fa-3x mb-2"></i>
                                <p>No Image Available</p>
                            </div>
                        </div>
                    `}
                </div>
                
                <!-- Car Description -->
                <div class="car-description-section">
                    <h3>Description</h3>
                    <p class="lead">${car.description}</p>
                </div>
                
                ${features.length > 0 ? `
                    <div class="car-features-section mt-4">
                        <h3>Features</h3>
                        <div class="row">
                            ${features.map(feature => `
                                <div class="col-md-6 mb-2">
                                    <span class="badge bg-primary me-2">✓</span>
                                    ${feature.trim()}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="col-lg-4">
                <!-- Car Info Card -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h2 class="card-title mb-0">${car.year} ${car.make} ${car.model}</h2>
                    </div>
                    <div class="card-body">
                        <div class="price-section mb-3">
                            <h3 class="text-primary mb-0">$${car.price.toLocaleString()}</h3>
                        </div>
                        
                        <div class="specifications">
                            <div class="row mb-2">
                                <div class="col-6"><strong>Mileage:</strong></div>
                                <div class="col-6">${car.mileage.toLocaleString()} miles</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-6"><strong>Fuel Type:</strong></div>
                                <div class="col-6">${car.fuel_type}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-6"><strong>Transmission:</strong></div>
                                <div class="col-6">${car.transmission}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-6"><strong>Body Type:</strong></div>
                                <div class="col-6">${car.body_type}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-6"><strong>Color:</strong></div>
                                <div class="col-6">${car.color}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-6"><strong>Doors:</strong></div>
                                <div class="col-6">${car.doors}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-6"><strong>Seats:</strong></div>
                                <div class="col-6">${car.seats}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-6"><strong>Condition:</strong></div>
                                <div class="col-6">${car.condition_rating}/5 ⭐</div>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="action-buttons mt-4">
                            ${currentUser ? `
                                <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline-danger'} w-100 mb-2 favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${car.id})">
                                    ${isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
                                </button>
                            ` : `
                                <button class="btn btn-outline-secondary w-100 mb-2" onclick="showLoginModal()">
                                    🤍 Login to Add to Favorites
                                </button>
                            `}
                            
                            <button class="btn btn-primary w-100 mb-2" onclick="contactSeller('${car.seller_phone || ''}', '${car.make} ${car.model}')">
                                📞 Contact Seller
                            </button>
                            
                            ${currentUser && currentUser.id !== car.user_id ? `
                                <button class="btn btn-outline-warning w-100 mb-2" onclick="showReviewModal(${car.user_id}, ${car.id})">
                                    ⭐ Leave Review
                                </button>
                            ` : ''}
                            
                            <button class="btn btn-success w-100" onclick="shareOnSocial(${car.id}, 'whatsapp')">
                                💬 Share on WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Seller Info Card -->
                <div class="card">
                    <div class="card-header">
                        <h4>Seller Information</h4>
                    </div>
                    <div class="card-body">
                        <div class="seller-basic mb-3">
                            <h5>${car.seller_name}</h5>
                            <p class="mb-1"><strong>Phone:</strong> ${car.seller_phone || 'Not provided'}</p>
                        </div>
                        
                        <div class="seller-reputation">
                            <h6>Seller Reputation</h6>
                            <div class="reputation-score mb-2">
                                <span class="badge bg-primary fs-6">${reputation.reputation_score}/100</span>
                                <div class="stars d-inline-block ms-2">
                                    ${generateStars(reputation.average_rating || 0)}
                                </div>
                            </div>
                            <p class="small text-muted">${reputation.average_rating ? reputation.average_rating.toFixed(1) : '0.0'} (${reputation.total_reviews} reviews)</p>
                            
                            ${reputation.total_reviews > 0 ? `
                                <div class="rating-breakdown small">
                                    ${[5,4,3,2,1].map(star => `
                                        <div class="d-flex align-items-center mb-1">
                                            <span class="me-2">${star}★</span>
                                            <div class="progress flex-grow-1 me-2" style="height: 8px;">
                                                <div class="progress-bar" style="width: ${(reputation[getStarKey(star)] / reputation.total_reviews) * 100}%"></div>
                                            </div>
                                            <span class="small">${reputation[getStarKey(star)]}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="small text-muted">No reviews yet</p>'}
                        </div>
                        
                        ${reviews.length > 0 ? `
                            <div class="recent-reviews mt-3">
                                <h6>Recent Reviews</h6>
                                ${reviews.slice(0, 2).map(review => `
                                    <div class="review-item border-bottom pb-2 mb-2">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <strong class="small">${review.reviewer_name}</strong>
                                            <div class="stars small">${generateStars(review.rating)}</div>
                                        </div>
                                        ${review.comment ? `<p class="small text-muted mb-1">${review.comment}</p>` : ''}
                                        <small class="text-muted">${new Date(review.created_at).toLocaleDateString()}</small>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper functions
function getStarKey(star) {
    const keys = { 5: 'five_star', 4: 'four_star', 3: 'three_star', 2: 'two_star', 1: 'one_star' };
    return keys[star];
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
}

function changeMainImage(imageSrc) {
    const mainImage = document.querySelector('.main-image img');
    if (mainImage) {
        mainImage.src = imageSrc;
    }
}

// Navigation functions (matching main.js style)
function showDashboard() {
    window.location.href = 'index.html#dashboard';
}

function showFavorites() {
    window.location.href = 'index.html#favorites';
}

function goHome() {
    window.location.href = 'index.html';
}

// Favorites functionality
async function toggleFavorite(carId) {
    if (!currentUser) {
        showNotification('Please login to add favorites', 'error');
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
            
            // Refresh the car details to update button
            if (currentCar) {
                let reputation = { reputation_score: 0, average_rating: 0, total_reviews: 0 };
                let reviews = [];
                
                if (currentCar.user_id) {
                    try {
                        const reputationResponse = await fetch(`/api/user/${currentCar.user_id}/reputation`);
                        if (reputationResponse.ok) {
                            reputation = await reputationResponse.json();
                        }
                        
                        const reviewsResponse = await fetch(`/api/reviews/user/${currentCar.user_id}`);
                        if (reviewsResponse.ok) {
                            reviews = await reviewsResponse.json();
                        }
                    } catch (err) {
                        console.warn('Could not load seller reputation/reviews:', err);
                    }
                }
                
                displayCarDetails(currentCar, reputation, reviews);
            }
        } else {
            showNotification('Failed to update favorites', 'error');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Failed to update favorites', 'error');
    }
}

// Load user favorites
async function loadUserFavorites() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/favorites');
        const data = await response.json();
        
        if (response.ok) {
            userFavorites = data.map(fav => fav.car_id);
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

// Contact seller
function contactSeller(phone, carInfo) {
    if (phone) {
        const message = `Hi, I'm interested in your ${carInfo}. Is it still available?`;
        const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    } else {
        showNotification('Seller phone number not available', 'error');
    }
}

// Social sharing
function shareOnSocial(carId, platform) {
    const url = `${window.location.origin}/car-details.html?id=${carId}`;
    const text = `Check out this ${currentCar.year} ${currentCar.make} ${currentCar.model} for $${currentCar.price.toLocaleString()}`;
    
    let shareUrl;
    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank');
    }
}

// Modal functions
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
    document.getElementById('loginModal').style.display = 'none';
}

function showReviewModal(userId, carId) {
    document.getElementById('reviewModal').style.display = 'block';
    document.getElementById('reviewForm').dataset.userId = userId;
    document.getElementById('reviewForm').dataset.carId = carId;
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Check login status
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (response.ok && data.user) {
            currentUser = data.user;
            updateNavigation(true);
            await loadUserFavorites();
        } else {
            updateNavigation(false);
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        updateNavigation(false);
    }
}

function updateNavigation(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const favoritesBtn = document.getElementById('favoritesBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        dashboardBtn.style.display = 'block';
        favoritesBtn.style.display = 'block';
        logoutBtn.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        dashboardBtn.style.display = 'none';
        favoritesBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async function() {
    await checkLoginStatus();
    await loadCarDetails();
});

// Modal event listeners
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Login form
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            updateNavigation(true);
            await loadUserFavorites();
            closeModal('loginModal');
            showNotification('Logged in successfully!', 'success');
            
            // Refresh car details to show updated buttons
            if (currentCar) {
                const reputationResponse = await fetch(`/api/user/${currentCar.user_id}/reputation`);
                const reputation = await reputationResponse.json();
                const reviewsResponse = await fetch(`/api/reviews/user/${currentCar.user_id}`);
                const reviews = await reviewsResponse.json();
                displayCarDetails(currentCar, reputation, reviews);
            }
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed', 'error');
    }
});

// Register form
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('registerModal');
            showNotification('Registration successful! Please login.', 'success');
            showLoginModal();
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed', 'error');
    }
});

// Review form
document.getElementById('reviewForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const userId = this.dataset.userId;
    const carId = this.dataset.carId;
    const rating = document.getElementById('reviewRating').value;
    const comment = document.getElementById('reviewComment').value;
    
    if (!rating) {
        showNotification('Please select a rating', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                reviewedUserId: userId, 
                carId: carId, 
                rating: parseInt(rating), 
                comment 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('reviewModal');
            showNotification('Review submitted successfully!', 'success');
            
            // Refresh car details to show new review
            if (currentCar) {
                const reputationResponse = await fetch(`/api/user/${currentCar.user_id}/reputation`);
                const reputation = await reputationResponse.json();
                const reviewsResponse = await fetch(`/api/reviews/user/${currentCar.user_id}`);
                const reviews = await reviewsResponse.json();
                displayCarDetails(currentCar, reputation, reviews);
            }
        } else {
            showNotification(data.message || 'Failed to submit review', 'error');
        }
    } catch (error) {
        console.error('Review submission error:', error);
        showNotification('Failed to submit review', 'error');
    }
});

// Star rating functionality
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('star')) {
        const rating = e.target.dataset.rating;
        const stars = document.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
        
        document.getElementById('reviewRating').value = rating;
    }
});

function logout() {
    fetch('/api/logout', { method: 'POST' })
        .then(() => {
            currentUser = null;
            userFavorites = [];
            updateNavigation(false);
            showNotification('Logged out successfully', 'success');
            
            // Refresh car details to hide user-specific buttons
            if (currentCar) {
                const reputationResponse = fetch(`/api/user/${currentCar.user_id}/reputation`);
                const reviewsResponse = fetch(`/api/reviews/user/${currentCar.user_id}`);
                Promise.all([reputationResponse, reviewsResponse])
                    .then(async ([repRes, revRes]) => {
                        const reputation = await repRes.json();
                        const reviews = await revRes.json();
                        displayCarDetails(currentCar, reputation, reviews);
                    });
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
        });
}