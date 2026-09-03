import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8080', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  AWS_REGION: process.env.AWS_REGION || 'eu-north-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'goldenbowl-media-990565447037',
  AWS_CLOUDFRONT_URL: process.env.AWS_CLOUDFRONT_URL || 'https://d1111111111111.cloudfront.net',
  
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || '',
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || '',
  COGNITO_REGION: process.env.COGNITO_REGION || process.env.AWS_REGION || 'eu-north-1',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_TWMl8a3GZGEgds',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'y5NHIs1oZ6w0jvG37FKiSTSc',

  // Nodemailer SMTP (Email OTP)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'Golden Food Bowl <noreply@goldenbowl.com>',

  // Application Authentication Secret
  JWT_SECRET: process.env.JWT_SECRET || 'goldenbowl-fallback-jwt-secret-do-not-use-in-prod',

  FRONTEND_URL: process.env.FRONTEND_URL || '*',
};

