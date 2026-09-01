import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/aws.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class MediaService {
  /**
   * Generates a secure AWS S3 Presigned PUT URL for uploading a file directly from the browser.
   * The private S3 bucket is NOT publicly writable.
   */
  static async generatePresignedUploadUrl(fileName: string, fileType: string, folder: string = 'products') {
    const timeStamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectKey = `${folder}/${timeStamp}_${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: objectKey,
      ContentType: fileType,
    });

    try {
      // URL expires in 15 minutes (900 seconds)
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

      // Generate public S3 URL or CloudFront URL for storing in DB
      const s3Url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${objectKey}`;
      const cloudFrontUrl = env.AWS_CLOUDFRONT_URL && !env.AWS_CLOUDFRONT_URL.includes('cloudfront.net')
        ? `${env.AWS_CLOUDFRONT_URL}/${objectKey}`
        : s3Url;

      return {
        uploadUrl,
        objectKey,
        publicUrl: cloudFrontUrl,
        expiresInSeconds: 900,
      };
    } catch (error: any) {
      logger.error('Error generating S3 presigned upload URL', error);
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
  }

  /**
   * Generates a secure AWS S3 Presigned GET URL for viewing a private document (e.g. Driver License).
   */
  static async generatePresignedDownloadUrl(objectKey: string) {
    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: objectKey,
    });

    try {
      const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return { downloadUrl, expiresInSeconds: 3600 };
    } catch (error: any) {
      logger.error('Error generating S3 presigned download URL', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }
}
