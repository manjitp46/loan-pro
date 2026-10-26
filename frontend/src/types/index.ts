export type CurrencyType =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'CAD'
  | 'AUD'
  | 'SGD'
  | 'JPY'
  | string;

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

export interface EmiCalculationResult {
  monthlyEmi: number;
  principalAmount: number;
  totalInterest: number;
  totalProcessingFee: number;
  taxOnFee: number;
  totalUpfrontCharges: number;
  totalPayment: number;
  effectiveApr: number;
  interestToPrincipalRatio: number;
  schedule: {
    monthly: AmortizationMonthEntry[];
    yearly: AmortizationYearEntry[];
  };
}

export interface LumpSumPrepayment {
  id: string;
  month: number;
  amount: number;
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
  monthlyEmiDiff: number;
  interestSaved: number;
  netSavings: number;
  breakevenMonths: number;
  recommendation: 'highly_recommended' | 'moderately_recommended' | 'not_recommended';
  recommendationReason: string;
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

export interface LoanOfferItem {
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

export interface SavedCalculationItem {
  id: string;
  shareCode: string;
  title: string;
  calculatorType: 'emi' | 'comparison' | 'prepayment' | 'transfer' | 'eligibility' | 'floating' | 'multi_rate';
  loanType: LoanType;
  resultSummary: any;
  createdAt: string;
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
