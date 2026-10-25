import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { LoanPreset, SavedCalculationRecord } from '../types/loan';

const DB_DIR = process.env.DB_DIR || path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_FILE = process.env.DB_PATH || path.join(DB_DIR, 'loan_tool.db');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Create tables if they do not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS loan_presets (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      default_amount REAL NOT NULL,
      min_amount REAL NOT NULL,
      max_amount REAL NOT NULL,
      step_amount REAL NOT NULL,
      default_rate REAL NOT NULL,
      min_rate REAL NOT NULL,
      max_rate REAL NOT NULL,
      step_rate REAL NOT NULL,
      default_tenure_years REAL NOT NULL,
      min_tenure_years REAL NOT NULL,
      max_tenure_years REAL NOT NULL,
      default_processing_fee_percent REAL NOT NULL,
      default_down_payment_percent REAL NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_calculations (
      id TEXT PRIMARY KEY,
      share_code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      calculator_type TEXT NOT NULL,
      loan_type TEXT NOT NULL,
      input_data TEXT NOT NULL,
      result_summary TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_saved_share_code ON saved_calculations(share_code);
    CREATE INDEX IF NOT EXISTS idx_saved_calculator_type ON saved_calculations(calculator_type);
  `);

  // Seed default presets and settings if empty
  const count = db.prepare('SELECT count(*) as count FROM loan_presets').get() as { count: number };
  if (count.count === 0) {
    seedDefaultPresets();
    seedSampleCalculations();
  }

  const settingsCount = db.prepare('SELECT count(*) as count FROM site_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    seedDefaultSettings();
  } else {
    // Ensure new setting keys exist in older databases
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR IGNORE INTO site_settings (key, value, updated_at)
      VALUES ('supported_currencies', 'INR,USD,EUR,GBP,AED,CAD,AUD,SGD,JPY', ?)
    `).run(now);
  }
}

function seedDefaultSettings() {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
  `);
  const now = new Date().toISOString();
  const defaults: Record<string, string> = {
    site_title: 'LoanPro - Advanced Loan Comparison Platform',
    site_tagline: 'Institutional-Grade EMI & Loan Comparison Engine',
    brand_theme: 'emerald',
    default_currency: 'INR',
    supported_currencies: 'INR,USD,EUR,GBP,AED,CAD,AUD,SGD,JPY',
    announcement_banner: 'Special 2026 Festive Home Loan Rates: Starting from 8.35% p.a.! Compare offers today.',
    banner_enabled: 'true',
    contact_email: 'support@loanpro.local',
    footer_disclaimer: 'LoanPro financial calculations and comparison reports are for estimation purposes.',
  };

  const transaction = db.transaction((entries) => {
    for (const [k, v] of Object.entries(entries)) {
      insert.run(k, v, now);
    }
  });
  transaction(defaults);
}

function seedDefaultPresets() {
  const insert = db.prepare(`
    INSERT INTO loan_presets (
      id, type, name, default_amount, min_amount, max_amount, step_amount,
      default_rate, min_rate, max_rate, step_rate,
      default_tenure_years, min_tenure_years, max_tenure_years,
      default_processing_fee_percent, default_down_payment_percent, description
    ) VALUES (
      @id, @type, @name, @defaultAmount, @minAmount, @maxAmount, @stepAmount,
      @defaultRate, @minRate, @maxRate, @stepRate,
      @defaultTenureYears, @minTenureYears, @maxTenureYears,
      @defaultProcessingFeePercent, @defaultDownPaymentPercent, @description
    )
  `);

  const presets: LoanPreset[] = [
    {
      id: 'home_loan',
      type: 'home',
      name: 'Home Loan',
      defaultAmount: 5000000, // 50 Lakhs / $500k
      minAmount: 500000,
      maxAmount: 50000000,
      stepAmount: 100000,
      defaultRate: 8.5,
      minRate: 6.5,
      maxRate: 15.0,
      stepRate: 0.1,
      defaultTenureYears: 20,
      minTenureYears: 1,
      maxTenureYears: 30,
      defaultProcessingFeePercent: 0.5,
      defaultDownPaymentPercent: 20,
      description: 'Long-term residential mortgage loan with competitive floating and fixed rate options.',
    },
    {
      id: 'personal_loan',
      type: 'personal',
      name: 'Personal Loan',
      defaultAmount: 500000, // 5 Lakhs / $50k
      minAmount: 50000,
      maxAmount: 4000000,
      stepAmount: 25000,
      defaultRate: 11.5,
      minRate: 9.5,
      maxRate: 24.0,
      stepRate: 0.25,
      defaultTenureYears: 3,
      minTenureYears: 1,
      maxTenureYears: 7,
      defaultProcessingFeePercent: 1.5,
      defaultDownPaymentPercent: 0,
      description: 'Unsecured personal loan for medical, travel, wedding, or sudden financial requirements.',
    },
    {
      id: 'car_loan',
      type: 'car',
      name: 'Car Loan',
      defaultAmount: 1000000, // 10 Lakhs / $100k
      minAmount: 100000,
      maxAmount: 10000000,
      stepAmount: 50000,
      defaultRate: 8.9,
      minRate: 7.5,
      maxRate: 16.0,
      stepRate: 0.1,
      defaultTenureYears: 5,
      minTenureYears: 1,
      maxTenureYears: 8,
      defaultProcessingFeePercent: 0.75,
      defaultDownPaymentPercent: 15,
      description: 'Auto vehicle financing for new and certified pre-owned passenger and commercial cars.',
    },
    {
      id: 'education_loan',
      type: 'education',
      name: 'Education Loan',
      defaultAmount: 2500000, // 25 Lakhs / $250k
      minAmount: 200000,
      maxAmount: 15000000,
      stepAmount: 100000,
      defaultRate: 9.25,
      minRate: 7.0,
      maxRate: 14.5,
      stepRate: 0.1,
      defaultTenureYears: 10,
      minTenureYears: 1,
      maxTenureYears: 15,
      defaultProcessingFeePercent: 1.0,
      defaultDownPaymentPercent: 10,
      description: 'Higher education financing for domestic and premier international university studies.',
    },
    {
      id: 'business_loan',
      type: 'business',
      name: 'Business Loan',
      defaultAmount: 3000000, // 30 Lakhs / $300k
      minAmount: 300000,
      maxAmount: 50000000,
      stepAmount: 100000,
      defaultRate: 12.0,
      minRate: 9.0,
      maxRate: 22.0,
      stepRate: 0.25,
      defaultTenureYears: 5,
      minTenureYears: 1,
      maxTenureYears: 10,
      defaultProcessingFeePercent: 2.0,
      defaultDownPaymentPercent: 0,
      description: 'Working capital, machinery purchase, and business expansion financing for enterprises.',
    },
  ];

  const transaction = db.transaction((items: LoanPreset[]) => {
    for (const item of items) {
      insert.run(item);
    }
  });
  transaction(presets);
}

function seedSampleCalculations() {
  const insert = db.prepare(`
    INSERT INTO saved_calculations (
      id, share_code, title, calculator_type, loan_type, input_data, result_summary, created_at, updated_at
    ) VALUES (
      @id, @shareCode, @title, @calculatorType, @loanType, @inputData, @resultSummary, @createdAt, @updatedAt
    )
  `);

  const now = new Date().toISOString();
  const samples = [
    {
      id: 'sample-home-50l',
      shareCode: 'HME50LAK',
      title: 'Standard Home Loan 50L (20 Yrs @ 8.5%)',
      calculatorType: 'emi',
      loanType: 'home',
      inputData: JSON.stringify({
        principal: 5000000,
        annualRate: 8.5,
        tenureMonths: 240,
        processingFeePercent: 0.5,
        taxPercentOnFee: 18,
      }),
      resultSummary: JSON.stringify({
        monthlyEmi: 43391.15,
        totalInterest: 5413876,
        totalPayment: 10443376,
        effectiveApr: 8.56,
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-prepayment-extra5k',
      shareCode: 'PREPAY5K',
      title: 'Home Loan with +₹5,000/mo Extra Prepayment',
      calculatorType: 'prepayment',
      loanType: 'home',
      inputData: JSON.stringify({
        principal: 5000000,
        annualRate: 8.5,
        tenureMonths: 240,
        strategy: 'reduce_tenure',
        extraMonthlyPayment: 5000,
      }),
      resultSummary: JSON.stringify({
        originalMonths: 240,
        revisedMonths: 184,
        monthsSaved: 56,
        interestSaved: 1475820,
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-compare-offers',
      shareCode: 'CMPBANK4',
      title: 'Top 3 Bank Home Loan Offers Comparison',
      calculatorType: 'comparison',
      loanType: 'home',
      inputData: JSON.stringify({
        offers: [
          { id: '1', bankName: 'HDFC Bank', principal: 5000000, annualRate: 8.5, tenureMonths: 240, processingFeePercent: 0.5, flatProcessingFee: 0, otherCharges: 3000 },
          { id: '2', bankName: 'SBI Privilege', principal: 5000000, annualRate: 8.4, tenureMonths: 240, processingFeePercent: 0.35, flatProcessingFee: 0, otherCharges: 2500 },
          { id: '3', bankName: 'ICICI Express', principal: 5000000, annualRate: 8.6, tenureMonths: 240, processingFeePercent: 0.25, flatProcessingFee: 2000, otherCharges: 1000 },
        ],
      }),
      resultSummary: JSON.stringify({
        bestBank: 'SBI Privilege',
        bestEmi: 43075,
        maxPotentialSavings: 132450,
      }),
      createdAt: now,
      updatedAt: now,
    },
  ];

  const transaction = db.transaction((items) => {
    for (const item of items) {
      insert.run(item);
    }
  });
  transaction(samples);
}

export default db;
