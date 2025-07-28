# CarHub - Car Listing Website

A modern car listing website built with Node.js, Express, SQLite, and vanilla JavaScript.

## Features

- **User Authentication**: Register and login functionality
- **Car Listings**: Browse and search through car listings
- **CRUD Operations**: Add, edit, and delete car listings (authenticated users)
- **Responsive Design**: Mobile-friendly interface
- **Image Upload**: Support for car images
- **Search Functionality**: Search cars by make, model, or description

## Tech Stack

### Frontend
- HTML5
- CSS3 (Responsive design)
- Vanilla JavaScript

### Backend
- Node.js
- Express.js
- SQLite3 database
- bcryptjs for password hashing
- express-session for session management
- multer for file uploads

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd car-site
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
car-site/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   ├── images/
│   └── index.html
├── server.js
├── package.json
├── .gitignore
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/user` - Get current user info

### Cars
- `GET /api/cars` - Get all cars
- `GET /api/cars/search?q=query` - Search cars
- `GET /api/cars/:id` - Get car by ID
- `POST /api/cars` - Add new car (requires authentication)
- `PUT /api/cars/:id` - Update car (requires authentication and ownership)
- `DELETE /api/cars/:id` - Delete car (requires authentication and ownership)

## Database Schema

### Users Table
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- email (TEXT UNIQUE)
- password (TEXT - hashed)
- created_at (DATETIME)

### Cars Table
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER - foreign key)
- make (TEXT)
- model (TEXT)
- year (INTEGER)
- price (DECIMAL)
- mileage (INTEGER)
- fuel_type (TEXT)
- transmission (TEXT)
- description (TEXT)
- image (TEXT)
- created_at (DATETIME)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit your changes
5. Push to the branch
6. Create a Pull Request
