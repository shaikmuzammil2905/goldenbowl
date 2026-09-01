# Amazon ECS Backend Migration & Architecture Analysis

**Date**: 2026-08-30  
**Target Platform**: Amazon ECS (Elastic Container Service) / ECS Express Mode  
**Region**: `eu-north-1` (Stockholm)  
**AWS Account ID**: `990565447037`  

---

## 💡 What is Amazon ECS? (Explained in Simple Language for Beginners)

AWS App Runner was originally a simple wrapper around container hosting. As of April 30, 2026, AWS is directing all container workloads to **Amazon ECS (Elastic Container Service)**.

Think of **Amazon ECS** as a **Cloud Container Captain**:
1. You give ECS your container (`backend/Dockerfile`).
2. ECS launches your backend container on AWS's serverless infrastructure (AWS Fargate).
3. ECS manages running your app, streaming logs to CloudWatch, and connecting your server securely to your private PostgreSQL database.

---

## 🏗️ New Target Architecture Overview

```
                                [ AWS CLOUD: eu-north-1 ]
                                
    Vercel Frontend ───(HTTPS API)───► Amazon ECS Service
 (goldenbowl.vercel.app)               (goldenbowl-backend-service)
                                                    │
                                                    ├───► Private AWS S3 (Media Storage)
                                                    ├───► AWS Cognito (User Auth)
                                                    ├───► Amazon CloudWatch (Logs)
                                                    │
                                                    ▼ [Private VPC Network]
                                             AWS RDS PostgreSQL
                                             (goldenbowl-db: Private)
```

---

## 📋 Comprehensive Analysis of the 21 Checkpoints

| # | Checkpoint Item | Current Status & Finding | Impact on ECS Migration |
|---|---|---|---|
| 1 | **RDS Configuration** | `goldenbowl-db` (PostgreSQL 16, `db.t4g.micro`) is **`Available`**. | 0 Changes needed. Ready for ECS. |
| 2 | **RDS VPC** | `vpc-0de320be326592b3e` (Default VPC). | 0 Changes needed. Matches ECS VPC. |
| 3 | **RDS Subnet Group** | `default-vpc-0de320be326592b3e` (Spans `eu-north-1a`, `1b`, `1c`). | Fully compatible with multi-AZ ECS. |
| 4 | **RDS Security Group** | `sg-09a4235ffb64c5844` (`default`). | Trusts `sg-0f752a7d4df6ee964` on Port 5432. |
| 5 | **Existing Security Group** | `sg-0f752a7d4df6ee964` (`goldenbowl-apprunner-sg`). | **REUSED** as ECS Task Security Group. No RDS SG changes needed! |
| 6 | **VPC Subnets** | Multi-AZ subnets in `vpc-0de320be326592b3e`. | 100% Compatible with ECS Fargate tasks. |
| 7 | **S3 Bucket** | `goldenbowl-media-990565447037` in `eu-north-1`. | Fully configured for presigned URL uploads. |
| 8 | **Cognito** | User Pool `goldenbowl-user-pool` & Client `goldenbowl-web-client`. | Auth verifier in `auth.ts` works out-of-the-box. |
| 9 | **Backend Dockerfile** | `backend/Dockerfile` multi-stage `node:22-alpine` image. | **100% Ready** for ECR/ECS container build. |
| 10 | **Environment Variables** | `NODE_ENV`, `PORT`, `DATABASE_URL`, `COGNITO_*`, `AWS_S3_*`. | Managed in ECS Task Definition. |
| 11 | **Prisma Configuration** | `prisma/schema.prisma` configured for PostgreSQL. | Schema ready for database push. |
| 12 | **CloudWatch Requirements** | CloudWatch Log Group `/ecs/goldenbowl-backend`. | Log driver `awslogs` auto-streams container logs. |
| 13 | **IAM Requirements** | Need `ecsTaskExecutionRole` and `ecsTaskRole`. | Standard IAM roles; no hardcoded keys needed. |
| 14 | **ECS Cluster** | To be named `goldenbowl-cluster`. | Simple 1-click ECS cluster creation. |
| 15 | **ECS Task Definition** | `goldenbowl-backend-task` (0.25 vCPU, 512 MB RAM). | Cost-optimized serverless Fargate specification. |
| 16 | **ECS Service** | `goldenbowl-backend-service` in `vpc-0de320be326592b3e`. | Runs 1 container task linked to `sg-0f752a7d4df6ee964`. |
| 17 | **ECS Express Mode** | Simplified ECS deployment mode in AWS Console. | Preferred mode if enabled in region. |
| 18 | **Private RDS Connection** | ECS tasks run in `vpc-0de320be326592b3e` attached to `sg-0f752a7d4df6ee964`. | **SECURE & PRIVATE**. Local VPC connection without public IP. |
| 19 | **Is NAT Gateway Required?** | **NO**. ECS tasks with `AssignPublicIp: ENABLED` reach S3 & Cognito directly via VPC IGW. | **Saves \$30-\$40/month!** |
| 20 | **Is ALB Required?** | **NO for initial setup** (Task Public IP / Direct HTTPS endpoint used). | Optional future addition for custom domain SSL. |
| 21 | **Expected Monthly Cost** | RDS (Free Tier \$0) + S3 (\$0) + Cognito (\$0) + ECS Task (~\$8-\$10). | **Total Estimated Cost: \$0 - \$10 / month**. |

---

## 🔒 Security & Isolation Guarantee

> [!IMPORTANT]
> 1. **RDS Remains Private**: `PubliclyAccessible = No` is strictly preserved.
> 2. **No Exposed Credentials**: No AWS secret keys in frontend or Git.
> 3. **No Disruption**: Supabase and Cloudinary code in frontend remain intact.

---

## 🗺️ Recommended Step-by-Step ECS Migration Order

1. **Step 1**: Create AWS ECR Repository (`goldenbowl-backend-api`) to store the backend container image.
2. **Step 2**: Create IAM Execution & Task Roles (`ecsTaskExecutionRole`).
3. **Step 3**: Push Docker container image to ECR repository.
4. **Step 4**: Create ECS Cluster (`goldenbowl-cluster`) and Task Definition (`goldenbowl-backend-task`).
5. **Step 5**: Deploy ECS Service attached to VPC `vpc-0de320be326592b3e` and Security Group `sg-0f752a7d4df6ee964`.
6. **Step 6**: Execute Prisma schema push (`npx prisma db push`) against `goldenbowl-db` inside the VPC.
7. **Step 7**: Update Vercel `VITE_API_BASE_URL` to point to the live ECS backend API.
