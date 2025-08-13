// Admin Panel JavaScript

// Global variables
let currentSection = 'dashboard';
let currentUser = null;
let charts = {};

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link[data-section]');
const sections = document.querySelectorAll('.admin-section');
const sectionTitle = document.getElementById('sectionTitle');
const adminUserName = document.getElementById('adminUserName');
const adminLogout = document.getElementById('adminLogout');

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initializeEventListeners();
    loadDashboardData();
});

// Check admin authentication
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/admin/auth');
        const data = await response.json();
        
        if (!response.ok || !data.isAdmin) {
            window.location.href = '/admin-login.html';
            return;
        }
        
        currentUser = data.user;
        adminUserName.textContent = currentUser.name || 'Admin';
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/admin-login.html';
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) {
                switchSection(section);
            }
        });
    });
    
    // Logout
    adminLogout.addEventListener('click', async (e) => {
        e.preventDefault();
        await logout();
    });
    
    // Search and filter events
    setupSearchAndFilters();
    
    // Form submissions
    setupFormSubmissions();
    
    // Modal events
    setupModals();
}

// Switch between sections
function switchSection(sectionName) {
    // Update navigation
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update sections
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionName).classList.add('active');
    
    // Update title
    sectionTitle.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    
    currentSection = sectionName;
    
    // Load section data
    loadSectionData(sectionName);
}

// Load section-specific data
function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'cars':
            loadCarsData();
            break;
        case 'reviews':
            loadReviewsData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();
        
        if (response.ok) {
            updateDashboardStats(data.stats);
            updateRecentActivity(data.recentActivity);
            createDashboardCharts(data.chartData);
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function updateDashboardStats(stats) {
    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('activeListings').textContent = stats.activeListings || 0;
    document.getElementById('pendingReviews').textContent = stats.pendingReviews || 0;
    document.getElementById('monthlyRevenue').textContent = `$${(stats.monthlyRevenue || 0).toLocaleString()}`;
}

function updateRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<p class="no-data">No recent activity</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-description">${activity.description}</div>
            <div class="activity-time">${formatDate(activity.created_at)}</div>
        </div>
    `).join('');
}

function createDashboardCharts(chartData) {
    // User registration chart
    const userCtx = document.getElementById('userChart').getContext('2d');
    if (charts.userChart) charts.userChart.destroy();
    charts.userChart = new Chart(userCtx, {
        type: 'line',
        data: {
            labels: chartData.userRegistrations.labels,
            datasets: [{
                label: 'New Users',
                data: chartData.userRegistrations.data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Listing activity chart
    const listingCtx = document.getElementById('listingChart').getContext('2d');
    if (charts.listingChart) charts.listingChart.destroy();
    charts.listingChart = new Chart(listingCtx, {
        type: 'bar',
        data: {
            labels: chartData.listingActivity.labels,
            datasets: [{
                label: 'New Listings',
                data: chartData.listingActivity.data,
                backgroundColor: '#2ecc71'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Users management
async function loadUsersData(page = 1, search = '') {
    try {
        const response = await fetch(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
        const data = await response.json();
        
        if (response.ok) {
            updateUsersTable(data.users);
            updatePagination('usersPagination', data.pagination, loadUsersData);
        }
    } catch (error) {
        console.error('Failed to load users data:', error);
    }
}

function updateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${formatDate(user.created_at)}</td>
            <td><span class="status ${user.status || 'active'}">${user.status || 'active'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewUser(${user.id})">View</button>
                    <button class="action-btn edit" onclick="editUser(${user.id})">Edit</button>
                    <button class="action-btn delete" onclick="deleteUser(${user.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Cars management
async function loadCarsData(page = 1, search = '', status = 'all') {
    try {
        const response = await fetch(`/api/admin/cars?page=${page}&search=${encodeURIComponent(search)}&status=${status}`);
        const data = await response.json();
        
        if (response.ok) {
            updateCarsTable(data.cars);
            updatePagination('carsPagination', data.pagination, loadCarsData);
        }
    } catch (error) {
        console.error('Failed to load cars data:', error);
    }
}

function updateCarsTable(cars) {
    const tbody = document.getElementById('carsTableBody');
    
    if (!cars || cars.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No cars found</td></tr>';
        return;
    }
    
    tbody.innerHTML = cars.map(car => `
        <tr>
            <td>${car.id}</td>
            <td>${car.make} ${car.model}</td>
            <td>${car.year}</td>
            <td>$${car.price.toLocaleString()}</td>
            <td>${car.owner_name}</td>
            <td><span class="status ${car.status}">${car.status}</span></td>
            <td>${formatDate(car.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewCar(${car.id})">View</button>
                    <button class="action-btn approve" onclick="approveCar(${car.id})">Approve</button>
                    <button class="action-btn reject" onclick="rejectCar(${car.id})">Reject</button>
                    <button class="action-btn delete" onclick="deleteCar(${car.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Reviews management
async function loadReviewsData(status = 'all', rating = 'all') {
    try {
        const response = await fetch(`/api/admin/reviews?status=${status}&rating=${rating}`);
        const data = await response.json();
        
        if (response.ok) {
            updateReviewsContainer(data.reviews);
        }
    } catch (error) {
        console.error('Failed to load reviews data:', error);
    }
}

function updateReviewsContainer(reviews) {
    const container = document.getElementById('reviewsContainer');
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<p class="no-data">No reviews found</p>';
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div>
                    <strong>${review.reviewer_name}</strong>
                    <div class="review-rating">
                        ${generateStars(review.rating)}
                    </div>
                </div>
                <div>
                    <span class="status ${review.status || 'pending'}">${review.status || 'pending'}</span>
                </div>
            </div>
            <div class="review-content">${review.comment}</div>
            <div class="review-meta">
                <span>Car: ${review.car_make} ${review.car_model}</span>
                <span>${formatDate(review.created_at)}</span>
            </div>
            <div class="action-buttons" style="margin-top: 15px;">
                <button class="action-btn approve" onclick="approveReview(${review.id})">Approve</button>
                <button class="action-btn reject" onclick="rejectReview(${review.id})">Reject</button>
                <button class="action-btn delete" onclick="deleteReview(${review.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Analytics
async function loadAnalyticsData() {
    try {
        const response = await fetch('/api/admin/analytics');
        const data = await response.json();
        
        if (response.ok) {
            createAnalyticsCharts(data);
        }
    } catch (error) {
        console.error('Failed to load analytics data:', error);
    }
}

function createAnalyticsCharts(data) {
    // Traffic chart
    const trafficCtx = document.getElementById('trafficChart').getContext('2d');
    if (charts.trafficChart) charts.trafficChart.destroy();
    charts.trafficChart = new Chart(trafficCtx, {
        type: 'line',
        data: {
            labels: data.traffic.labels,
            datasets: [{
                label: 'Page Views',
                data: data.traffic.pageViews,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)'
            }, {
                label: 'Unique Visitors',
                data: data.traffic.uniqueVisitors,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Popular makes chart
    const makesCtx = document.getElementById('makesChart').getContext('2d');
    if (charts.makesChart) charts.makesChart.destroy();
    charts.makesChart = new Chart(makesCtx, {
        type: 'doughnut',
        data: {
            labels: data.popularMakes.labels,
            datasets: [{
                data: data.popularMakes.data,
                backgroundColor: [
                    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
                    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Revenue chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    if (charts.revenueChart) charts.revenueChart.destroy();
    charts.revenueChart = new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: data.revenue.labels,
            datasets: [{
                label: 'Revenue',
                data: data.revenue.data,
                backgroundColor: '#2ecc71'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
    
    // Engagement chart
    const engagementCtx = document.getElementById('engagementChart').getContext('2d');
    if (charts.engagementChart) charts.engagementChart.destroy();
    charts.engagementChart = new Chart(engagementCtx, {
        type: 'radar',
        data: {
            labels: ['Searches', 'Favorites', 'Contacts', 'Reviews', 'Shares'],
            datasets: [{
                label: 'User Engagement',
                data: data.engagement.data,
                borderColor: '#9b59b6',
                backgroundColor: 'rgba(155, 89, 182, 0.2)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Settings
async function loadSettingsData() {
    try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        
        if (response.ok) {
            populateSettingsForms(data.settings);
        }
    } catch (error) {
        console.error('Failed to load settings data:', error);
    }
}

function populateSettingsForms(settings) {
    // General settings
    document.getElementById('siteName').value = settings.siteName || 'CarHub';
    document.getElementById('siteDescription').value = settings.siteDescription || '';
    document.getElementById('contactEmail').value = settings.contactEmail || '';
    
    // Listing settings
    document.getElementById('maxImages').value = settings.maxImages || 10;
    document.getElementById('autoApprove').checked = settings.autoApprove || false;
    document.getElementById('listingDuration').value = settings.listingDuration || 30;
    
    // Email settings
    document.getElementById('smtpHost').value = settings.smtpHost || '';
    document.getElementById('smtpPort').value = settings.smtpPort || 587;
    document.getElementById('smtpUser').value = settings.smtpUser || '';
    // Don't populate password for security
    
    // Security settings
    document.getElementById('sessionTimeout').value = settings.sessionTimeout || 30;
    document.getElementById('maxLoginAttempts').value = settings.maxLoginAttempts || 5;
    document.getElementById('requireEmailVerification').checked = settings.requireEmailVerification || false;
}

// Search and filter setup
function setupSearchAndFilters() {
    // User search
    const userSearch = document.getElementById('userSearch');
    const searchUsersBtn = document.getElementById('searchUsersBtn');
    
    if (userSearch && searchUsersBtn) {
        searchUsersBtn.addEventListener('click', () => {
            loadUsersData(1, userSearch.value);
        });
        
        userSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadUsersData(1, userSearch.value);
            }
        });
    }
    
    // Car search and filters
    const carSearch = document.getElementById('carSearch');
    const searchCarsBtn = document.getElementById('searchCarsBtn');
    const carStatusFilter = document.getElementById('carStatusFilter');
    
    if (carSearch && searchCarsBtn) {
        searchCarsBtn.addEventListener('click', () => {
            loadCarsData(1, carSearch.value, carStatusFilter.value);
        });
        
        carSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadCarsData(1, carSearch.value, carStatusFilter.value);
            }
        });
    }
    
    if (carStatusFilter) {
        carStatusFilter.addEventListener('change', () => {
            loadCarsData(1, carSearch.value, carStatusFilter.value);
        });
    }
    
    // Review filters
    const reviewStatusFilter = document.getElementById('reviewStatusFilter');
    const reviewRatingFilter = document.getElementById('reviewRatingFilter');
    
    if (reviewStatusFilter) {
        reviewStatusFilter.addEventListener('change', () => {
            loadReviewsData(reviewStatusFilter.value, reviewRatingFilter.value);
        });
    }
    
    if (reviewRatingFilter) {
        reviewRatingFilter.addEventListener('change', () => {
            loadReviewsData(reviewStatusFilter.value, reviewRatingFilter.value);
        });
    }
}

// Form submissions setup
function setupFormSubmissions() {
    // General settings form
    const generalSettingsForm = document.getElementById('generalSettingsForm');
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSettings('general', new FormData(generalSettingsForm));
        });
    }
    
    // Listing settings form
    const listingSettingsForm = document.getElementById('listingSettingsForm');
    if (listingSettingsForm) {
        listingSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSettings('listing', new FormData(listingSettingsForm));
        });
    }
    
    // Email settings form
    const emailSettingsForm = document.getElementById('emailSettingsForm');
    if (emailSettingsForm) {
        emailSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSettings('email', new FormData(emailSettingsForm));
        });
    }
    
    // Security settings form
    const securitySettingsForm = document.getElementById('securitySettingsForm');
    if (securitySettingsForm) {
        securitySettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSettings('security', new FormData(securitySettingsForm));
        });
    }
    
    // Analytics date range
    const generateReport = document.getElementById('generateReport');
    if (generateReport) {
        generateReport.addEventListener('click', () => {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            generateAnalyticsReport(startDate, endDate);
        });
    }
    
    // Export buttons
    const exportCSV = document.getElementById('exportCSV');
    const exportPDF = document.getElementById('exportPDF');
    const exportExcel = document.getElementById('exportExcel');
    
    if (exportCSV) exportCSV.addEventListener('click', () => exportData('csv'));
    if (exportPDF) exportPDF.addEventListener('click', () => exportData('pdf'));
    if (exportExcel) exportExcel.addEventListener('click', () => exportData('excel'));
}

// Modal setup
function setupModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Utility functions
function updatePagination(containerId, pagination, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container || !pagination) return;
    
    const { currentPage, totalPages, hasNext, hasPrev } = pagination;
    
    let html = '';
    
    if (hasPrev) {
        html += `<button onclick="${loadFunction.name}(${currentPage - 1})">Previous</button>`;
    }
    
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="${loadFunction.name}(${i})">${i}</button>`;
    }
    
    if (hasNext) {
        html += `<button onclick="${loadFunction.name}(${currentPage + 1})">Next</button>`;
    }
    
    container.innerHTML = html;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
    }
    return stars;
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    document.body.insertBefore(alert, document.body.firstChild);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Action functions
async function viewUser(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();
        
        if (response.ok) {
            showUserModal(data.user);
        }
    } catch (error) {
        console.error('Failed to load user details:', error);
    }
}

async function editUser(userId) {
    // Implementation for editing user
    console.log('Edit user:', userId);
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('User deleted successfully', 'success');
            loadUsersData();
        } else {
            showAlert('Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Failed to delete user:', error);
        showAlert('Failed to delete user', 'error');
    }
}

async function viewCar(carId) {
    try {
        const response = await fetch(`/api/admin/cars/${carId}`);
        const data = await response.json();
        
        if (response.ok) {
            showCarModal(data.car);
        }
    } catch (error) {
        console.error('Failed to load car details:', error);
    }
}

async function approveCar(carId) {
    try {
        const response = await fetch(`/api/admin/cars/${carId}/approve`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showAlert('Car approved successfully', 'success');
            loadCarsData();
        } else {
            showAlert('Failed to approve car', 'error');
        }
    } catch (error) {
        console.error('Failed to approve car:', error);
        showAlert('Failed to approve car', 'error');
    }
}

async function rejectCar(carId) {
    try {
        const response = await fetch(`/api/admin/cars/${carId}/reject`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showAlert('Car rejected successfully', 'success');
            loadCarsData();
        } else {
            showAlert('Failed to reject car', 'error');
        }
    } catch (error) {
        console.error('Failed to reject car:', error);
        showAlert('Failed to reject car', 'error');
    }
}

async function deleteCar(carId) {
    if (!confirm('Are you sure you want to delete this car listing?')) return;
    
    try {
        const response = await fetch(`/api/admin/cars/${carId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Car deleted successfully', 'success');
            loadCarsData();
        } else {
            showAlert('Failed to delete car', 'error');
        }
    } catch (error) {
        console.error('Failed to delete car:', error);
        showAlert('Failed to delete car', 'error');
    }
}

async function approveReview(reviewId) {
    try {
        const response = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showAlert('Review approved successfully', 'success');
            loadReviewsData();
        } else {
            showAlert('Failed to approve review', 'error');
        }
    } catch (error) {
        console.error('Failed to approve review:', error);
        showAlert('Failed to approve review', 'error');
    }
}

async function rejectReview(reviewId) {
    try {
        const response = await fetch(`/api/admin/reviews/${reviewId}/reject`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showAlert('Review rejected successfully', 'success');
            loadReviewsData();
        } else {
            showAlert('Failed to reject review', 'error');
        }
    } catch (error) {
        console.error('Failed to reject review:', error);
        showAlert('Failed to reject review', 'error');
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
        const response = await fetch(`/api/admin/reviews/${reviewId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Review deleted successfully', 'success');
            loadReviewsData();
        } else {
            showAlert('Failed to delete review', 'error');
        }
    } catch (error) {
        console.error('Failed to delete review:', error);
        showAlert('Failed to delete review', 'error');
    }
}

async function saveSettings(type, formData) {
    try {
        const response = await fetch(`/api/admin/settings/${type}`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showAlert('Settings saved successfully', 'success');
        } else {
            showAlert('Failed to save settings', 'error');
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
        showAlert('Failed to save settings', 'error');
    }
}

async function generateAnalyticsReport(startDate, endDate) {
    try {
        const response = await fetch(`/api/admin/analytics/report?start=${startDate}&end=${endDate}`);
        const data = await response.json();
        
        if (response.ok) {
            createAnalyticsCharts(data);
            showAlert('Report generated successfully', 'success');
        } else {
            showAlert('Failed to generate report', 'error');
        }
    } catch (error) {
        console.error('Failed to generate report:', error);
        showAlert('Failed to generate report', 'error');
    }
}

async function exportData(format) {
    try {
        const response = await fetch(`/api/admin/export/${format}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `carhub-data.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showAlert(`Data exported as ${format.toUpperCase()}`, 'success');
        } else {
            showAlert('Failed to export data', 'error');
        }
    } catch (error) {
        console.error('Failed to export data:', error);
        showAlert('Failed to export data', 'error');
    }
}

function showUserModal(user) {
    const modal = document.getElementById('userModal');
    const content = document.getElementById('userModalContent');
    
    content.innerHTML = `
        <div class="user-details">
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
            <p><strong>Registration Date:</strong> ${formatDate(user.created_at)}</p>
            <p><strong>Status:</strong> <span class="status ${user.status || 'active'}">${user.status || 'active'}</span></p>
            <p><strong>Total Listings:</strong> ${user.total_listings || 0}</p>
            <p><strong>Active Listings:</strong> ${user.active_listings || 0}</p>
        </div>
    `;
    
    modal.style.display = 'block';
}

function showCarModal(car) {
    const modal = document.getElementById('carModal');
    const content = document.getElementById('carModalContent');
    
    const images = car.images ? JSON.parse(car.images) : [];
    const features = car.features ? JSON.parse(car.features) : [];
    
    content.innerHTML = `
        <div class="car-details">
            <div class="car-images">
                ${images.length > 0 ? 
                    `<img src="/uploads/${images[0]}" alt="${car.make} ${car.model}" style="max-width: 100%; height: auto;">` :
                    '<p>No images available</p>'
                }
            </div>
            <div class="car-info">
                <h3>${car.year} ${car.make} ${car.model}</h3>
                <p><strong>Price:</strong> $${car.price.toLocaleString()}</p>
                <p><strong>Mileage:</strong> ${car.mileage.toLocaleString()} miles</p>
                <p><strong>Fuel Type:</strong> ${car.fuel_type}</p>
                <p><strong>Transmission:</strong> ${car.transmission}</p>
                <p><strong>Body Type:</strong> ${car.body_type}</p>
                <p><strong>Color:</strong> ${car.color}</p>
                <p><strong>Status:</strong> <span class="status ${car.status}">${car.status}</span></p>
                <p><strong>Owner:</strong> ${car.owner_name}</p>
                <p><strong>Created:</strong> ${formatDate(car.created_at)}</p>
                <p><strong>Description:</strong> ${car.description}</p>
                ${features.length > 0 ? `<p><strong>Features:</strong> ${features.join(', ')}</p>` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

async function logout() {
    try {
        const response = await fetch('/api/admin/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            window.location.href = '/admin-login.html';
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Load Chart.js if not already loaded
if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script);
}