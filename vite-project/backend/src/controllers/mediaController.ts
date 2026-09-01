import { Request, Response, NextFunction } from 'express';
import { MediaService } from '../services/mediaService.js';

export class MediaController {
  static async getPresignedUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileName, fileType, folder } = req.body;
      const result = await MediaService.generatePresignedUploadUrl(fileName, fileType, folder);
      res.status(200).json({
        success: true,
        message: 'Presigned upload URL generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPresignedDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { objectKey } = req.query;
      const result = await MediaService.generatePresignedDownloadUrl(objectKey as string);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
