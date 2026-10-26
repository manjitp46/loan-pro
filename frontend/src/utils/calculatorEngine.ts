import {
  AmortizationMonthEntry,
  AmortizationYearEntry,
  EmiCalculationResult,
  PrepaymentSimulationResult,
  BalanceTransferResult,
  LoanEligibilityResult,
  LoanComparisonResult,
  LoanOfferItem,
  LumpSumPrepayment,
  MultiScenarioMatrixCell,
  MultiScenarioMatrixInput,
  MultiScenarioMatrixResult,
} from '../types';

export class ClientCalculatorEngine {
  public static round(val: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((val + Number.EPSILON) * factor) / factor;
  }

  public static calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    if (principal <= 0 || tenureMonths <= 0) return 0;
    if (annualRate <= 0) {
      return this.round(principal / tenureMonths);
    }
    const monthlyRate = annualRate / 12 / 100;
    const compound = Math.pow(1 + monthlyRate, tenureMonths);
    const emi = (principal * monthlyRate * compound) / (compound - 1);
    return this.round(emi);
  }

  public static calculateAPR(principal: number, annualRate: number, tenureMonths: number, upfrontFees: number): number {
    if (principal <= 0 || tenureMonths <= 0) return annualRate;
    const netDisbursed = principal - upfrontFees;
    if (netDisbursed <= 0) return annualRate;

    const monthlyEmi = this.calculateEMI(principal, annualRate, tenureMonths);
    let r = annualRate / 12 / 100;
    for (let i = 0; i < 30; i++) {
      const pvFactor = (1 - Math.pow(1 + r, -tenureMonths)) / r;
      const f = netDisbursed - monthlyEmi * pvFactor;
      if (Math.abs(f) < 0.001) break;
      const df = monthlyEmi * ((1 - Math.pow(1 + r, -tenureMonths)) / (r * r) - (tenureMonths * Math.pow(1 + r, -tenureMonths - 1)) / r);
      if (Math.abs(df) < 1e-10) break;
      r = r - f / df;
      if (r <= 0) r = 0.0001;
    }
    const apr = r * 12 * 100;
    return this.round(Math.max(apr, annualRate));
  }

  public static generateAmortization(
    principal: number,
    annualRate: number,
    tenureMonths: number,
    startDateStr?: string,
    prepaymentMap?: Map<number, number>
  ): { monthly: AmortizationMonthEntry[]; yearly: AmortizationYearEntry[] } {
    const monthly: AmortizationMonthEntry[] = [];
    const yearly: AmortizationYearEntry[] = [];

    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    let currentBalance = principal;
    const monthlyRate = annualRate / 12 / 100;
    const currentEmi = this.calculateEMI(principal, annualRate, tenureMonths);

    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;
    let cumulativeTotalPaid = 0;

    let currentYearNumber = 1;
    let yearBeginningBalance = principal;
    let yearPrincipalPaid = 0;
    let yearInterestPaid = 0;
    let yearPrepaymentsPaid = 0;
    let yearTotalPayment = 0;
    let yearMonths: AmortizationMonthEntry[] = [];

    for (let month = 1; month <= tenureMonths; month++) {
      if (currentBalance <= 0) break;

      const monthDate = new Date(startDate);
      monthDate.setMonth(monthDate.getMonth() + month - 1);
      const dateStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const beginningBalance = currentBalance;
      const interestForMonth = this.round(beginningBalance * monthlyRate);
      let principalForMonth = this.round(currentEmi - interestForMonth);

      if (month === tenureMonths || principalForMonth > beginningBalance) {
        principalForMonth = beginningBalance;
      }

      const extraPrepayment = prepaymentMap?.get(month) || 0;
      const actualPrepayment = Math.min(extraPrepayment, Math.max(0, beginningBalance - principalForMonth));

      const endingBalance = month === tenureMonths ? 0 : this.round(Math.max(0, beginningBalance - principalForMonth - actualPrepayment));
      const totalMonthPayment = this.round(principalForMonth + interestForMonth + actualPrepayment);

      cumulativePrincipal = this.round(cumulativePrincipal + principalForMonth);
      cumulativeInterest = this.round(cumulativeInterest + interestForMonth);
      cumulativeTotalPaid = this.round(cumulativeTotalPaid + totalMonthPayment);

      const entry: AmortizationMonthEntry = {
        month,
        year: currentYearNumber,
        monthInYear: ((month - 1) % 12) + 1,
        date: dateStr,
        beginningBalance: this.round(beginningBalance),
        emi: this.round(principalForMonth + interestForMonth),
        principal: this.round(principalForMonth),
        interest: this.round(interestForMonth),
        prepayment: this.round(actualPrepayment),
        endingBalance: this.round(endingBalance),
        cumulativePrincipal,
        cumulativeInterest,
        cumulativeTotalPaid,
      };

      monthly.push(entry);
      yearMonths.push(entry);

      yearPrincipalPaid = this.round(yearPrincipalPaid + principalForMonth);
      yearInterestPaid = this.round(yearInterestPaid + interestForMonth);
      yearPrepaymentsPaid = this.round(yearPrepaymentsPaid + actualPrepayment);
      yearTotalPayment = this.round(yearTotalPayment + totalMonthPayment);
      currentBalance = endingBalance;

      if (month % 12 === 0 || currentBalance <= 0 || month === tenureMonths) {
        yearly.push({
          year: currentYearNumber,
          beginningBalance: this.round(yearBeginningBalance),
          principalPaid: yearPrincipalPaid,
          interestPaid: yearInterestPaid,
          prepaymentsPaid: yearPrepaymentsPaid,
          totalPayment: yearTotalPayment,
          endingBalance: this.round(currentBalance),
          loanBalancePercentage: principal > 0 ? this.round((currentBalance / principal) * 100) : 0,
          months: [...yearMonths],
        });

        currentYearNumber++;
        yearBeginningBalance = currentBalance;
        yearPrincipalPaid = 0;
        yearInterestPaid = 0;
        yearPrepaymentsPaid = 0;
        yearTotalPayment = 0;
        yearMonths = [];
      }
    }

    return { monthly, yearly };
  }

  public static calculateEmi(
    principal: number,
    annualRate: number,
    tenureMonths: number,
    processingFeePercent: number = 0,
    flatProcessingFee: number = 0,
    taxPercentOnFee: number = 18,
    downPayment: number = 0,
    startDate?: string
  ): EmiCalculationResult {
    const loanAmount = Math.max(0, principal - downPayment);
    const monthlyEmi = this.calculateEMI(loanAmount, annualRate, tenureMonths);

    const feeAmount = this.round(flatProcessingFee + (loanAmount * processingFeePercent) / 100);
    const taxOnFee = this.round((feeAmount * taxPercentOnFee) / 100);
    const totalUpfrontCharges = this.round(feeAmount + taxOnFee);

    const schedule = this.generateAmortization(loanAmount, annualRate, tenureMonths, startDate);
    const totalInterest = this.round(schedule.monthly.reduce((sum, m) => sum + m.interest, 0));
    const totalPayment = this.round(loanAmount + totalInterest + totalUpfrontCharges);

    const effectiveApr = this.calculateAPR(loanAmount, annualRate, tenureMonths, totalUpfrontCharges);
    const interestToPrincipalRatio = totalPayment > 0 ? this.round((totalInterest / (loanAmount + totalInterest)) * 100) : 0;

    return {
      monthlyEmi,
      principalAmount: loanAmount,
      totalInterest,
      totalProcessingFee: feeAmount,
      taxOnFee,
      totalUpfrontCharges,
      totalPayment,
      effectiveApr,
      interestToPrincipalRatio,
      schedule,
    };
  }

  public static simulatePrepayments(
    principal: number,
    annualRate: number,
    tenureMonths: number,
    strategy: 'reduce_tenure' | 'reduce_emi',
    extraMonthly: number = 0,
    annualExtra: number = 0,
    lumpSums: LumpSumPrepayment[] = [],
    startDate?: string
  ): PrepaymentSimulationResult {
    const originalEmi = this.calculateEMI(principal, annualRate, tenureMonths);
    const baseSchedule = this.generateAmortization(principal, annualRate, tenureMonths, startDate);
    const originalTotalInterest = this.round(baseSchedule.monthly.reduce((s, m) => s + m.interest, 0));
    const originalTotalPayment = this.round(principal + originalTotalInterest);

    const prepayMap = new Map<number, number>();
    for (let m = 1; m <= tenureMonths; m++) {
      let p = extraMonthly;
      if (annualExtra > 0 && m % 12 === 0) p += annualExtra;
      if (p > 0) prepayMap.set(m, p);
    }
    for (const ls of lumpSums) {
      if (ls.month >= 1 && ls.month <= tenureMonths && ls.amount > 0) {
        prepayMap.set(ls.month, (prepayMap.get(ls.month) || 0) + ls.amount);
      }
    }

    if (strategy === 'reduce_tenure') {
      const schedule = this.generateAmortization(principal, annualRate, tenureMonths, startDate, prepayMap);
      const totalInterest = this.round(schedule.monthly.reduce((s, m) => s + m.interest, 0));
      const totalPrepayments = this.round(schedule.monthly.reduce((s, m) => s + m.prepayment, 0));
      const totalPayment = this.round(principal + totalInterest);
      const revisedTenureMonths = schedule.monthly.length;
      const monthsSaved = tenureMonths - revisedTenureMonths;
      const interestSaved = this.round(Math.max(0, originalTotalInterest - totalInterest));

      return {
        original: {
          monthlyEmi: originalEmi,
          tenureMonths,
          totalInterest: originalTotalInterest,
          totalPayment: originalTotalPayment,
        },
        withPrepayment: {
          monthlyEmi: originalEmi,
          revisedTenureMonths,
          totalInterest,
          totalPrepayments,
          totalPayment,
          monthsSaved,
          interestSaved,
          totalSavings: interestSaved,
          closureMonth: revisedTenureMonths,
        },
        schedule,
      };
    } else {
      // reduce EMI strategy
      const monthlyRate = annualRate / 12 / 100;
      let currentBalance = principal;
      let currentEmi = originalEmi;
      let cumulativePrincipal = 0;
      let cumulativeInterest = 0;
      let cumulativeTotalPaid = 0;

      const monthly: AmortizationMonthEntry[] = [];
      const yearly: AmortizationYearEntry[] = [];
      const startDateObj = startDate ? new Date(startDate) : new Date();

      let currentYearNumber = 1;
      let yearBeginningBalance = principal;
      let yearPrincipalPaid = 0;
      let yearInterestPaid = 0;
      let yearPrepaymentsPaid = 0;
      let yearTotalPayment = 0;
      let yearMonths: AmortizationMonthEntry[] = [];

      for (let month = 1; month <= tenureMonths; month++) {
        if (currentBalance <= 0) break;

        const monthDate = new Date(startDateObj);
        monthDate.setMonth(monthDate.getMonth() + month - 1);
        const dateStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        const beginningBalance = currentBalance;
        const interestForMonth = this.round(beginningBalance * monthlyRate);
        let principalForMonth = this.round(currentEmi - interestForMonth);

        if (principalForMonth > beginningBalance) principalForMonth = beginningBalance;

        const extraPrepayment = prepayMap.get(month) || 0;
        const actualPrepayment = Math.min(extraPrepayment, Math.max(0, beginningBalance - principalForMonth));
        const endingBalance = this.round(Math.max(0, beginningBalance - principalForMonth - actualPrepayment));
        const totalMonthPayment = this.round(principalForMonth + interestForMonth + actualPrepayment);

        cumulativePrincipal = this.round(cumulativePrincipal + principalForMonth);
        cumulativeInterest = this.round(cumulativeInterest + interestForMonth);
        cumulativeTotalPaid = this.round(cumulativeTotalPaid + totalMonthPayment);

        const entry: AmortizationMonthEntry = {
          month,
          year: currentYearNumber,
          monthInYear: ((month - 1) % 12) + 1,
          date: dateStr,
          beginningBalance: this.round(beginningBalance),
          emi: this.round(principalForMonth + interestForMonth),
          principal: this.round(principalForMonth),
          interest: this.round(interestForMonth),
          prepayment: this.round(actualPrepayment),
          endingBalance: this.round(endingBalance),
          cumulativePrincipal,
          cumulativeInterest,
          cumulativeTotalPaid,
        };

        monthly.push(entry);
        yearMonths.push(entry);

        yearPrincipalPaid = this.round(yearPrincipalPaid + principalForMonth);
        yearInterestPaid = this.round(yearInterestPaid + interestForMonth);
        yearPrepaymentsPaid = this.round(yearPrepaymentsPaid + actualPrepayment);
        yearTotalPayment = this.round(yearTotalPayment + totalMonthPayment);
        currentBalance = endingBalance;

        if (actualPrepayment > 0 && currentBalance > 0) {
          const remainingMonths = tenureMonths - month;
          if (remainingMonths > 0) {
            currentEmi = this.calculateEMI(currentBalance, annualRate, remainingMonths);
          }
        }

        if (month % 12 === 0 || currentBalance <= 0 || month === tenureMonths) {
          yearly.push({
            year: currentYearNumber,
            beginningBalance: this.round(yearBeginningBalance),
            principalPaid: yearPrincipalPaid,
            interestPaid: yearInterestPaid,
            prepaymentsPaid: yearPrepaymentsPaid,
            totalPayment: yearTotalPayment,
            endingBalance: this.round(currentBalance),
            loanBalancePercentage: principal > 0 ? this.round((currentBalance / principal) * 100) : 0,
            months: [...yearMonths],
          });

          currentYearNumber++;
          yearBeginningBalance = currentBalance;
          yearPrincipalPaid = 0;
          yearInterestPaid = 0;
          yearPrepaymentsPaid = 0;
          yearTotalPayment = 0;
          yearMonths = [];
        }
      }

      const totalInterest = this.round(monthly.reduce((s, m) => s + m.interest, 0));
      const totalPrepayments = this.round(monthly.reduce((s, m) => s + m.prepayment, 0));
      const interestSaved = this.round(Math.max(0, originalTotalInterest - totalInterest));

      return {
        original: {
          monthlyEmi: originalEmi,
          tenureMonths,
          totalInterest: originalTotalInterest,
          totalPayment: originalTotalPayment,
        },
        withPrepayment: {
          monthlyEmi: currentEmi,
          revisedTenureMonths: monthly.length,
          totalInterest,
          totalPrepayments,
          totalPayment: this.round(principal + totalInterest),
          monthsSaved: 0,
          interestSaved,
          totalSavings: interestSaved,
          closureMonth: monthly.length,
        },
        schedule: { monthly, yearly },
      };
    }
  }

  public static calculateBalanceTransfer(
    outstandingBalance: number,
    currentRate: number,
    remainingTenureMonths: number,
    newRate: number,
    newTenureMonths: number = remainingTenureMonths,
    newProcessingFeePercent: number = 0.5,
    foreclosurePenaltyPercent: number = 0
  ): BalanceTransferResult {
    const currentEmi = this.calculateEMI(outstandingBalance, currentRate, remainingTenureMonths);
    const curSchedule = this.generateAmortization(outstandingBalance, currentRate, remainingTenureMonths);
    const remainingCurrentInterest = this.round(curSchedule.monthly.reduce((s, m) => s + m.interest, 0));

    const newEmi = this.calculateEMI(outstandingBalance, newRate, newTenureMonths);
    const newSchedule = this.generateAmortization(outstandingBalance, newRate, newTenureMonths);
    const totalNewInterest = this.round(newSchedule.monthly.reduce((s, m) => s + m.interest, 0));

    const processingFee = this.round((outstandingBalance * newProcessingFeePercent) / 100);
    const foreclosurePenalty = this.round((outstandingBalance * foreclosurePenaltyPercent) / 100);
    const totalTransferCost = this.round(processingFee + foreclosurePenalty);

    const monthlyEmiDiff = this.round(currentEmi - newEmi);
    const interestSaved = this.round(remainingCurrentInterest - totalNewInterest);
    const netSavings = this.round(interestSaved - totalTransferCost);

    let breakevenMonths = 0;
    if (monthlyEmiDiff > 0 && totalTransferCost > 0) {
      breakevenMonths = Math.ceil(totalTransferCost / monthlyEmiDiff);
    } else if (totalTransferCost === 0 && monthlyEmiDiff >= 0) {
      breakevenMonths = 0;
    } else {
      breakevenMonths = 999;
    }

    let recommendation: 'highly_recommended' | 'moderately_recommended' | 'not_recommended' = 'not_recommended';
    let recommendationReason = '';

    if (netSavings > 50000 && breakevenMonths <= 18) {
      recommendation = 'highly_recommended';
      recommendationReason = `Significant net savings of ₹${netSavings.toLocaleString()} with a fast breakeven of ${breakevenMonths} months. Highly recommended!`;
    } else if (netSavings > 0 && breakevenMonths <= 36) {
      recommendation = 'moderately_recommended';
      recommendationReason = `Moderate net savings of ₹${netSavings.toLocaleString()} recovering costs in ${breakevenMonths} months. Worth considering.`;
    } else {
      recommendation = 'not_recommended';
      recommendationReason = `Net savings are negative or breakeven period is too long (${breakevenMonths} months). Switching is not advised.`;
    }

    return {
      currentLoan: {
        outstandingBalance,
        monthlyEmi: currentEmi,
        remainingInterest: remainingCurrentInterest,
        totalRemainingPayment: this.round(outstandingBalance + remainingCurrentInterest),
      },
      newLoan: {
        monthlyEmi: newEmi,
        totalInterest: totalNewInterest,
        processingFee,
        foreclosurePenalty,
        totalTransferCost,
        totalNewPayment: this.round(outstandingBalance + totalNewInterest + totalTransferCost),
      },
      monthlyEmiDiff,
      interestSaved,
      netSavings,
      breakevenMonths,
      recommendation,
      recommendationReason,
    };
  }

  public static calculateEligibility(
    income: number,
    existingEmi: number,
    annualRate: number,
    tenureYears: number,
    foir: number = 50
  ): LoanEligibilityResult {
    const maxTotalAllowedEmi = this.round((income * foir) / 100);
    const availableMonthlyEmi = this.round(Math.max(0, maxTotalAllowedEmi - existingEmi));
    const tenureMonths = tenureYears * 12;
    const monthlyRate = annualRate / 12 / 100;

    let eligibleMaxLoanAmount = 0;
    if (availableMonthlyEmi > 0 && monthlyRate > 0) {
      const compound = Math.pow(1 + monthlyRate, tenureMonths);
      eligibleMaxLoanAmount = this.round((availableMonthlyEmi * (compound - 1)) / (monthlyRate * compound));
    }

    const estimatedEmi = availableMonthlyEmi;
    const totalRepayment = this.round(estimatedEmi * tenureMonths);
    const totalInterest = this.round(Math.max(0, totalRepayment - eligibleMaxLoanAmount));
    const disposableIncome = this.round(income - existingEmi - estimatedEmi);

    let eligibilityStatus: 'eligible' | 'borderline' | 'ineligible' = 'eligible';
    const suggestions: string[] = [];

    if (availableMonthlyEmi <= 0) {
      eligibilityStatus = 'ineligible';
      suggestions.push('Existing monthly obligations exceed maximum FOIR limit.');
      suggestions.push('Consider closing existing loans or credit card dues first.');
      suggestions.push('Add a co-applicant to pool incomes and qualify.');
    } else if (availableMonthlyEmi < income * 0.2) {
      eligibilityStatus = 'borderline';
      suggestions.push('Increasing loan tenure can significantly increase eligibility.');
      suggestions.push('Opting for a joint loan can boost capacity by 50-80%.');
    } else {
      suggestions.push('Excellent financial profile! You qualify for top-tier interest rates.');
      suggestions.push('You can opt for shorter tenure to save on total interest.');
    }

    return {
      grossMonthlyIncome: income,
      maxAllowedFoirPercent: foir,
      maxTotalAllowedEmi,
      availableMonthlyEmi,
      eligibleMaxLoanAmount,
      estimatedEmi,
      totalInterest,
      totalRepayment,
      disposableIncome,
      eligibilityStatus,
      suggestions,
    };
  }

  public static compareOffers(offers: LoanOfferItem[]): LoanComparisonResult {
    if (!offers || offers.length === 0) return { offers: [], bestOverallOfferId: '' };

    const calculated = offers.map((offer) => {
      const emi = this.calculateEMI(offer.principal, offer.annualRate, offer.tenureMonths);
      const totalFees = this.round(offer.flatProcessingFee + (offer.principal * offer.processingFeePercent) / 100 + offer.otherCharges);
      const schedule = this.generateAmortization(offer.principal, offer.annualRate, offer.tenureMonths);
      const totalInterest = this.round(schedule.monthly.reduce((s, m) => s + m.interest, 0));
      const totalCost = this.round(offer.principal + totalInterest + totalFees);
      const effectiveApr = this.calculateAPR(offer.principal, offer.annualRate, offer.tenureMonths, totalFees);
      const ratio = totalCost > 0 ? this.round((totalInterest / (offer.principal + totalInterest)) * 100) : 0;

      return {
        id: offer.id,
        bankName: offer.bankName,
        principal: offer.principal,
        annualRate: offer.annualRate,
        tenureMonths: offer.tenureMonths,
        monthlyEmi: emi,
        totalInterest,
        totalFees,
        totalCost,
        effectiveApr,
        interestToPrincipalRatio: ratio,
        differenceFromCheapestTotal: 0,
        differenceFromCheapestEmi: 0,
        isLowestEmi: false,
        isLowestTotalInterest: false,
        isLowestTotalCost: false,
        isLowestApr: false,
      };
    });

    const minTotalCost = Math.min(...calculated.map((o) => o.totalCost));
    const minEmi = Math.min(...calculated.map((o) => o.monthlyEmi));
    const minInterest = Math.min(...calculated.map((o) => o.totalInterest));
    const minApr = Math.min(...calculated.map((o) => o.effectiveApr));

    let bestOffer = calculated[0];
    let minScore = Infinity;

    calculated.forEach((o) => {
      o.isLowestTotalCost = o.totalCost === minTotalCost;
      o.isLowestEmi = o.monthlyEmi === minEmi;
      o.isLowestTotalInterest = o.totalInterest === minInterest;
      o.isLowestApr = o.effectiveApr === minApr;
      o.differenceFromCheapestTotal = this.round(o.totalCost - minTotalCost);
      o.differenceFromCheapestEmi = this.round(o.monthlyEmi - minEmi);

      const score = o.totalCost + o.effectiveApr * 1000;
      if (score < minScore) {
        minScore = score;
        bestOffer = o;
      }
    });

    return {
      offers: calculated,
      bestOverallOfferId: bestOffer.id,
    };
  }

  /**
   * Generates a Multi-Rate & Multi-Tenure sensitivity matrix and scenario comparison
   */
  public static generateMultiScenarioMatrix(input: MultiScenarioMatrixInput): MultiScenarioMatrixResult {
    const { principal, rates } = input;
    const sortedRates = [...rates].sort((a, b) => a - b);

    let sortedTenuresMonths: number[] = [];
    if (input.tenuresMonths && input.tenuresMonths.length > 0) {
      sortedTenuresMonths = Array.from(new Set(input.tenuresMonths.map((m) => Math.round(m)))).sort((a, b) => a - b);
    } else if (input.tenuresYears && input.tenuresYears.length > 0) {
      sortedTenuresMonths = Array.from(new Set(input.tenuresYears.map((y) => Math.round(y * 12)))).sort((a, b) => a - b);
    } else {
      sortedTenuresMonths = [120, 180, 240, 300, 360];
    }
    const sortedTenuresYears = sortedTenuresMonths.map((m) => Math.round((m / 12) * 10) / 10);

    const baseRate = input.baseRate ?? (sortedRates.includes(8.5) ? 8.5 : sortedRates[Math.floor(sortedRates.length / 2)] || 8.5);
    const baseTenureMonths = input.baseTenureMonths ?? (input.baseTenureYears ? Math.round(input.baseTenureYears * 12) : (sortedTenuresMonths.includes(240) ? 240 : sortedTenuresMonths[Math.floor(sortedTenuresMonths.length / 2)] || 240));
    const baseTenureYears = Math.round((baseTenureMonths / 12) * 10) / 10;

    const baseEmi = this.calculateEMI(principal, baseRate, baseTenureMonths);
    const baseTotalPayment = this.round(baseEmi * baseTenureMonths);
    const baseTotalInterest = this.round(baseTotalPayment - principal);
    const baseRatio = principal > 0 ? this.round((baseTotalInterest / principal) * 100) : 0;

    const baseScenario: MultiScenarioMatrixCell = {
      annualRate: baseRate,
      tenureYears: baseTenureYears,
      tenureMonths: baseTenureMonths,
      monthlyEmi: baseEmi,
      totalInterest: baseTotalInterest,
      totalPayment: baseTotalPayment,
      interestToPrincipalRatio: baseRatio,
      differenceFromBaseEmi: 0,
      differenceFromBaseInterest: 0,
      differenceFromBaseTotal: 0,
    };

    let lowestEmiCell: MultiScenarioMatrixCell | null = null;
    let lowestInterestCell: MultiScenarioMatrixCell | null = null;

    const matrix: MultiScenarioMatrixCell[][] = [];

    for (let rIdx = 0; rIdx < sortedRates.length; rIdx++) {
      const rate = sortedRates[rIdx];
      const row: MultiScenarioMatrixCell[] = [];

      for (let tIdx = 0; tIdx < sortedTenuresMonths.length; tIdx++) {
        const tenureMonths = sortedTenuresMonths[tIdx];
        const tenureYears = sortedTenuresYears[tIdx];
        const monthlyEmi = this.calculateEMI(principal, rate, tenureMonths);
        const totalPayment = this.round(monthlyEmi * tenureMonths);
        const totalInterest = this.round(totalPayment - principal);
        const interestToPrincipalRatio = principal > 0 ? this.round((totalInterest / principal) * 100) : 0;

        const cell: MultiScenarioMatrixCell = {
          annualRate: rate,
          tenureYears,
          tenureMonths,
          monthlyEmi,
          totalInterest,
          totalPayment,
          interestToPrincipalRatio,
          differenceFromBaseEmi: this.round(monthlyEmi - baseEmi),
          differenceFromBaseInterest: this.round(totalInterest - baseTotalInterest),
          differenceFromBaseTotal: this.round(totalPayment - baseTotalPayment),
        };

        if (!lowestEmiCell || monthlyEmi < lowestEmiCell.monthlyEmi) {
          lowestEmiCell = cell;
        }
        if (!lowestInterestCell || totalInterest < lowestInterestCell.totalInterest) {
          lowestInterestCell = cell;
        }

        row.push(cell);
      }
      matrix.push(row);
    }

    // Advisory Insight 1: Tenure Cut Savings
    const cutToMonths = Math.max(60, baseTenureMonths - 60);
    const cutToYears = Math.round((cutToMonths / 12) * 10) / 10;
    const cutEmi = this.calculateEMI(principal, baseRate, cutToMonths);
    const cutTotalInterest = this.round(cutEmi * cutToMonths - principal);
    const tenureCutSavings = {
      fromYears: baseTenureYears,
      toYears: cutToYears,
      monthlyEmiIncrease: this.round(cutEmi - baseEmi),
      lifetimeInterestSaved: this.round(baseTotalInterest - cutTotalInterest),
    };

    // Advisory Insight 2: Rate Hike Impact (+0.50% hike)
    const hikePercent = 0.5;
    const revisedRate = this.round(baseRate + hikePercent);
    const hikeEmi = this.calculateEMI(principal, revisedRate, baseTenureMonths);
    const hikeTotalInterest = this.round(hikeEmi * baseTenureMonths - principal);

    // Equivalent tenure extension if EMI kept constant at baseEmi
    let equivalentTenureExtensionMonths = 0;
    const monthlyHikeRate = revisedRate / 12 / 100;
    if (principal * monthlyHikeRate < baseEmi) {
      const nHike = -Math.log(1 - (principal * monthlyHikeRate) / baseEmi) / Math.log(1 + monthlyHikeRate);
      equivalentTenureExtensionMonths = Math.max(0, Math.round(nHike - baseTenureMonths));
    }

    // Equivalent lump sum prepayment needed to keep EMI at baseEmi
    let equivalentLumpSumPrepayment = 0;
    if (monthlyHikeRate > 0) {
      const pvFactor = (1 - Math.pow(1 + monthlyHikeRate, -baseTenureMonths)) / monthlyHikeRate;
      const targetPrincipal = baseEmi * pvFactor;
      equivalentLumpSumPrepayment = this.round(Math.max(0, principal - targetPrincipal));
    }

    const rateHikeImpact = {
      hikePercent,
      revisedRate,
      monthlyEmiIncrease: this.round(hikeEmi - baseEmi),
      lifetimeInterestIncrease: this.round(hikeTotalInterest - baseTotalInterest),
      equivalentTenureExtensionMonths,
      equivalentLumpSumPrepayment,
    };

    // Advisory Insight 3: Rate Drop Advantage (-0.50% drop)
    const dropPercent = 0.5;
    const dropRate = this.round(Math.max(0.1, baseRate - dropPercent));
    const dropEmi = this.calculateEMI(principal, dropRate, baseTenureMonths);
    const dropTotalInterest = this.round(dropEmi * baseTenureMonths - principal);
    const rateDropAdvantage = {
      dropPercent,
      revisedRate: dropRate,
      monthlyEmiSavings: this.round(baseEmi - dropEmi),
      lifetimeInterestSaved: this.round(baseTotalInterest - dropTotalInterest),
    };

    return {
      principal,
      rates: sortedRates,
      tenuresYears: sortedTenuresYears,
      tenuresMonths: sortedTenuresMonths,
      matrix,
      baseScenario,
      lowestEmiCell: lowestEmiCell || baseScenario,
      lowestInterestCell: lowestInterestCell || baseScenario,
      advisoryInsights: {
        tenureCutSavings,
        rateHikeImpact,
        rateDropAdvantage,
      },
    };
  }
}
