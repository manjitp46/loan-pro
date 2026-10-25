import {
  AmortizationMonthEntry,
  AmortizationYearEntry,
  BalanceTransferInput,
  BalanceTransferResult,
  EmiCalculationInput,
  EmiCalculationResult,
  FloatingRateSimulationInput,
  FloatingRateSimulationResult,
  LoanComparisonResult,
  LoanEligibilityInput,
  LoanEligibilityResult,
  LoanOffer,
  PrepaymentSimulationInput,
  PrepaymentSimulationResult,
  RateChangePoint,
} from '../types/loan';

export class FinancialMath {
  /**
   * Rounds a number to 2 decimal places with mathematical precision
   */
  public static round(val: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((val + Number.EPSILON) * factor) / factor;
  }

  /**
   * Calculates monthly EMI
   * E = P * r * (1 + r)^n / ((1 + r)^n - 1)
   */
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

  /**
   * Approximates Annual Percentage Rate (APR) including upfront processing fees
   */
  public static calculateAPR(principal: number, annualRate: number, tenureMonths: number, upfrontFees: number): number {
    if (principal <= 0 || tenureMonths <= 0) return annualRate;
    const netDisbursed = principal - upfrontFees;
    if (netDisbursed <= 0) return annualRate;

    const monthlyEmi = this.calculateEMI(principal, annualRate, tenureMonths);
    // Use Newton-Raphson to solve for IRR / APR:
    // f(r) = netDisbursed - emi * (1 - (1+r)^(-n)) / r = 0
    let r = annualRate / 12 / 100;
    for (let i = 0; i < 40; i++) {
      const pvFactor = (1 - Math.pow(1 + r, -tenureMonths)) / r;
      const f = netDisbursed - monthlyEmi * pvFactor;
      if (Math.abs(f) < 0.001) break;

      // Derivative f'(r)
      const df = monthlyEmi * ((1 - Math.pow(1 + r, -tenureMonths)) / (r * r) - (tenureMonths * Math.pow(1 + r, -tenureMonths - 1)) / r);
      if (Math.abs(df) < 1e-10) break;
      r = r - f / df;
      if (r <= 0) {
        r = 0.0001;
      }
    }
    const apr = r * 12 * 100;
    return this.round(Math.max(apr, annualRate));
  }

  /**
   * Generates Amortization Schedule (Monthly and Yearly breakdowns)
   */
  public static generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    tenureMonths: number,
    startDateStr?: string,
    prepaymentMap?: Map<number, number>, // month -> extra amount
    rateChanges?: RateChangePoint[]
  ): { monthly: AmortizationMonthEntry[]; yearly: AmortizationYearEntry[] } {
    const monthly: AmortizationMonthEntry[] = [];
    const yearly: AmortizationYearEntry[] = [];

    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    let currentBalance = principal;
    let currentAnnualRate = annualRate;
    let currentEmi = this.calculateEMI(principal, currentAnnualRate, tenureMonths);

    // Map of rate changes by month
    const rateMap = new Map<number, number>();
    if (rateChanges) {
      rateChanges.forEach((rc) => rateMap.set(rc.month, rc.newRate));
    }

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

      // Check if rate changed at this month
      if (rateMap.has(month)) {
        currentAnnualRate = rateMap.get(month)!;
        const remainingMonths = tenureMonths - month + 1;
        currentEmi = this.calculateEMI(currentBalance, currentAnnualRate, remainingMonths);
      }

      const monthlyRate = currentAnnualRate / 12 / 100;
      const monthDate = new Date(startDate);
      monthDate.setMonth(monthDate.getMonth() + month - 1);
      const dateStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const beginningBalance = currentBalance;
      const interestForMonth = this.round(beginningBalance * monthlyRate);
      let principalForMonth = this.round(currentEmi - interestForMonth);

      if (principalForMonth > beginningBalance) {
        principalForMonth = beginningBalance;
      }

      const extraPrepayment = prepaymentMap?.get(month) || 0;
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

      // Close out year if 12th month of the year or loan is paid off or final month
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

        // Reset for next year
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

  /**
   * Main EMI Calculator
   */
  public static calculateEmi(input: EmiCalculationInput): EmiCalculationResult {
    const principal = input.downPayment ? Math.max(0, input.principal - input.downPayment) : input.principal;
    const monthlyEmi = this.calculateEMI(principal, input.annualRate, input.tenureMonths);

    // Processing Fee calculation
    let totalProcessingFee = 0;
    if (input.flatProcessingFee) {
      totalProcessingFee += input.flatProcessingFee;
    }
    if (input.processingFeePercent) {
      totalProcessingFee += (principal * input.processingFeePercent) / 100;
    }
    totalProcessingFee = this.round(totalProcessingFee);

    const taxPercent = input.taxPercentOnFee ?? 18; // default 18% GST
    const taxOnFee = this.round((totalProcessingFee * taxPercent) / 100);
    const totalUpfrontCharges = this.round(totalProcessingFee + taxOnFee);

    const schedule = this.generateAmortizationSchedule(principal, input.annualRate, input.tenureMonths, input.startDate);

    const totalInterest = schedule.monthly.reduce((sum, m) => sum + m.interest, 0);
    const roundedTotalInterest = this.round(totalInterest);
    const totalPayment = this.round(principal + roundedTotalInterest + totalUpfrontCharges);

    const effectiveApr = this.calculateAPR(principal, input.annualRate, input.tenureMonths, totalUpfrontCharges);
    const interestToPrincipalRatio = totalPayment > 0 ? this.round((roundedTotalInterest / (principal + roundedTotalInterest)) * 100) : 0;

    return {
      monthlyEmi,
      principalAmount: principal,
      totalInterest: roundedTotalInterest,
      totalProcessingFee,
      taxOnFee,
      totalUpfrontCharges,
      totalPayment,
      effectiveApr,
      interestToPrincipalRatio,
      schedule,
    };
  }

  /**
   * Prepayment Simulation Calculator
   */
  public static simulatePrepayment(input: PrepaymentSimulationInput): PrepaymentSimulationResult {
    const { principal, annualRate, tenureMonths, strategy, extraMonthlyPayment = 0, annualPrepayment = 0, lumpSums = [], startDate } = input;

    // Baseline calculation without prepayment
    const originalEmi = this.calculateEMI(principal, annualRate, tenureMonths);
    const baselineSchedule = this.generateAmortizationSchedule(principal, annualRate, tenureMonths, startDate);
    const originalTotalInterest = this.round(baselineSchedule.monthly.reduce((sum, m) => sum + m.interest, 0));
    const originalTotalPayment = this.round(principal + originalTotalInterest);

    // Build prepayment map
    const prepaymentMap = new Map<number, number>();
    for (let m = 1; m <= tenureMonths; m++) {
      let prepay = extraMonthlyPayment;
      if (annualPrepayment > 0 && m % 12 === 0) {
        prepay += annualPrepayment;
      }
      if (prepay > 0) {
        prepaymentMap.set(m, prepay);
      }
    }
    for (const ls of lumpSums) {
      if (ls.month >= 1 && ls.month <= tenureMonths && ls.amount > 0) {
        const cur = prepaymentMap.get(ls.month) || 0;
        prepaymentMap.set(ls.month, cur + ls.amount);
      }
    }

    if (strategy === 'reduce_tenure') {
      const schedule = this.generateAmortizationSchedule(principal, annualRate, tenureMonths, startDate, prepaymentMap);
      const totalInterest = this.round(schedule.monthly.reduce((sum, m) => sum + m.interest, 0));
      const totalPrepayments = this.round(schedule.monthly.reduce((sum, m) => sum + m.prepayment, 0));
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
      // strategy === 'reduce_emi': Keep tenure same, but recalculate EMI whenever prepayment occurs
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

        if (principalForMonth > beginningBalance) {
          principalForMonth = beginningBalance;
        }

        const extraPrepayment = prepaymentMap.get(month) || 0;
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

        // If a prepayment occurred, recalculate EMI for remaining tenure
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

      const totalInterest = this.round(monthly.reduce((sum, m) => sum + m.interest, 0));
      const totalPrepayments = this.round(monthly.reduce((sum, m) => sum + m.prepayment, 0));
      const totalPayment = this.round(principal + totalInterest);
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
          totalPayment,
          monthsSaved: 0,
          interestSaved,
          totalSavings: interestSaved,
          closureMonth: monthly.length,
        },
        schedule: { monthly, yearly },
      };
    }
  }

  /**
   * Balance Transfer / Refinance Calculator
   */
  public static calculateBalanceTransfer(input: BalanceTransferInput): BalanceTransferResult {
    const {
      outstandingBalance,
      currentRate,
      remainingTenureMonths,
      newRate,
      newTenureMonths = remainingTenureMonths,
      newProcessingFeePercent = 0.5,
      newFlatFee = 0,
      foreclosurePenaltyPercent = 0,
      foreclosureFlatPenalty = 0,
    } = input;

    // Current Loan remaining schedule
    const currentEmi = this.calculateEMI(outstandingBalance, currentRate, remainingTenureMonths);
    const currentSchedule = this.generateAmortizationSchedule(outstandingBalance, currentRate, remainingTenureMonths);
    const remainingCurrentInterest = this.round(currentSchedule.monthly.reduce((s, m) => s + m.interest, 0));
    const totalRemainingPayment = this.round(outstandingBalance + remainingCurrentInterest);

    // New Loan schedule
    const newEmi = this.calculateEMI(outstandingBalance, newRate, newTenureMonths);
    const newSchedule = this.generateAmortizationSchedule(outstandingBalance, newRate, newTenureMonths);
    const totalNewInterest = this.round(newSchedule.monthly.reduce((s, m) => s + m.interest, 0));

    // Fees and penalties
    const processingFee = this.round(newFlatFee + (outstandingBalance * newProcessingFeePercent) / 100);
    const foreclosurePenalty = this.round(foreclosureFlatPenalty + (outstandingBalance * foreclosurePenaltyPercent) / 100);
    const totalTransferCost = this.round(processingFee + foreclosurePenalty);
    const totalNewPayment = this.round(outstandingBalance + totalNewInterest + totalTransferCost);

    const monthlyEmiDiff = this.round(currentEmi - newEmi);
    const interestSaved = this.round(remainingCurrentInterest - totalNewInterest);
    const netSavings = this.round(interestSaved - totalTransferCost);

    // Breakeven calculation
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
      recommendationReason = `Significant net savings of ${netSavings.toLocaleString()} with a fast breakeven of ${breakevenMonths} months. Highly recommended to switch.`;
    } else if (netSavings > 0 && breakevenMonths <= 36) {
      recommendation = 'moderately_recommended';
      recommendationReason = `Moderate net savings of ${netSavings.toLocaleString()} recovering costs in ${breakevenMonths} months. Consider if you plan to keep the loan long term.`;
    } else {
      recommendation = 'not_recommended';
      recommendationReason = `Net savings are negative or breakeven period (${breakevenMonths} months) exceeds financial benefit. Switching is not recommended.`;
    }

    return {
      currentLoan: {
        outstandingBalance,
        monthlyEmi: currentEmi,
        remainingInterest: remainingCurrentInterest,
        totalRemainingPayment,
      },
      newLoan: {
        monthlyEmi: newEmi,
        totalInterest: totalNewInterest,
        processingFee,
        foreclosurePenalty,
        totalTransferCost,
        totalNewPayment,
      },
      monthlyEmiDiff,
      interestSaved,
      netSavings,
      breakevenMonths,
      recommendation,
      recommendationReason,
    };
  }

  /**
   * Loan Eligibility Calculator (FOIR-based)
   */
  public static calculateEligibility(input: LoanEligibilityInput): LoanEligibilityResult {
    const { loanType, grossMonthlyIncome, existingMonthlyEmi, annualRate, tenureYears, foirPercent } = input;

    // Standard FOIR by loan type if not provided
    const defaultFoir = loanType === 'home' ? 60 : loanType === 'personal' ? 50 : loanType === 'car' ? 55 : 50;
    const effectiveFoir = foirPercent || defaultFoir;

    const maxTotalAllowedEmi = this.round((grossMonthlyIncome * effectiveFoir) / 100);
    const availableMonthlyEmi = this.round(Math.max(0, maxTotalAllowedEmi - existingMonthlyEmi));

    const tenureMonths = tenureYears * 12;
    const monthlyRate = annualRate / 12 / 100;

    // Invert EMI formula to get Max Loan Amount:
    // P = EMI * ((1+r)^n - 1) / (r * (1+r)^n)
    let eligibleMaxLoanAmount = 0;
    if (availableMonthlyEmi > 0 && monthlyRate > 0) {
      const compound = Math.pow(1 + monthlyRate, tenureMonths);
      eligibleMaxLoanAmount = this.round((availableMonthlyEmi * (compound - 1)) / (monthlyRate * compound));
    } else if (availableMonthlyEmi > 0 && monthlyRate === 0) {
      eligibleMaxLoanAmount = this.round(availableMonthlyEmi * tenureMonths);
    }

    const estimatedEmi = availableMonthlyEmi;
    const totalRepayment = this.round(estimatedEmi * tenureMonths);
    const totalInterest = this.round(Math.max(0, totalRepayment - eligibleMaxLoanAmount));
    const disposableIncome = this.round(grossMonthlyIncome - existingMonthlyEmi - estimatedEmi);

    let eligibilityStatus: 'eligible' | 'borderline' | 'ineligible' = 'eligible';
    const suggestions: string[] = [];

    if (availableMonthlyEmi <= 0) {
      eligibilityStatus = 'ineligible';
      suggestions.push('Your existing monthly obligations exceed or equal the maximum permissible FOIR limit.');
      suggestions.push('Consider closing existing short-term loans or credit card balances to free up EMI capacity.');
      suggestions.push('Adding a co-borrower (spouse or parent) can significantly increase household eligible income.');
    } else if (availableMonthlyEmi < grossMonthlyIncome * 0.2) {
      eligibilityStatus = 'borderline';
      suggestions.push('Your remaining EMI capacity is under 20% of income. Increasing tenure can increase loan eligibility.');
      suggestions.push('A co-applicant can increase combined eligibility by up to 50-80%.');
    } else {
      eligibilityStatus = 'eligible';
      suggestions.push('Strong debt-to-income profile! You qualify for competitive interest rates.');
      suggestions.push('You can opt for a shorter tenure to save on total interest or borrow higher if required.');
    }

    return {
      grossMonthlyIncome,
      maxAllowedFoirPercent: effectiveFoir,
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

  /**
   * Fixed vs Floating Rate Simulation
   */
  public static simulateFloatingRate(input: FloatingRateSimulationInput): FloatingRateSimulationResult {
    const { principal, initialRate, tenureMonths, rateChanges } = input;

    // Fixed Scenario
    const fixedEmi = this.calculateEMI(principal, initialRate, tenureMonths);
    const fixedSchedule = this.generateAmortizationSchedule(principal, initialRate, tenureMonths);
    const fixedTotalInterest = this.round(fixedSchedule.monthly.reduce((s, m) => s + m.interest, 0));
    const fixedTotalPayment = this.round(principal + fixedTotalInterest);

    // Floating Scenario with scheduled rate adjustments
    const floatingSchedule = this.generateAmortizationSchedule(principal, initialRate, tenureMonths, undefined, undefined, rateChanges);
    const floatingTotalInterest = this.round(floatingSchedule.monthly.reduce((s, m) => s + m.interest, 0));
    const floatingTotalPayment = this.round(principal + floatingTotalInterest);
    const finalEmi = floatingSchedule.monthly.length > 0 ? floatingSchedule.monthly[floatingSchedule.monthly.length - 1].emi : fixedEmi;

    return {
      fixedScenario: {
        emi: fixedEmi,
        totalInterest: fixedTotalInterest,
        totalPayment: fixedTotalPayment,
        tenureMonths,
      },
      floatingScenario: {
        finalEmi,
        totalInterest: floatingTotalInterest,
        totalPayment: floatingTotalPayment,
        effectiveTenureMonths: floatingSchedule.monthly.length,
        interestDiff: this.round(floatingTotalInterest - fixedTotalInterest),
      },
      schedule: floatingSchedule,
    };
  }

  /**
   * Multi-Offer Loan Comparison
   */
  public static compareLoanOffers(offers: LoanOffer[]): LoanComparisonResult {
    if (!offers || offers.length === 0) {
      return { offers: [], bestOverallOfferId: '' };
    }

    const calculated = offers.map((offer) => {
      const emi = this.calculateEMI(offer.principal, offer.annualRate, offer.tenureMonths);
      const totalFees = this.round(offer.flatProcessingFee + (offer.principal * offer.processingFeePercent) / 100 + offer.otherCharges);
      const schedule = this.generateAmortizationSchedule(offer.principal, offer.annualRate, offer.tenureMonths);
      const totalInterest = this.round(schedule.monthly.reduce((s, m) => s + m.interest, 0));
      const totalCost = this.round(offer.principal + totalInterest + totalFees);
      const effectiveApr = this.calculateAPR(offer.principal, offer.annualRate, offer.tenureMonths, totalFees);
      const interestRatio = totalCost > 0 ? this.round((totalInterest / (offer.principal + totalInterest)) * 100) : 0;

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
        interestToPrincipalRatio: interestRatio,
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

      // Best overall is determined primarily by total cost and APR
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
}
