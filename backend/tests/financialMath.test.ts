import { FinancialMath } from '../src/services/financialMath';

describe('FinancialMath Engine Tests', () => {
  describe('calculateEMI', () => {
    it('calculates accurate EMI for standard 50L home loan at 8.5% for 20 years (240 months)', () => {
      // P = 5,000,000, r = 8.5% p.a., n = 240
      // Standard Formula result: ~43,391.15
      const emi = FinancialMath.calculateEMI(5000000, 8.5, 240);
      expect(emi).toBeCloseTo(43391.15, 1);
    });

    it('calculates accurate EMI for personal loan 5L at 12% for 3 years (36 months)', () => {
      // P = 500,000, r = 12% p.a., n = 36
      // Standard result: ~16,607.15
      const emi = FinancialMath.calculateEMI(500000, 12, 36);
      expect(emi).toBeCloseTo(16607.15, 1);
    });

    it('handles 0% interest rate gracefully (principal / months)', () => {
      const emi = FinancialMath.calculateEMI(120000, 0, 12);
      expect(emi).toBe(10000);
    });

    it('returns 0 if principal is 0 or negative', () => {
      expect(FinancialMath.calculateEMI(0, 10, 12)).toBe(0);
      expect(FinancialMath.calculateEMI(-50000, 10, 12)).toBe(0);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('produces exactly n months and correct annual grouping where sum of principal equals original loan', () => {
      const principal = 1000000;
      const rate = 9.0;
      const tenure = 24; // 2 years

      const schedule = FinancialMath.generateAmortizationSchedule(principal, rate, tenure);

      expect(schedule.monthly.length).toBe(24);
      expect(schedule.yearly.length).toBe(2);

      const totalPrincipalPaid = schedule.monthly.reduce((sum, m) => sum + m.principal, 0);
      expect(Math.round(totalPrincipalPaid)).toBe(principal);

      const finalMonth = schedule.monthly[schedule.monthly.length - 1];
      expect(finalMonth.endingBalance).toBe(0);
    });
  });

  describe('simulatePrepayment', () => {
    it('shortens loan tenure and reduces total interest with extra monthly payments', () => {
      const result = FinancialMath.simulatePrepayment({
        principal: 5000000,
        annualRate: 8.5,
        tenureMonths: 240,
        strategy: 'reduce_tenure',
        extraMonthlyPayment: 5000,
      });

      expect(result.withPrepayment.revisedTenureMonths).toBeLessThan(result.original.tenureMonths);
      expect(result.withPrepayment.interestSaved).toBeGreaterThan(1000000);
      expect(result.withPrepayment.monthsSaved).toBeGreaterThan(40);
    });

    it('reduces EMI when strategy is reduce_emi while keeping tenure constant', () => {
      const result = FinancialMath.simulatePrepayment({
        principal: 5000000,
        annualRate: 8.5,
        tenureMonths: 240,
        strategy: 'reduce_emi',
        lumpSums: [{ month: 12, amount: 500000 }],
      });

      expect(result.withPrepayment.revisedTenureMonths).toBe(240);
      expect(result.withPrepayment.monthlyEmi).toBeLessThan(result.original.monthlyEmi);
      expect(result.withPrepayment.interestSaved).toBeGreaterThan(500000);
    });
  });

  describe('calculateBalanceTransfer', () => {
    it('recommends balance transfer when interest savings exceed fees and breakeven is low', () => {
      const result = FinancialMath.calculateBalanceTransfer({
        outstandingBalance: 4000000,
        currentRate: 9.5,
        remainingTenureMonths: 180,
        newRate: 8.25,
        newProcessingFeePercent: 0.5,
      });

      expect(result.netSavings).toBeGreaterThan(0);
      expect(result.monthlyEmiDiff).toBeGreaterThan(0);
      expect(result.breakevenMonths).toBeLessThan(24);
      expect(result.recommendation).toBe('highly_recommended');
    });

    it('does not recommend transfer if new rate is higher', () => {
      const result = FinancialMath.calculateBalanceTransfer({
        outstandingBalance: 4000000,
        currentRate: 8.0,
        remainingTenureMonths: 180,
        newRate: 9.5,
      });

      expect(result.netSavings).toBeLessThan(0);
      expect(result.recommendation).toBe('not_recommended');
    });
  });

  describe('calculateEligibility', () => {
    it('computes eligible loan amount correctly based on income and FOIR', () => {
      const result = FinancialMath.calculateEligibility({
        loanType: 'home',
        grossMonthlyIncome: 100000,
        existingMonthlyEmi: 10000,
        annualRate: 8.5,
        tenureYears: 20,
        foirPercent: 50,
      });

      // Max EMI = 50% of 100k - 10k = 40,000
      expect(result.availableMonthlyEmi).toBe(40000);
      expect(result.eligibleMaxLoanAmount).toBeGreaterThan(4000000);
      expect(result.eligibilityStatus).toBe('eligible');
    });

    it('flags ineligible when existing obligations equal or exceed allowable limit', () => {
      const result = FinancialMath.calculateEligibility({
        loanType: 'home',
        grossMonthlyIncome: 50000,
        existingMonthlyEmi: 30000,
        annualRate: 8.5,
        tenureYears: 20,
        foirPercent: 50,
      });

      expect(result.availableMonthlyEmi).toBe(0);
      expect(result.eligibleMaxLoanAmount).toBe(0);
      expect(result.eligibilityStatus).toBe('ineligible');
    });
  });

  describe('compareLoanOffers', () => {
    it('accurately ranks multiple offers and marks the cheapest one', () => {
      const result = FinancialMath.compareLoanOffers([
        { id: '1', bankName: 'Bank A', principal: 1000000, annualRate: 9.0, tenureMonths: 60, processingFeePercent: 1.0, flatProcessingFee: 0, otherCharges: 0 },
        { id: '2', bankName: 'Bank B', principal: 1000000, annualRate: 8.5, tenureMonths: 60, processingFeePercent: 0.5, flatProcessingFee: 0, otherCharges: 0 },
        { id: '3', bankName: 'Bank C', principal: 1000000, annualRate: 10.0, tenureMonths: 60, processingFeePercent: 0, flatProcessingFee: 0, otherCharges: 0 },
      ]);

      expect(result.bestOverallOfferId).toBe('2');
      const bankB = result.offers.find((o) => o.id === '2');
      expect(bankB?.isLowestTotalCost).toBe(true);
      expect(bankB?.isLowestEmi).toBe(true);
    });
  });

  describe('generateMultiScenarioMatrix', () => {
    it('computes correct matrix dimensions and calculations for home loan rate & tenure combinations', () => {
      const principal = 5000000;
      const rates = [8.0, 8.5, 9.0];
      const tenuresYears = [15, 20, 25];

      const result = FinancialMath.generateMultiScenarioMatrix({
        principal,
        rates,
        tenuresYears,
        baseRate: 8.5,
        baseTenureYears: 20,
      });

      expect(result.matrix.length).toBe(3); // 3 rates
      expect(result.matrix[0].length).toBe(3); // 3 tenures per rate
      expect(result.baseScenario.monthlyEmi).toBeCloseTo(43391.15, 1);

      // Lowest EMI should be at lowest rate (8.0%) and longest tenure (25 years = 300 months)
      expect(result.lowestEmiCell.annualRate).toBe(8.0);
      expect(result.lowestEmiCell.tenureYears).toBe(25);

      // Lowest Total Interest should be at lowest rate (8.0%) and shortest tenure (15 years)
      expect(result.lowestInterestCell.annualRate).toBe(8.0);
      expect(result.lowestInterestCell.tenureYears).toBe(15);

      // Tenure cut savings check (20 yrs to 15 yrs)
      expect(result.advisoryInsights.tenureCutSavings.lifetimeInterestSaved).toBeGreaterThan(1000000);
      expect(result.advisoryInsights.tenureCutSavings.monthlyEmiIncrease).toBeGreaterThan(0);

      // Rate hike impact (+0.5% to 9.0%)
      expect(result.advisoryInsights.rateHikeImpact.revisedRate).toBe(9.0);
      expect(result.advisoryInsights.rateHikeImpact.monthlyEmiIncrease).toBeGreaterThan(1000);
      expect(result.advisoryInsights.rateHikeImpact.equivalentLumpSumPrepayment).toBeGreaterThan(100000);
    });

    it('supports direct tenures in months (including non-integer years)', () => {
      const principal = 4000000;
      const rates = [8.5];
      const tenuresMonths = [84, 142, 180, 240]; // 7 yrs, 11.83 yrs, 15 yrs, 20 yrs

      const result = FinancialMath.generateMultiScenarioMatrix({
        principal,
        rates,
        tenuresMonths,
        baseRate: 8.5,
        baseTenureMonths: 142,
      });

      expect(result.matrix[0].length).toBe(4);
      expect(result.baseScenario.tenureMonths).toBe(142);
      expect(result.baseScenario.monthlyEmi).toBeGreaterThan(0);
      expect(result.matrix[0][0].tenureMonths).toBe(84);
      expect(result.matrix[0][1].tenureMonths).toBe(142);
    });
  });
});
