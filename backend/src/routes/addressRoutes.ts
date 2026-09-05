import { Router } from 'express';
import { addressController } from '../controllers/addressController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Routes for customer addresses
router.get('/:id/addresses', authenticateToken, addressController.getAddresses);
router.post('/:id/addresses', authenticateToken, addressController.createAddress);
router.put('/:id/addresses/:addressId', authenticateToken, addressController.updateAddress);
router.delete('/:id/addresses/:addressId', authenticateToken, addressController.deleteAddress);

export const addressRoutes = router;
