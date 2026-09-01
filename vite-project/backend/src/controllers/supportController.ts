import { Request, Response, NextFunction } from 'express';
import { SupportService } from '../services/supportService.js';

export class SupportController {
  static async getIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const issues = await SupportService.getIssues();
      res.status(200).json({ success: true, data: issues });
    } catch (error) {
      next(error);
    }
  }

  static async createIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const issue = await SupportService.createIssue(req.body);
      res.status(201).json({ success: true, message: 'Support ticket logged', data: issue });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const issue = await SupportService.updateIssueStatus(req.params.id as string, status);
      res.status(200).json({ success: true, message: 'Ticket status updated', data: issue });
    } catch (error) {
      next(error);
    }
  }
}
