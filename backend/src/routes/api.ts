import { Router } from 'express';
import { LoanController } from '../controllers/loanController';
import { SavedController } from '../controllers/savedController';
import { SettingsController } from '../controllers/settingsController';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Loan Presets & Management
router.get('/presets', LoanController.getPresets);
router.post('/presets', SettingsController.createPreset);
router.put('/presets/:id', SettingsController.updatePreset);
router.delete('/presets/:id', SettingsController.deletePreset);

// Site Settings & Look & Feel
router.get('/settings', SettingsController.getSettings);
router.post('/settings', SettingsController.updateSettings);

// Admin Diagnostics & Direct SQL Console
router.get('/admin/stats', SettingsController.getStats);
router.post('/admin/sql', SettingsController.executeSql);

// Financial Calculator Endpoints
router.post('/calculate/emi', LoanController.calculateEmi);
router.post('/calculate/prepayment', LoanController.simulatePrepayment);
router.post('/calculate/balance-transfer', LoanController.calculateBalanceTransfer);
router.post('/calculate/eligibility', LoanController.calculateEligibility);
router.post('/calculate/floating-rate', LoanController.simulateFloatingRate);
router.post('/calculate/compare', LoanController.compareOffers);
router.post('/calculate/multi-scenario', LoanController.calculateMultiScenario);

// Saved & Shared Calculations
router.post('/saved', SavedController.save);
router.get('/saved', SavedController.list);
router.get('/saved/:code', SavedController.getByShareCode);
router.delete('/saved/:id', SavedController.delete);

export default router;
