# AWS Backend Migration Analysis — Golden Food Bowl (Phase 1)

## Executive Summary
This document provides a comprehensive, beginner-friendly analysis of the **Golden Food Bowl** project. It details the current frontend, state management, storage systems, and mock API services, and maps out the exact migration path to a full AWS production backend infrastructure (**Vercel + AWS App Runner + AWS RDS PostgreSQL + AWS S3 + AWS CloudFront + AWS Cognito**).

---

# Current Architecture

```
+-----------------------------------------------------------------------------------+
|                            CURRENT ARCHITECTURE                                  |
+-----------------------------------------------------------------------------------+
|  Frontend Framework:  Vite 8 + React 19 + React Router v7                         |
|  Deployment Target:   Vercel (Single-Page App with SPA rewrites in vercel.json)  |
|  State Management:    In-Memory Prototype Store (prototypeStore.js)               |
|  Local Storage:       Browser localStorage & sessionStorage (authStorage.js)     |
|  API Layer:           Abstraction Layer (apiClient.js) with fallback mock data    |
|  Static Assets:       Cloudinary CDN (Brand Logos) & Unsplash (Product Images)    |
+-----------------------------------------------------------------------------------+
```

---

# Frontend

- **Framework**: React 19 (`react: ^19.2.8`, `react-dom: ^19.2.8`).
- **Build Tool**: Vite 8 (`vite: ^8.2.0`).
- **Routing**: React Router DOM v7 (`react-router-dom: ^7.18.2`) using single-page client routing.
- **Icons**: Lucide React (`lucide-react: ^1.31.0`).
- **Structure**:
  - `src/pages/customer/`: Customer Web Application pages (Home, Menu Search, Categories, Cart, Checkout, Tracking, Profile, Offers).
  - `src/pages/admin/`: Admin Panel pages (Dashboard, Branch Duplicate/Create, Products/Menu Management, Customer Directory, Delivery Partner Onboarding, Reports).
  - `src/pages/support/`: Support Panel pages (Dashboard, Ticket Management, Order Status Query, Resolution).
  - `src/pages/delivery/`: Delivery Partner App pages (Partner Sign-In, Onboarding Verification, Gig/Order Assignment, Delivery Navigation, Wallet & Earnings).
  - `src/layouts/`: Dedicated layout components (`CustomerLayout.jsx`, `AdminLayout.jsx`, `SupportLayout.jsx`).
  - `src/services/api/`: Standardized REST API client modules (`authApi`, `productApi`, `orderApi`, `branchApi`, `categoryApi`, `customerApi`, `deliveryApi`, `notificationApi`, `reportApi`, `supportApi`).

---

# Backend

- **Current Backend**: **None (Client-side Prototype)**.
- **Current Data Layer**:
  - The application relies on `apiClient.js` which checks for `import.meta.env.VITE_API_BASE_URL`.
  - When `VITE_API_BASE_URL` is empty, `apiClient` falls back to `prototypeStore.js` (an in-memory store synchronized with `localStorage` under key `goldbowl-prototype-state`).
- **Target AWS Backend**:
  - Containerized **AWS App Runner** service running a Node.js / Express or NestJS REST API.
  - Connected securely to **AWS RDS PostgreSQL** inside a VPC.

---

# Database

- **Current Database**: **In-Memory / LocalStorage Mock Database**.
  - Default seed data defined in `src/data/mockData.js` (categories, branches, products, initial orders).
- **Target AWS Database**: **AWS RDS PostgreSQL**.
  - Fully relational PostgreSQL database hosting production tables for users, branches, categories, products, orders, order items, support issues, delivery partners, and notifications.

---

# Supabase Usage

- **Current Status**: Not directly integrated via npm package (no `@supabase/supabase-js` dependency in `package.json`).
- **Original Plan**: Was intended for Supabase Auth, Supabase Postgres DB, and Supabase File Storage.
- **AWS Replacement**:
  - Database: Replaced by **AWS RDS PostgreSQL**.
  - Authentication: Replaced by **AWS Cognito**.
  - File Storage: Replaced by **AWS S3** + **AWS CloudFront**.

---

# Cloudinary Usage

- **Current Status**: Used for hosting static brand logo assets directly via CDN URLs:
  - `https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png`
  - `https://res.cloudinary.com/dwmjz9csc/image/upload/v1787060691/Golden_bowl_-removebg-preview_yxaxp1.png`
- **AWS Replacement**:
  - Asset storage moved to **AWS S3 bucket** (`goldenbowl-media-assets`).
  - Served via **AWS CloudFront CDN** for low latency and global edge caching.

---

# Authentication

- **Current Implementation**:
  - Simulated role-based authentication managed in `authStorage.js` (`sessionStorage`).
  - Roles supported: `customer`, `admin`, `delivery`, `support`.
  - Tracks user objects, session flags, pending redirects, and delivery onboarding statuses.
- **Target AWS Authentication**: **AWS Cognito User Pools & Identity Pools**.
  - **Cognito User Pools**: Handles user registration, login, JWT token issuance, email/SMS OTP, and password resets.
  - **Custom User Attributes / Groups**: Maps roles (`Customer`, `Admin`, `DeliveryPartner`, `SupportAgent`).
  - **JWT Verification**: AWS App Runner API validates Cognito Bearer tokens on protected endpoints.

---

# Admin Panel

- **Path**: `/admin/*`
- **Key Features**:
  - **Dashboard**: Sales stats, order counts, active delivery fleet size, top branch volume alerts.
  - **Branch Management**: View branches, add new branch, duplicate branch menu from existing branch.
  - **Product/Menu Management**: Add new food item, edit details, toggle availability (in stock / out of stock), filter by veg/vegan.
  - **Delivery Partner Verification**: Onboarding pipeline, document status review, onboarding fee tracking (PAID / PENDING).
  - **Reports & Analytics**: Sales breakdown by branch, popular food items, order velocity.

---

# Support Panel

- **Path**: `/support/*`
- **Key Features**:
  - **Support Dashboard**: High-priority tickets, open issues list, active customer queries.
  - **Ticket Management**: Create new ticket, update issue status (`OPEN`, `IN_PROGRESS`, `RESOLVED`), change priority (`Low`, `Normal`, `High`).
  - **Order Tracking Query**: View order timeline for specific customer order IDs (e.g., `#BWL10245`).

---

# Delivery Panel

- **Path**: `/delivery/*`
- **Key Features**:
  - **Partner Onboarding**: Document upload (Driver License, Vehicle RC), onboarding fee payment state, profile verification.
  - **Active Orders & Gigs**: View assigned orders, pickup location, customer address.
  - **Delivery Navigation**: Turn-by-turn map view, delivery status workflow (`ASSIGNED` -> `PICKED_UP` -> `OUT_FOR_DELIVERY` -> `DELIVERED`).
  - **Wallet & Earnings**: Daily earnings summary, instant payout requests.

---

# API Routes

The frontend already has structured API client endpoints ready to connect to AWS:

| Domain | Frontend Service | Endpoint Path | Method | Purpose |
|---|---|---|---|---|
| Auth | `authApi.js` | `/auth/login` | POST | Authenticate user & issue JWT |
| Auth | `authApi.js` | `/auth/logout` | POST | Terminate session |
| Auth | `authApi.js` | `/auth/me` | GET | Fetch authenticated profile |
| Products | `productApi.js` | `/products` | GET | Fetch products (filters: category, search, vegOnly) |
| Products | `productApi.js` | `/products` | POST | Create menu item (Admin/Support) |
| Products | `productApi.js` | `/products/:id` | PUT / DELETE | Update or soft delete menu item |
| Products | `productApi.js` | `/products/:id/toggle-availability` | PATCH | Toggle product availability |
| Orders | `orderApi.js` | `/orders` | GET / POST | List orders / Place new customer order |
| Orders | `orderApi.js` | `/orders/:id/status` | PATCH | Update order status |
| Orders | `orderApi.js` | `/orders/:id/assign` | POST | Assign delivery partner |
| Branches | `branchApi.js` | `/branches` | GET / POST | Manage restaurant branches |
| Branches | `branchApi.js` | `/branches/:id/duplicate` | POST | Duplicate branch menu |
| Support | `supportApi.js` | `/issues` | GET / POST / PATCH | Manage support tickets |
| Delivery | `deliveryApi.js` | `/delivery/partners` | GET / POST / PATCH | Partner onboarding & status updates |

---

# Environment Variables

### Current Frontend Variables (`.env.example`):
```env
# AWS API Gateway / App Runner Backend Base URL
VITE_API_BASE_URL=FOUND (VALUE HIDDEN / UNSET FOR LOCAL)
```

### Future Production Environment Variables (Required for AWS Deployment):

#### Frontend (Vercel):
```env
VITE_API_BASE_URL = https://<app-runner-id>.us-east-1.awsapprunner.com/api/v1
VITE_AWS_COGNITO_USER_POOL_ID = us-east-1_XXXXX
VITE_AWS_COGNITO_CLIENT_ID = XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_AWS_CLOUDFRONT_URL = https://dXXXXXXXXXXXX.cloudfront.net
```

#### Backend API (AWS App Runner Environment Secrets):
```env
PORT = 8080
NODE_ENV = production
DATABASE_URL = postgresql://<db_user>:<db_password>@<rds-endpoint>.rds.amazonaws.com:5432/goldenbowl
AWS_REGION = us-east-1
AWS_COGNITO_USER_POOL_ID = us-east-1_XXXXX
AWS_COGNITO_CLIENT_ID = XXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_S3_BUCKET_NAME = goldenbowl-media-assets
AWS_CLOUDFRONT_DOMAIN = dXXXXXXXXXXXX.cloudfront.net
JWT_SECRET = FOUND (VALUE HIDDEN)
```

---

# File Upload System

- **Current Implementation**:
  - Image URLs are currently static string links (Cloudinary logos, Unsplash food images).
- **Target AWS File Upload Flow**:
  1. Frontend calls backend endpoint `/api/v1/uploads/presigned-url` requesting an upload URL.
  2. AWS App Runner generates a secure **AWS S3 Presigned PUT URL** using AWS SDK.
  3. Frontend uploads the image/video/document file directly from the browser to **AWS S3**.
  4. S3 stores the file in `s3://goldenbowl-media-assets/products/` or `/documents/`.
  5. S3 delivers assets through **AWS CloudFront CDN** (`https://cdn.goldenfoodbowl.com/products/item-1.jpg`).

---

# Database Tables Schema (PostgreSQL)

When AWS RDS PostgreSQL is created, the following relational tables will be migrated from `prototypeStore.js`:

```
+-------------------+       +-------------------+       +-------------------+
|      users        |       |     branches      |       |    categories     |
+-------------------+       +-------------------+       +-------------------+
| id (PK, UUID)     |       | id (PK, INT)      |       | id (PK, VARCHAR)  |
| name              |       | name              |       | name              |
| email (UNIQUE)    |       | area              |       | icon              |
| mobile            |       | distance          |       | display_order     |
| password_hash     |       | open (BOOL)       |       +-------------------+
| role (ENUM)       |       | menu_copied_from  |                 |
| created_at        |       +-------------------+                 |
+-------------------+                 |                           |
          |                           |                           v
          |                           |                 +-------------------+
          |                           +---------------->|     products      |
          |                                             +-------------------+
          |                                             | id (PK, INT)      |
          |                                             | category_id (FK)  |
          |                                             | name              |
          |                                             | price (NUMERIC)   |
          |                                             | original_price    |
          |                                             | calories          |
          |                                             | portion           |
          |                                             | rating            |
          |                                             | image_url         |
          |                                             | description       |
          |                                             | ingredients (ARRAY|
          |                                             | available (BOOL)  |
          |                                             | veg, vegan, sugar |
          |                                             +-------------------+
          |                                                       |
          v                                                       v
+-------------------------------------------------------------------+
|                              orders                               |
+-------------------------------------------------------------------+
| id (PK, VARCHAR: BWL10245)                                        |
| customer_id (FK -> users.id)                                      |
| branch_id (FK -> branches.id)                                     |
| driver_id (FK -> delivery_partners.id)                            |
| total_amount (NUMERIC)                                            |
| status (ENUM: CONFIRMED, PREPARING, READY_FOR_PICKUP, ASSIGNED...) |
| order_type (Delivery / Pickup)                                    |
| eta_minutes (INT)                                                 |
| created_at, updated_at                                            |
+-------------------------------------------------------------------+
          |                                                       |
          v                                                       v
+-------------------+                           +-------------------+
|    order_items    |                           |  support_issues   |
+-------------------+                           +-------------------+
| id (PK, UUID)     |                           | id (PK, VARCHAR)  |
| order_id (FK)     |                           | customer_id (FK)  |
| product_id (FK)   |                           | subject           |
| quantity (INT)    |                           | priority (ENUM)   |
| price (NUMERIC)   |                           | status (ENUM)     |
+-------------------+                           +-------------------+
```

---

# Important Business Logic

1. **Order State Machine**:
   `CONFIRMED` -> `PREPARING` -> `READY_FOR_PICKUP` -> `ASSIGNED` -> `PICKED_UP` -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
2. **Branch Duplication**:
   Copying all active menu items from a source branch to a newly established branch.
3. **Delivery Partner Onboarding Pipeline**:
   Registration -> Document Upload -> Admin Review (`VERIFIED` / `PENDING`) -> Onboarding Fee (`PAID` / `PENDING`) -> Active Fleet Authorization.
4. **Notifications Dispatch**:
   Role-targeted notifications (Customer, Admin, Support, Delivery) automatically triggered on order status changes or ticket logs.

---

# Vercel Configuration

- **File**: `vercel.json` at root directory.
- **Config**:
  ```json
  {
    "git": { "deploymentEnabled": true },
    "buildCommand": "npm --prefix vite-project run build",
    "outputDirectory": "vite-project/dist",
    "installCommand": "npm install --prefix vite-project",
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Vercel Behavior**: Ensures full SPA client routing so page reloads on `/customer/home`, `/admin`, `/support`, or `/delivery` load `index.html` cleanly.

---

# Git Configuration

- **Repository**: `https://github.com/shaikmuzammil2905/goldenbowl.git`
- **Branch**: `main`
- **Local Workspace**: `c:\Users\muzam\Desktop\golden bowl (1)\goldbowl-main\vite-project`

---

# AWS Migration Requirements

To complete Phase 2 & Phase 3 AWS Migration, we will need:
1. **AWS Account Access** (AWS Management Console credentials or AWS CLI Access Keys).
2. **AWS App Runner Backend API Repository** (Node.js/Express service).
3. **AWS RDS PostgreSQL Instance** (Free Tier db.t4g.micro or standard db.m6g).
4. **AWS S3 Bucket** for media assets (`goldenbowl-media-assets`).
5. **AWS CloudFront Distribution** linked to S3.
6. **AWS Cognito User Pool** with custom App Client credentials.

---

# Risks & Safeguards

| Risk | Beginner Explanation | Prevention / Safeguard |
|---|---|---|
| Downtime during migration | Web app stops working while changing backend | Keep fallback mock store active until AWS API is 100% verified |
| CORS issues | Web browser blocks requests between Vercel and AWS App Runner | Configure proper CORS headers (`Access-Control-Allow-Origin: *`) in Node backend |
| Exposing DB password | Putting database passwords in frontend code | Keep all DB credentials strictly inside AWS App Runner Environment Secrets |
| AWS Costs | Unexpected bills from AWS resources | Use AWS Free Tier resources (RDS db.t4g.micro, App Runner 1 vCPU / 2GB RAM, S3 5GB free) |

---

# Recommended Migration Order

```
[ PHASE 1: ANALYSIS & ARCHITECTURE PLAN ] (COMPLETED)
                     │
                     ▼
[ PHASE 2: AWS INFRASTRUCTURE SETUP ]
  ├── 1. Create AWS S3 Bucket & CloudFront CDN
  ├── 2. Create AWS Cognito User Pool (User Authentication)
  └── 3. Provision AWS RDS PostgreSQL Database
                     │
                     ▼
[ PHASE 3: BACKEND API DEVELOPMENT & APP RUNNER DEPLOYMENT ]
  ├── 1. Build Node.js / Express REST API (Auth, Products, Orders, Branches)
  ├── 2. Connect API to RDS PostgreSQL using Prisma / Kysely / PG client
  └── 3. Deploy container to AWS App Runner
                     │
                     ▼
[ PHASE 4: FRONTEND INTEGRATION & VERCEL DEPLOYMENT ]
  ├── 1. Update VITE_API_BASE_URL to point to AWS App Runner URL
  └── 2. Verify all 4 panels (Customer, Admin, Support, Delivery) live on Vercel
```
