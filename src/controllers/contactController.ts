import { Request, Response } from 'express';
import { ContactService } from '../services/contactService';
import { identifyRequestSchema } from '../validation/schemas';

export class ContactController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  async identify(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validationResult = identifyRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Invalid request data',
          details: validationResult.error.errors,
        });
        return;
      }

      const { email, phoneNumber } = validationResult.data;

      // Process the identification request
      const result = await this.contactService.identifyContact(email, phoneNumber?.toString());

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in identify endpoint:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing the request',
      });
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'OK',
      message: 'Identity reconciliation service is running',
      timestamp: new Date().toISOString(),
    });
  }
} 