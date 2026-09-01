# Production Amazon ECS Architecture Plan (Private Fargate Tasks)

**Date**: 2026-08-30  
**Target Platform**: Amazon ECS (Elastic Container Service) on AWS Fargate (Private Tasks) + Public Application Load Balancer (ALB)  
**Target AWS Region**: `eu-north-1` (Stockholm)  
**AWS Account ID**: `990565447037`  

---

## 💡 Simple Explanation of the Architecture (For Beginners)

In this production-ready setup, your system is organized into **3 strict security zones**:

```
                       [ PUBLIC INTERNET / VERCEL ]
                                    │
                                    │ HTTPS (Port 443) / HTTP (Port 80)
                                    ▼
       ┌──────────────────────────────────────────────────────────┐
       │   PUBLIC ZONE: Application Load Balancer (ALB)           │
       │   Public Subnets (`eu-north-1a`, `eu-north-1b`)         │
       │   Security Group: `goldenbowl-alb-sg`                    │
       └──────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP (Port 8080)
                                    │ [Traffic allowed ONLY from ALB]
                                    ▼
       ┌──────────────────────────────────────────────────────────┐
       │   PRIVATE ZONE 1: ECS Fargate Tasks (NO PUBLIC IP)       │
       │   Private Subnets (`AssignPublicIp: DISABLED`)           │
       │   Security Group: `goldenbowl-ecs-task-sg`               │
       └──────────────────────────────────────────────────────────┘
                                    │
                                    │ TCP PostgreSQL (Port 5432)
                                    │ [Traffic allowed ONLY from ECS Task]
                                    ▼
       ┌──────────────────────────────────────────────────────────┐
       │   PRIVATE ZONE 2: AWS RDS PostgreSQL Database            │
       │   Private Database Subnets (`PubliclyAccessible = No`)   │
       │   Security Group: `sg-09a4235ffb64c5844` (`default`)     │
       └──────────────────────────────────────────────────────────┘
```

1. **Public Front Door (ALB)**: The Application Load Balancer lives in Public Subnets. It accepts public web traffic on Ports 80 & 443 from Vercel.
2. **Private Backend Server (ECS Fargate Task)**: Your container runs in Private Subnets with **`AssignPublicIp: DISABLED`**. It has **NO public IP address** and cannot be reached from the internet. It accepts traffic ONLY from the ALB on Port 8080.
3. **Private Data Vault (RDS PostgreSQL)**: The database is private (`PubliclyAccessible = No`). It accepts connections on Port 5432 ONLY from `goldenbowl-ecs-task-sg`.

---

## 📋 Comprehensive Analysis of AWS Service Outbound Egress Requirements

| AWS Service | Access Requirement in Backend (`src/`) | Supported Egress Mechanism | Cost Category |
|---|---|---|---|
| **AWS S3** | `mediaService.ts` (Presigned URLs & media storage) | **S3 Gateway VPC Endpoint** (`com.amazonaws.eu-north-1.s3`) | **100% FREE** |
| **AWS ECR (API)** | Container image authorization & manifest fetch | ECR API Interface Endpoint (`com.amazonaws.eu-north-1.ecr.api`) OR NAT Gateway | Usage-based (\$0.01/hr) / NAT |
| **AWS ECR (DKR)** | Container image layer download | ECR DKR Interface Endpoint (`com.amazonaws.eu-north-1.ecr.dkr`) OR NAT Gateway | Usage-based (\$0.01/hr) / NAT |
| **CloudWatch Logs** | Container logging (`/ecs/goldenbowl-backend`) | Logs Interface Endpoint (`com.amazonaws.eu-north-1.logs`) OR NAT Gateway | Usage-based (\$0.01/hr) / NAT |
| **AWS Cognito** | `auth.ts` (JWT JWKS public key verification) | Outbound HTTPS via NAT Gateway | NAT Gateway Egress |
| **AWS Secrets Manager** | (Optional) Parameter loading | Secrets Manager Interface Endpoint OR Task Envs | Task Envs (**FREE**) |

---

## 🔒 SSL / TLS & AWS Certificate Manager (ACM) Plan

1. **Initial Testing Stage**:
   * ALB configured with HTTP Listener (Port 80) forwarding directly to ECS Fargate Target Group (Port 8080).
2. **Production Custom Domain Stage**:
   * **AWS Certificate Manager (ACM)** provides **100% FREE SSL/TLS certificates** for custom domains (e.g. `api.goldenbowl.com`).
   * ALB configured with:
     * **Listener 1 (Port 80)**: HTTP $\rightarrow$ 301 Redirect to HTTPS (Port 443).
     * **Listener 2 (Port 443)**: Decrypts SSL using ACM certificate and forwards HTTP (Port 8080) to ECS tasks.

---

# 🌟 FINAL_RECOMMENDED_ARCHITECTURE

The final production architecture uses a 3-tier security model with a Public Application Load Balancer, Private ECS Fargate Tasks (`AssignPublicIp: DISABLED`), and a Private AWS RDS PostgreSQL Database (`PubliclyAccessible: NO`).

```
Vercel (Frontend)
   │ (HTTPS)
   ▼
Public ALB (goldenbowl-alb-sg)
   │ (HTTP 8080)
   ▼
Private ECS Fargate Tasks (goldenbowl-ecs-task-sg)
   │ (TCP 5432 Private VPC IP)
   ▼
Private RDS PostgreSQL (sg-09a4235ffb64c5844)
```

---

# 🛡️ FINAL_SECURITY_GROUP_RULES

### 1. `goldenbowl-alb-sg`
* **VPC**: `vpc-0de320be326592b3e`
* **Inbound Rules**:
  * `HTTPS` (Port 443) $\leftarrow$ Source: `0.0.0.0/0` (Vercel / Public Internet)
  * `HTTP` (Port 80) $\leftarrow$ Source: `0.0.0.0/0` (HTTP to HTTPS Redirect)
* **Outbound Rules**:
  * `Custom TCP` (Port 8080) $\rightarrow$ Destination: `goldenbowl-ecs-task-sg` ONLY

### 2. `goldenbowl-ecs-task-sg`
* **VPC**: `vpc-0de320be326592b3e`
* **Inbound Rules**:
  * `Custom TCP` (Port 8080) $\leftarrow$ Source: `goldenbowl-alb-sg` ONLY
  * **NO Public Inbound Rules (`0.0.0.0/0`)**
* **Outbound Rules**:
  * `All Traffic` (`0.0.0.0/0`) $\rightarrow$ Outbound VPC Egress / Gateway Endpoints

### 3. RDS Security Group (`sg-09a4235ffb64c5844`)
* **VPC**: `vpc-0de320be326592b3e`
* **Inbound Rules**:
  * `PostgreSQL` (Port 5432) $\leftarrow$ Source: `goldenbowl-ecs-task-sg` ONLY
  * **NO `0.0.0.0/0` Rule Allowed**

---

# 🌐 FINAL_SUBNET_PLAN

* **ALB Subnets**: Public Subnets in `eu-north-1a` (`subnet-0a...`) and `eu-north-1b` (`subnet-0b...`) attached to Internet Gateway (`igw-0de320be326592b3e`).
* **ECS Task Subnets**: Private Subnets with `AssignPublicIp: DISABLED`.
* **RDS Subnets**: Private Database Subnets (`default-vpc-0de320be326592b3e`).

---

# ⚡ FINAL_EGRESS_PLAN

1. **Free AWS S3 Gateway Endpoint**: Attached directly to VPC Route Tables (`com.amazonaws.eu-north-1.s3`) at **\$0 cost**.
2. **Outbound Egress Option**:
   * **Cheapest Interface Endpoint Bundle**: S3 Gateway Endpoint (**FREE**) + ECR API, ECR DKR & CloudWatch Logs Endpoints = **~\$21.60 / month**.
   * **Single-AZ NAT Gateway**: Single egress path for ECR, CloudWatch, S3, Cognito JWKS, & external webhooks = **~\$32.40 / month**.

---

# ⚙️ FINAL_AWS_SERVICES

1. **AWS RDS PostgreSQL** (`goldenbowl-db`): Private database.
2. **Amazon ECS on AWS Fargate** (`goldenbowl-cluster`): Private task container runner.
3. **Application Load Balancer** (`goldenbowl-alb`): Public traffic entry point.
4. **AWS ECR** (`goldenbowl-backend-api`): Docker container registry.
5. **AWS S3** (`goldenbowl-media-990565447037`): Presigned media storage.
6. **AWS Cognito** (`goldenbowl-user-pool`): JWT authentication directory.
7. **Amazon CloudWatch** (`/ecs/goldenbowl-backend`): System log streaming.

---

# 💵 FINAL_COST_CONSIDERATIONS

| Component | Billing Category | AWS Free Tier Status | Estimated Monthly Cost |
|---|---|---|---|
| **AWS RDS PostgreSQL** | Database Compute & Storage | **Free Tier**: 750 hrs/mo `db.t4g.micro` + 20GB | **\$0.00** (Free Tier) |
| **AWS ECS Fargate** | Compute (0.25 vCPU, 0.5GB) | **Free Tier**: Trial compute credits | **~\$8.00 - \$10.00** (Usage based) |
| **Application Load Balancer** | Traffic Router | **Free Tier**: 750 hrs/mo LCU free (Year 1) | **\$0.00** (Year 1) / **~\$18.00** (Post Year 1) |
| **AWS S3 Storage** | Media Files | **Free Tier**: 5 GB storage + 20k GET / 2k PUT | **\$0.00** |
| **AWS CloudFront** | CDN Delivery | **Always Free**: 1 TB data transfer out/month | **\$0.00** |
| **AWS Cognito** | Auth Directory | **Always Free**: Up to 10,000 MAUs | **\$0.00** |
| **Amazon CloudWatch** | Log Ingestion | **Always Free**: 5 GB log ingestion/month | **\$0.00** |
| **AWS ECR** | Container Image Registry | **Free Tier**: 500 MB/month storage | **\$0.00 - \$0.50** |
| **AWS S3 Gateway Endpoint** | VPC Endpoint | **100% Free** (Gateway Endpoint) | **\$0.00** |
| **Egress (VPC Endpoints / NAT)** | Network Egress | **No Free Tier**: Interface Endpoints or NAT | **~\$21.60 - \$32.40 / month** |
| **TOTAL ESTIMATED MONTHLY COST** | — | **With Interface Endpoints**: **~\$29.00 - \$35.00 / month** | **With NAT Gateway**: **~\$40.00 - \$50.00 / month** |

---

# 🗺️ FINAL_CREATION_ORDER

When you give approval, we will create resources step-by-step in this exact order:

* **Step A**: Create `goldenbowl-alb-sg` Security Group (Ports 80/443 from Anywhere).
* **Step B**: Create `goldenbowl-ecs-task-sg` Security Group (Port 8080 from `goldenbowl-alb-sg`).
* **Step C**: Update RDS Security Group (`sg-09a4235ffb64c5844`) to allow Port 5432 from `goldenbowl-ecs-task-sg`.
* **Step D**: Create Free S3 Gateway VPC Endpoint (`com.amazonaws.eu-north-1.s3`).
* **Step E**: Create AWS ECR Repository (`goldenbowl-backend-api`) & Push Container Image.
* **Step F**: Create Application Load Balancer (`goldenbowl-alb`).
* **Step G**: Create ECS Task Definition & Deploy Private ECS Fargate Service (`goldenbowl-cluster`).
* **Step H**: Execute `npx prisma db push` inside private network.
* **Step I**: Connect Vercel frontend to ALB URL.
