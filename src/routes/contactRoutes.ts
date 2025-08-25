import { Router } from 'express';
import { ContactController } from '../controllers/contactController';

const router = Router();
const contactController = new ContactController();

// POST /identify - Identify and reconcile contact information
router.post('/identify', (req, res) => contactController.identify(req, res));

// GET /health - Health check endpoint
router.get('/health', (req, res) => contactController.healthCheck(req, res));

export default router; 