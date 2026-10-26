export type LoanType = 'home' | 'personal' | 'car' | 'education' | 'business';

export interface LoanPreset {
  id: string;
  type: LoanType;
  name: string;
  defaultAmount: number;
  minAmount: number;
  maxAmount: number;
  stepAmount: number;
  defaultRate: number;
  minRate: number;
  maxRate: number;
  stepRate: number;
  defaultTenureYears: number;
  minTenureYears: number;
  maxTenureYears: number;
  defaultProcessingFeePercent: number;
  defaultDownPaymentPercent: number;
  description: string;
}

export interface AmortizationMonthEntry {
  month: number;
  year: number;
  monthInYear: number;
  date: string;
  beginningBalance: number;
  emi: number;
  principal: number;
  interest: number;
  prepayment: number;
  endingBalance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  cumulativeTotalPaid: number;
}

export interface AmortizationYearEntry {
  year: number;
  beginningBalance: number;
  principalPaid: number;
  interestPaid: number;
  prepaymentsPaid: number;
  totalPayment: number;
  endingBalance: number;
  loanBalancePercentage: number;
  months: AmortizationMonthEntry[];
}

export interface LumpSumPrepayment {
  month: number;
  amount: number;
}

export interface RateChangePoint {
  month: number;
  newRate: number;
}

export interface EmiCalculationInput {
  loanType?: LoanType;
  principal: number;
  annualRate: number; // in percentage e.g. 8.5
  tenureMonths: number;
  processingFeePercent?: number;
  flatProcessingFee?: number;
  taxPercentOnFee?: number; // GST, e.g. 18%
  downPayment?: number;
  startDate?: string; // ISO date string, e.g. "2026-11-01"
}

export interface EmiCalculationResult {
  monthlyEmi: number;
  principalAmount: number;
  totalInterest: number;
  totalProcessingFee: number;
  taxOnFee: number;
  totalUpfrontCharges: number;
  totalPayment: number; // principal + totalInterest + totalUpfrontCharges
  effectiveApr: number; // Annual Percentage Rate taking fees into account
  interestToPrincipalRatio: number; // percentage of total payment that is interest
  schedule: {
    monthly: AmortizationMonthEntry[];
    yearly: AmortizationYearEntry[];
  };
}

export interface PrepaymentSimulationInput {
  principal: number;
  annualRate: number;
  tenureMonths: number;
  strategy: 'reduce_tenure' | 'reduce_emi';
  extraMonthlyPayment?: number;
  annualPrepayment?: number; // Prepay 1 extra EMI or fixed lump sum every year
  lumpSums?: LumpSumPrepayment[];
  startDate?: string;
}

export interface PrepaymentSimulationResult {
  original: {
    monthlyEmi: number;
    tenureMonths: number;
    totalInterest: number;
    totalPayment: number;
  };
  withPrepayment: {
    monthlyEmi: number;
    revisedTenureMonths: number;
    totalInterest: number;
    totalPrepayments: number;
    totalPayment: number;
    monthsSaved: number;
    interestSaved: number;
    totalSavings: number;
    closureMonth: number;
  };
  schedule: {
    monthly: AmortizationMonthEntry[];
    yearly: AmortizationYearEntry[];
  };
}

export interface BalanceTransferInput {
  outstandingBalance: number;
  currentRate: number;
  remainingTenureMonths: number;
  newRate: number;
  newTenureMonths?: number; // default to remainingTenureMonths if not passed
  newProcessingFeePercent?: number;
  newFlatFee?: number;
  foreclosurePenaltyPercent?: number;
  foreclosureFlatPenalty?: number;
}

export interface BalanceTransferResult {
  currentLoan: {
    outstandingBalance: number;
    monthlyEmi: number;
    remainingInterest: number;
    totalRemainingPayment: number;
  };
  newLoan: {
    monthlyEmi: number;
    totalInterest: number;
    processingFee: number;
    foreclosurePenalty: number;
    totalTransferCost: number;
    totalNewPayment: number;
  };
  monthlyEmiDiff: number; // positive = savings per month
  interestSaved: number;
  netSavings: number; // interestSaved - totalTransferCost
  breakevenMonths: number;
  recommendation: 'highly_recommended' | 'moderately_recommended' | 'not_recommended';
  recommendationReason: string;
}

export interface LoanEligibilityInput {
  loanType: LoanType;
  grossMonthlyIncome: number;
  existingMonthlyEmi: number;
  annualRate: number;
  tenureYears: number;
  foirPercent?: number; // Fixed Obligation to Income Ratio, default 50%
}

export interface LoanEligibilityResult {
  grossMonthlyIncome: number;
  maxAllowedFoirPercent: number;
  maxTotalAllowedEmi: number;
  availableMonthlyEmi: number;
  eligibleMaxLoanAmount: number;
  estimatedEmi: number;
  totalInterest: number;
  totalRepayment: number;
  disposableIncome: number;
  eligibilityStatus: 'eligible' | 'borderline' | 'ineligible';
  suggestions: string[];
}

export interface FloatingRateSimulationInput {
  principal: number;
  initialRate: number;
  tenureMonths: number;
  rateChanges: RateChangePoint[];
  strategy: 'adjust_tenure' | 'adjust_emi';
}

export interface FloatingRateSimulationResult {
  fixedScenario: {
    emi: number;
    totalInterest: number;
    totalPayment: number;
    tenureMonths: number;
  };
  floatingScenario: {
    finalEmi: number;
    totalInterest: number;
    totalPayment: number;
    effectiveTenureMonths: number;
    interestDiff: number; // floating - fixed (positive means floating paid more)
  };
  schedule: {
    monthly: AmortizationMonthEntry[];
    yearly: AmortizationYearEntry[];
  };
}

export interface LoanOffer {
  id: string;
  bankName: string;
  principal: number;
  annualRate: number;
  tenureMonths: number;
  processingFeePercent: number;
  flatProcessingFee: number;
  otherCharges: number;
}

export interface LoanComparisonResult {
  offers: Array<{
    id: string;
    bankName: string;
    principal: number;
    annualRate: number;
    tenureMonths: number;
    monthlyEmi: number;
    totalInterest: number;
    totalFees: number;
    totalCost: number;
    effectiveApr: number;
    interestToPrincipalRatio: number;
    differenceFromCheapestTotal: number;
    differenceFromCheapestEmi: number;
    isLowestEmi: boolean;
    isLowestTotalInterest: boolean;
    isLowestTotalCost: boolean;
    isLowestApr: boolean;
  }>;
  bestOverallOfferId: string;
}

export interface SavedCalculationRecord {
  id: string;
  shareCode: string;
  title: string;
  calculatorType: 'emi' | 'comparison' | 'prepayment' | 'transfer' | 'eligibility' | 'floating' | 'multi_rate';
  loanType: LoanType;
  inputData: string; // JSON string
  resultSummary: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

export interface MultiScenarioMatrixCell {
  annualRate: number;
  tenureYears: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  interestToPrincipalRatio: number;
  differenceFromBaseEmi?: number;
  differenceFromBaseInterest?: number;
  differenceFromBaseTotal?: number;
}

export interface MultiScenarioMatrixInput {
  principal: number;
  rates: number[];
  tenuresYears?: number[];
  tenuresMonths?: number[];
  baseRate?: number;
  baseTenureYears?: number;
  baseTenureMonths?: number;
}

export interface MultiScenarioMatrixResult {
  principal: number;
  rates: number[];
  tenuresYears: number[];
  tenuresMonths: number[];
  matrix: MultiScenarioMatrixCell[][]; // [rateIndex][tenureIndex]
  baseScenario: MultiScenarioMatrixCell;
  lowestEmiCell: MultiScenarioMatrixCell;
  lowestInterestCell: MultiScenarioMatrixCell;
  advisoryInsights: {
    tenureCutSavings: {
      fromYears: number;
      toYears: number;
      monthlyEmiIncrease: number;
      lifetimeInterestSaved: number;
    };
    rateHikeImpact: {
      hikePercent: number;
      revisedRate: number;
      monthlyEmiIncrease: number;
      lifetimeInterestIncrease: number;
      equivalentTenureExtensionMonths: number;
      equivalentLumpSumPrepayment: number;
    };
    rateDropAdvantage: {
      dropPercent: number;
      revisedRate: number;
      monthlyEmiSavings: number;
      lifetimeInterestSaved: number;
    };
  };
}
