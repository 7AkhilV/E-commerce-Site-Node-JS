# E-commerce-Site-Node-JS
E-commerce site - MVC model

live: https://e-commerce-site-xyw1.onrender.com

## Features

- User Authentication: Users can sign up, log in, and reset their passwords.
- Product Management: Admins can add, edit, and delete products.
- Shopping Cart: Users can add products to their shopping cart and place orders.
- Order History: Users can view their order history and download invoices.
- Pagination: Products are paginated for better user experience.
- Error Handling: Custom error handling with descriptive error messages.
- Middleware: Implements middleware for authentication and validation.
- File Upload: Supports uploading product images using multer.
- Payment Integration: Integrated with Stripe for payment processing.
- Responsive design for mobile and desktop

## MVC Architecture

The project is organized using the MVC design pattern:

1. **Model**: The `models` directory contains Mongoose models for representing data in the MongoDB database. 
The `User` and `Product` models define the schema and interact with the database.

2. **View**: The `views` directory contains the EJS (Embedded JavaScript) templates for rendering HTML pages. 
These templates are used to generate dynamic HTML content based on data from the models.

3. **Controller**: The `controllers` directory contains the logic and handling of requests and responses. 
Each route has its own controller that interacts with the models and renders the appropriate view.

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine
- MongoDB database running

### Installation

1. Clone the repository: `git clone https://github.com/7AkhilV/E-commerce-Site-Node-JS.git`
2. Install dependencies: `npm install`
3. Set environment variables in a `.env` file

Set up environment variables.

MONGODB_URI=your_mongodb_connection_string
STRIPE_KEY=your_stripe_api_key

### Usage

1. Start the server: `npm start`
2. Open the site in your browser: `http://localhost:3000`

