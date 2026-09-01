import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

/**
 * AWS SDK v3 S3 Client.
 * When running locally, it uses default credential provider chain (environment variables or AWS CLI profile).
 * When running in AWS App Runner / ECS, it automatically uses the attached IAM Role.
 */
export const s3Client = new S3Client({
  region: env.AWS_REGION,
});
