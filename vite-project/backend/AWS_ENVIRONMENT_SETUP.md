# AWS Environment Variables Setup Guide (Beginner Friendly)

This document explains every single environment variable required by your Golden Food Bowl backend API and frontend application. It explains **what the variable does**, **where to find its value in AWS**, and **how to set it up**.

---

## Backend Environment Variables (AWS App Runner / Local `.env`)

### 1. `NODE_ENV`
* **What it does**: Tells the backend whether it is running in testing/development mode (`development`) or live production mode (`production`).
* **Where to get it**: Set to `production` when deploying to AWS App Runner. Set to `development` when running on your computer.

### 2. `PORT`
* **What it does**: The port number where your backend Express server listens for web requests.
* **Where to get it**: Default is `8080`.

### 3. `DATABASE_URL`
* **What it does**: The connection string that allows your Node.js backend to connect to your AWS RDS PostgreSQL database.
* **Where to get it**:
  1. Go to **AWS Console** $\rightarrow$ Search **RDS** $\rightarrow$ Click **Databases** $\rightarrow$ Click **`goldenbowl-db`**.
  2. Copy the **Endpoint** under *Connectivity & security* (e.g. `goldenbowl-db.cxxxxxxxxx.eu-north-1.rds.amazonaws.com`).
  3. Combine it into this format:
     `postgresql://postgres:<YOUR_MASTER_PASSWORD>@<RDS_ENDPOINT>:5432/goldenbowl?schema=public`

### 4. `AWS_REGION`
* **What it does**: Specifies which AWS geographic data center your services live in.
* **Where to get it**: Found in the top-right corner of your AWS Console screen. For your account: `eu-north-1` (Stockholm).

### 5. `AWS_S3_BUCKET`
* **What it does**: Tells the backend which private AWS S3 storage bucket to generate secure upload links for.
* **Where to get it**: The S3 bucket name you created: `goldenbowl-media-990565447037`.

### 6. `AWS_CLOUDFRONT_URL`
* **What it does**: The public web address used by CloudFront to deliver images quickly to users.
* **Where to get it**: Go to **AWS Console** $\rightarrow$ Search **CloudFront** $\rightarrow$ Copy your Distribution Domain Name (e.g. `https://d1111111111111.cloudfront.net`).

### 7. `COGNITO_USER_POOL_ID`
* **What it does**: Identifies your AWS Cognito user directory for validating user logins.
* **Where to get it**:
  1. Go to **AWS Console** $\rightarrow$ Search **Cognito** $\rightarrow$ Click **User pools**.
  2. Copy the **User pool ID** (e.g. `eu-north-1_xxxxxxxxx`).

### 8. `COGNITO_CLIENT_ID`
* **What it does**: The App Client ID that connects your app to Cognito.
* **Where to get it**: Inside your Cognito User Pool $\rightarrow$ Click **App integration** tab $\rightarrow$ Copy **App client ID**.

### 9. `COGNITO_REGION`
* **What it does**: The AWS region where Cognito is running (`eu-north-1`).

### 10. `FRONTEND_URL`
* **What it does**: Security rule (CORS) that specifies which web addresses are allowed to talk to your backend API.
* **Where to get it**: Your Vercel frontend URL (e.g. `https://goldenbowl.vercel.app` or `http://localhost:5173`).

---

## Frontend Environment Variables (Vercel)

| Variable Name | Purpose | Example Value |
|---|---|---|
| `VITE_API_BASE_URL` | Connects your React website to your AWS App Runner REST API | `https://<app-runner-id>.us-east-1.awsapprunner.com/api` |

---

## Security Best Practices

> [!IMPORTANT]
> **No AWS Keys in Frontend**: Never put `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` inside your React frontend code or Vercel environment variables!
> **Production IAM Roles**: When running in AWS App Runner, AWS automatically provides secure IAM permissions to your server without needing hardcoded keys!
