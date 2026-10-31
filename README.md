# CK Fashion - E-Commerce Backend API

A robust, scalable RESTful API built for an e-commerce platform (**CK Fashion / Cloth Shop**). Built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**, this backend handles authentication, product and variant catalog management, multi-level category structures, order processing & analytics, inventory tracking, banner management, and user reviews.

---

## 🚀 Features

- **User & Admin Authentication**:
  - Secure registration & authentication using JWT (`jsonwebtoken`) and password hashing with `bcrypt`.
  - Role-based authorization via custom middlewares (`authMiddleware` and `adminAuthMiddleware`).
  - Mobile phone verification & OTP dispatch (SMS service integration & Email notifications via Nodemailer).
  - Password recovery workflow (forget & reset password tokens).
  - Admin user management with block/unblock capabilities.

- **Product & Variant Catalog**:
  - Full CRUD capabilities for products and product variants (sizes, colors, stock level, SKU).
  - Image uploading and management with Cloudinary and ImageKit via Multer middleware.
  - Active/Inactive status toggle for products and variants.

- **Category Management**:
  - Multi-level hierarchical category trees (Parent-Child category mapping).
  - Category creation with image attachments.

- **Order Management & Analytics**:
  - Customer order placement, tracking, cancellations, and return requests.
  - Admin order status workflow (processing, shipped, delivered, returns approval/rejection).
  - Comprehensive admin dashboard analytics: order summaries, revenue stats, monthly sales charts, and top-selling products.

- **Inventory Control & Transactions**:
  - Real-time stock transaction logging for purchase, sales, and return events.

- **Hero Banner Management**:
  - Manage dynamic homepage hero section banners and promotions.

- **Product Reviews & Ratings**:
  - Customer ratings & review submission with multi-image support.
  - Aggregated product rating retrieval.

---

## 🛠️ Tech Stack

- **Runtime Environment**: [Node.js](https://nodejs.org/) (ES Modules)
- **Web Framework**: [Express.js v5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
- **Authentication**: JSON Web Tokens (JWT) & bcrypt
- **File & Media Handling**: [Multer](https://github.com/expressjs/multer), [Cloudinary](https://cloudinary.com/), and ImageKit
- **Email Service**: [Nodemailer](https://nodemailer.com/) (SMTP)
- **Push & Cloud Services**: Firebase Admin SDK

---

## 📂 Project Structure

```text
Backend/
├── src/
│   ├── config/          # External services configuration (Firebase Admin SDK, etc.)
│   ├── controllers/     # Request handlers & core business logic
│   ├── database/        # Database connection configuration (db.js)
│   ├── middleware/      # Auth, AdminAuth, and Multer upload middlewares
│   ├── models/          # Mongoose database models and schemas
│   ├── routes/          # Express route definitions
│   ├── utils/           # Helper services (Token generation, Email, SMS, Cloud uploads)
│   ├── app.js           # Express application setup & middleware configuration
│   └── server.js        # Server entry point & database listener
├── .env                 # Environment variables configuration
├── .gitignore           # Git ignored files
├── package.json         # Project dependencies and scripts
└── README.md            # Project documentation
```

---

## ⚙️ Prerequisites & Environment Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **MongoDB** database instance (Local or MongoDB Atlas)

### 2. Environment Variables Configuration
Create a `.env` file in the root `Backend/` directory and configure the following variables:

```env
# Server Configuration
PORT=9200
FRONTEND_URL=http://localhost:5173

# Database Connection
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Razorpay test payments (use Test Mode keys from the Razorpay Dashboard)
RAZORPAY_MODE=test
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret

# Cloudinary Integration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ImageKit Integration
IMAGE_KIT_PUBLIC_KEY=your_imagekit_public_key
IMAGE_KIT_PRIVATE_KEY=your_imagekit_private_key
IMAGE_KIT_URL_ENDPOINT=your_imagekit_url_endpoint

# SMTP Mailer Setup
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
ADMIN_EMAIL=orders@yourdomain.com

# SMS API Configuration (OTP)
SMS_API_KEY=your_sms_api_key
SMS_DEVICE_ID=your_sms_device_id
```

Online checkout only accepts `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from the backend environment. Keep `RAZORPAY_MODE=test` while testing; the backend rejects a non-test Key ID in this mode. The browser receives only the public Key ID from the server. Restart the backend after changing environment values.

To test checkout, select **Pay Online** on the checkout page and use the payment details provided by Razorpay's Test Mode in your Dashboard. Test payments do not collect real money. A verified payment is saved to the order as `paymentStatus: PAID`, with its Razorpay order and payment IDs. Failed or closed checkouts remain unpaid.

---

## 🏃 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
Runs the server with `nodemon` for auto-reloading upon file changes:
```bash
npm run dev
```

### 3. Start Production Server
```bash
npm start
```

The API server will run at `http://localhost:9200` (or your configured `PORT`).

---

## 📑 API Reference

Base URL: `http://localhost:9200/api`

### 👤 User & Auth Routes (`/api/user`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/user/create-user` | Register a new user account | Public |
| `POST` | `/api/user/login` | Login with user credentials | Public |
| `POST` | `/api/user/send-otp` | Send OTP code to phone number | Public |
| `POST` | `/api/user/verify-phone` | Verify phone number for login | Public |
| `GET` | `/api/user/get` | Get logged-in user profile | User Token |
| `GET` | `/api/user/get/:id` | Get user details by ID | Public |
| `PUT` | `/api/user/edit-user/:id` | Update user details & profile picture | User Token |
| `POST` | `/api/user/forget-password` | Request password reset token | Public |
| `POST` | `/api/user/reset-password/:resetToken` | Reset password using token | Public |
| `POST` | `/api/user/create-admin` | Create admin user | Public |
| `POST` | `/api/user/login-admin` | Admin login | Public |
| `GET` | `/api/user/get-all` | Get all registered users | Admin Token |
| `PATCH` | `/api/user/toggle-block/:id` | Block or unblock a user | Admin Token |
| `POST` | `/api/user/change-admin-password` | Update admin password | Admin Token |

---

### 👗 Product Routes (`/api/product`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/product/get` | Fetch all products with filter options | Public |
| `GET` | `/api/product/get-product/:id` | Get single product details | Public |
| `POST` | `/api/product/add` | Create product with images | Admin Token |
| `PATCH` | `/api/product/edit/:id` | Update product details | Admin Token |
| `DELETE` | `/api/product/delete/:id` | Delete a product | Admin Token |
| `PATCH` | `/api/product/toggle-status/:id` | Toggle product active status | Admin Token |

---

### 🎨 Product Variant Routes (`/api/variant`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/variant/get-product-variants/:productId` | List variants of a product | Public |
| `GET` | `/api/variant/get-variant/:id` | Get variant by ID | Public |
| `POST` | `/api/variant/add` | Add variant with images | Admin Token |
| `PUT` | `/api/variant/edit/:id` | Update variant details | Admin Token |
| `DELETE` | `/api/variant/delete/:id` | Delete a variant | Admin Token |
| `PATCH` | `/api/variant/toggle-status/:id` | Toggle variant active status | Admin Token |

---

### 🏷️ Category Routes (`/api/category`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/category` | Get flat list of categories | Public |
| `GET` | `/api/category/tree` | Get hierarchical category tree | Public |
| `GET` | `/api/category/:id` | Get category by ID | Public |
| `POST` | `/api/category` | Create new category | Admin Token |
| `PUT` | `/api/category/:id` | Update category details | Admin Token |
| `DELETE` | `/api/category/:id` | Delete a category | Admin Token |
| `PATCH` | `/api/category/:id/status` | Toggle category active status | Admin Token |

---

### 📦 Order Routes (`/api/orders`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Create/Place a new order | User Token |
| `GET` | `/api/orders/customer/:customerId` | Get orders for logged-in customer | User Token |
| `GET` | `/api/orders/:id` | Get order details by order ID | User Token |
| `PATCH` | `/api/orders/:id/cancel` | Cancel customer order | User Token |
| `PATCH` | `/api/orders/:id/request-return` | Submit return request | User Token |
| `GET` | `/api/orders` | Fetch all store orders | Admin Token |
| `GET` | `/api/orders/summary` | Get order status counters | Admin Token |
| `GET` | `/api/orders/analytics` | Get general sales & order analytics | Admin Token |
| `GET` | `/api/orders/monthly-sales` | Get monthly revenue analytics | Admin Token |
| `GET` | `/api/orders/top-products` | Get top-performing items | Admin Token |
| `PATCH` | `/api/orders/:id/status` | Update status (Pending/Shipped/Delivered) | Admin Token |
| `PATCH` | `/api/orders/:id/approve-return` | Approve return request | Admin Token |
| `PATCH` | `/api/orders/:id/reject-return` | Reject return request | Admin Token |

---

### 📊 Inventory Transaction Routes (`/api/transaction`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/transaction/purchase` | Log stock purchase transaction | Admin Token |
| `POST` | `/api/transaction/sale` | Log stock sale transaction | Admin Token |
| `POST` | `/api/transaction/return` | Log stock return transaction | Admin Token |

---

### 🖼️ Hero Section / Banner Routes (`/api/hero-section`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/hero-section/get` | Get active banners for frontend display | Public |
| `GET` | `/api/hero-section/get-banner` | List all promotional banners | Public |
| `GET` | `/api/hero-section/get-banner/:id` | Get banner by ID | Public |
| `POST` | `/api/hero-section/add-banner` | Upload banner image | Admin Token |
| `PUT` | `/api/hero-section/edit-banner/:id` | Edit banner details | Admin Token |
| `DELETE` | `/api/hero-section/delete-banner/:id` | Delete a banner | Admin Token |
| `PATCH` | `/api/hero-section/toggle-banner-status/:id` | Toggle banner active status | Admin Token |

---

### ⭐ Product Review Routes (`/api/reviews`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reviews/product/:productId` | Get reviews for a product | Public |
| `GET` | `/api/reviews/user/:customerId` | Get user's submitted reviews | Public |
| `POST` | `/api/reviews/add` | Submit a review with images | User Token |
| `PUT` | `/api/reviews/edit/:id` | Edit submitted review | User Token |
| `DELETE` | `/api/reviews/delete/:id` | Delete a review | User Token |

---


## 👨‍💻 Author

**Manthan Rathod**
