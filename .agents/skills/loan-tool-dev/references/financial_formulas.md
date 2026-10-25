# Financial Formulas Reference

### 1. Monthly EMI (Equated Monthly Installment)
$$E = P \cdot r \cdot \frac{(1+r)^n}{(1+r)^n - 1}$$
Where:
- $P$ = Principal Loan Disbursed
- $r$ = Monthly Interest Rate $= \frac{\text{Annual Rate}}{12 \times 100}$
- $n$ = Loan Tenure in Months
- Edge Case: If $r = 0$, $E = \frac{P}{n}$

### 2. Monthly Amortization Breakdown
For each month $m = 1 \dots n$:
- **Opening Balance**: $B_{m-1}$ (starts at $P$)
- **Interest Portion**: $I_m = B_{m-1} \cdot r$
- **Principal Portion**: $P_m = \min(E - I_m, B_{m-1})$
- In the final month ($m = n$): $P_n = B_{n-1}$ (absorbs rounding fractions)
- **Extra Prepayment**: $X_m$ (optional)
- **Closing Balance**: $B_m = B_{m-1} - P_m - X_m$

### 3. Effective APR (Annual Percentage Rate)
Solves for Internal Rate of Return ($r_{apr}$) using Newton-Raphson approximation:
$$f(r) = (P - \text{UpfrontFees}) - E \cdot \left[\frac{1 - (1+r)^{-n}}{r}\right] = 0$$
$$\text{APR} = r \times 12 \times 100$$

### 4. Loan Eligibility (FOIR Based)
$$\text{Max Allowable Total EMI} = \text{Gross Monthly Income} \times \frac{\text{FOIR}\%}{100}$$
$$\text{Available Monthly EMI} = \max(0, \text{Max Allowable Total EMI} - \text{Existing Debt Obligations})$$
$$\text{Max Eligible Loan Principal} = \text{Available EMI} \cdot \left[\frac{(1+r)^n - 1}{r(1+r)^n}\right]$$

### 5. Balance Transfer & Refinance Analysis
$$\text{Gross Interest Saved} = \text{Total Interest Remaining on Old Loan} - \text{Total Interest on New Loan}$$
$$\text{Total Switching Cost} = \text{New Processing Fees} + \text{Old Foreclosure Penalties}$$
$$\text{Net Lifetime Savings} = \text{Gross Interest Saved} - \text{Total Switching Cost}$$
$$\text{Breakeven Months} = \left\lceil \frac{\text{Total Switching Cost}}{\text{Monthly EMI Difference}} \right\rceil$$
