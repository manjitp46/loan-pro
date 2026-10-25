import { Router } from 'express';
import { LoanController } from '../controllers/loanController';
import { SavedController } from '../controllers/savedController';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Loan Presets
router.get('/presets', LoanController.getPresets);

// Financial Calculator Endpoints
router.post('/calculate/emi', LoanController.calculateEmi);
router.post('/calculate/prepayment', LoanController.simulatePrepayment);
router.post('/calculate/balance-transfer', LoanController.calculateBalanceTransfer);
router.post('/calculate/eligibility', LoanController.calculateEligibility);
router.post('/calculate/floating-rate', LoanController.simulateFloatingRate);
router.post('/calculate/compare', LoanController.compareOffers);

// Saved & Shared Calculations
router.post('/saved', SavedController.save);
router.get('/saved', SavedController.list);
router.get('/saved/:code', SavedController.getByShareCode);
router.delete('/saved/:id', SavedController.delete);

export default router;
