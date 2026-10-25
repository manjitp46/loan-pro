import { Request, Response } from 'express';
import { z } from 'zod';
import { FinancialMath } from '../services/financialMath';
import db from '../db/database';

const emiSchema = z.object({
  loanType: z.enum(['home', 'personal', 'car', 'education', 'business']).optional(),
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(100),
  tenureMonths: z.number().int().positive().max(600),
  processingFeePercent: z.number().min(0).max(20).optional().default(0),
  flatProcessingFee: z.number().min(0).optional().default(0),
  taxPercentOnFee: z.number().min(0).max(50).optional().default(18),
  downPayment: z.number().min(0).optional().default(0),
  startDate: z.string().optional(),
});

const prepaymentSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(100),
  tenureMonths: z.number().int().positive().max(600),
  strategy: z.enum(['reduce_tenure', 'reduce_emi']),
  extraMonthlyPayment: z.number().min(0).optional().default(0),
  annualPrepayment: z.number().min(0).optional().default(0),
  lumpSums: z
    .array(
      z.object({
        month: z.number().int().positive(),
        amount: z.number().positive(),
      })
    )
    .optional()
    .default([]),
  startDate: z.string().optional(),
});

const balanceTransferSchema = z.object({
  outstandingBalance: z.number().positive(),
  currentRate: z.number().positive().max(100),
  remainingTenureMonths: z.number().int().positive().max(600),
  newRate: z.number().positive().max(100),
  newTenureMonths: z.number().int().positive().max(600).optional(),
  newProcessingFeePercent: z.number().min(0).max(20).optional().default(0.5),
  newFlatFee: z.number().min(0).optional().default(0),
  foreclosurePenaltyPercent: z.number().min(0).max(20).optional().default(0),
  foreclosureFlatPenalty: z.number().min(0).optional().default(0),
});

const eligibilitySchema = z.object({
  loanType: z.enum(['home', 'personal', 'car', 'education', 'business']).default('home'),
  grossMonthlyIncome: z.number().positive(),
  existingMonthlyEmi: z.number().min(0).default(0),
  annualRate: z.number().positive().max(100),
  tenureYears: z.number().positive().max(50),
  foirPercent: z.number().min(10).max(90).optional(),
});

const floatingRateSchema = z.object({
  principal: z.number().positive(),
  initialRate: z.number().positive().max(100),
  tenureMonths: z.number().int().positive().max(600),
  strategy: z.enum(['adjust_tenure', 'adjust_emi']).default('adjust_emi'),
  rateChanges: z.array(
    z.object({
      month: z.number().int().positive(),
      newRate: z.number().positive().max(100),
    })
  ),
});

const comparisonSchema = z.object({
  offers: z.array(
    z.object({
      id: z.string(),
      bankName: z.string(),
      principal: z.number().positive(),
      annualRate: z.number().positive().max(100),
      tenureMonths: z.number().int().positive().max(600),
      processingFeePercent: z.number().min(0).default(0),
      flatProcessingFee: z.number().min(0).default(0),
      otherCharges: z.number().min(0).default(0),
    })
  ).min(1).max(8),
});

export class LoanController {
  public static getPresets(req: Request, res: Response): void {
    try {
      const presets = db.prepare('SELECT * FROM loan_presets').all();
      const mapped = presets.map((p: any) => ({
        id: p.id,
        type: p.type,
        name: p.name,
        defaultAmount: p.default_amount,
        minAmount: p.min_amount,
        maxAmount: p.max_amount,
        stepAmount: p.step_amount,
        defaultRate: p.default_rate,
        minRate: p.min_rate,
        maxRate: p.max_rate,
        stepRate: p.step_rate,
        defaultTenureYears: p.default_tenure_years,
        minTenureYears: p.min_tenure_years,
        maxTenureYears: p.max_tenure_years,
        defaultProcessingFeePercent: p.default_processing_fee_percent,
        defaultDownPaymentPercent: p.default_down_payment_percent,
        description: p.description,
      }));
      res.json({ success: true, presets: mapped });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static calculateEmi(req: Request, res: Response): void {
    try {
      const validated = emiSchema.parse(req.body);
      const result = FinancialMath.calculateEmi(validated);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static simulatePrepayment(req: Request, res: Response): void {
    try {
      const validated = prepaymentSchema.parse(req.body);
      const result = FinancialMath.simulatePrepayment(validated);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static calculateBalanceTransfer(req: Request, res: Response): void {
    try {
      const validated = balanceTransferSchema.parse(req.body);
      const result = FinancialMath.calculateBalanceTransfer(validated);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static calculateEligibility(req: Request, res: Response): void {
    try {
      const validated = eligibilitySchema.parse(req.body);
      const result = FinancialMath.calculateEligibility(validated);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static simulateFloatingRate(req: Request, res: Response): void {
    try {
      const validated = floatingRateSchema.parse(req.body);
      const result = FinancialMath.simulateFloatingRate(validated);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static compareOffers(req: Request, res: Response): void {
    try {
      const validated = comparisonSchema.parse(req.body);
      const result = FinancialMath.compareLoanOffers(validated.offers);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
