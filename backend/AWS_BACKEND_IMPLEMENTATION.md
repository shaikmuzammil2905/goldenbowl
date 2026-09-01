# AWS Backend Implementation Summary (Phase 3)

## Overview
This document summarizes the **Node.js + TypeScript + Express + Prisma** backend API created for **Golden Food Bowl**. The backend connects your frontend application directly to your production **AWS RDS PostgreSQL** database, **AWS S3** private file storage, and **AWS Cognito** user authentication.

---

## 1. Directory Structure Created

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts          # Environment variables configuration
│   │   ├── prisma.ts       # Prisma ORM database connection singleton
│   │   └── aws.ts          # AWS SDK v3 S3 client setup
│   ├── controllers/
│   │   ├── adminController.ts        # Branch creation, menu duplication & stats
│   │   ├── authController.ts         # User login, sign-up & identity
│   │   ├── deliveryController.ts     # Partner onboarding & status updates
│   │   ├── mediaController.ts        # Presigned S3 upload & download URLs
│   │   ├── notificationController.ts # Role notifications
│   │   ├── orderController.ts        # Order placement, status flow & driver assignment
│   │   ├── paymentController.ts      # Payment transaction processing
│   │   ├── productController.ts      # Menu items CRUD & category management
│   │   ├── supportController.ts      # Help ticket creation & status updates
│   │   └── userController.ts         # User profile management
│   ├── middleware/
│   │   ├── auditLogger.ts     # Records administrative audit logs to DB
│   │   ├── auth.ts            # Validates AWS Cognito JWT Bearer tokens
│   │   ├── errorHandler.ts    # Global Express error handler
│   │   └── roleGuard.ts       # Role authorization (ADMIN, SUPPORT, DELIVERY, CUSTOMER)
│   ├── repositories/
│   │   ├── orderRepository.ts
│   │   ├── productRepository.ts
│   │   └── userRepository.ts
│   ├── routes/
│   │   ├── adminRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── deliveryRoutes.ts
│   │   ├── index.ts           # Primary router mounting all 12 API groups
│   │   ├── mediaRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   ├── orderRoutes.ts
│   │   ├── paymentRoutes.ts
│   │   ├── productRoutes.ts
│   │   ├── supportRoutes.ts
│   │   └── userRoutes.ts
│   ├── services/
│   │   ├── branchService.ts
│   │   ├── deliveryService.ts
│   │   ├── mediaService.ts     # AWS S3 Presigned URL & CloudFront generator
│   │   ├── orderService.ts
│   │   ├── productService.ts
│   │   └── supportService.ts
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── utils/
│   │   ├── errors.ts          # Custom AppError classes
│   │   └── logger.ts          # Timestamped logger utility
│   ├── validators/
│   │   └── index.ts           # Zod schema request validation
│   ├── app.ts                 # Express app configuration with Helmet, CORS, Rate Limiter
│   └── server.ts              # Server startup & graceful shutdown
├── prisma/
│   └── schema.prisma          # PostgreSQL relational database schema
├── .env.example
├── Dockerfile                 # Multi-stage production container build for AWS App Runner
├── package.json
└── tsconfig.json
```

---

## 2. API Endpoint Groups Created

| API Group | Path | Supported Methods | Roles Allowed | Purpose |
|---|---|---|---|---|
| Health Check | `GET /health` | GET | Public | App Runner health monitoring |
| Auth | `/api/auth` | POST, GET | Public / All | Login, Logout, Profile |
| Users | `/api/users` | GET | ADMIN, SUPPORT | List and view user accounts |
| Products | `/api/products` | GET, POST, PUT, PATCH, DELETE | Public / ADMIN, SUPPORT | Manage food items & availability |
| Categories | `/api/categories` | GET, POST | Public / ADMIN | Manage menu categories |
| Orders | `/api/orders` | GET, POST, PATCH | Authenticated / ADMIN, SUPPORT, DELIVERY | Place & track orders, update status |
| Payments | `/api/payments` | GET, POST | Authenticated | Process transactions |
| Support | `/api/support` | GET, POST, PATCH | Authenticated / ADMIN, SUPPORT | Support ticket lifecycle |
| Delivery | `/api/delivery` | GET, POST, PATCH | ADMIN, SUPPORT, DELIVERY | Onboarding & partner verification |
| Media | `/api/media` | GET, POST | Authenticated | S3 Presigned Upload & Download URLs |
| Admin | `/api/admin` | GET, POST | ADMIN | Branch duplication & dashboard metrics |
| Notifications | `/api/notifications` | GET, POST | Authenticated / ADMIN, SUPPORT | Targeted notifications |

---

## 3. Database Schema Models (`schema.prisma`)

* `User`: Stores customer, admin, support, and delivery accounts linked to Cognito `sub`.
* `Branch`: Stores restaurant locations and menu duplication lineage.
* `Category`: Menu categories (Signature Bowls, Rice Meals, Wraps, Salads, Sides, Drinks).
* `Product`: Food items with price, calories, portion, ratings, veg/vegan flags, and image URL.
* `Order`: Customer orders with status workflow (`CONFIRMED` -> `PREPARING` -> `DELIVERED`).
* `OrderItem`: Line items for each order.
* `SupportIssue`: Help tickets with priority (`Low`, `Normal`, `High`) and status (`OPEN`, `IN_PROGRESS`, `RESOLVED`).
* `DeliveryPartner`: Partner onboarding records, vehicle info, fee status (`PAID`), and ratings.
* `Notification`: Targeted role notifications.
* `AuditLog`: Security audit trail for admin actions.

---

## 4. What Remains Active vs Pending

* **Active & Preserved**: Your existing Vite + React frontend code (`vite-project/`) remains completely intact. Supabase and Cloudinary mock functions are preserved until backend integration testing is complete.
* **Pending**:
  1. Running Prisma Database Migration (`npx prisma db push` or `npx prisma migrate dev`) against your newly launched AWS RDS PostgreSQL instance once its status turns to *Available*.
  2. Deploying backend container to **AWS App Runner**.
  3. Updating frontend `VITE_API_BASE_URL` to point to the live AWS App Runner API.
