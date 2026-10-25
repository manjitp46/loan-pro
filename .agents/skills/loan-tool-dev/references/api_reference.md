# REST API Reference

Base URL: `http://localhost:5001/api` (or `http://localhost:3000/api` via Vite proxy)

### Endpoints

#### 1. System Health
- **GET `/api/health`**
- Response: `{"status": "ok", "timestamp": "2026-10-25T..."}`

#### 2. Loan Presets
- **GET `/api/presets`**
- Response: List of standard presets for Home, Personal, Car, Education, and Business loans with default amounts, rates, and tenures.

#### 3. Calculate EMI & Amortization
- **POST `/api/calculate/emi`**
- Payload:
  ```json
  {
    "principal": 5000000,
    "annualRate": 8.5,
    "tenureMonths": 240,
    "processingFeePercent": 0.5,
    "taxPercentOnFee": 18,
    "downPayment": 1000000,
    "startDate": "2026-11-01"
  }
  ```
- Response: `monthlyEmi`, `principalAmount`, `totalInterest`, `totalPayment`, `effectiveApr`, `schedule` (`monthly` and `yearly`).

#### 4. Simulate Prepayments
- **POST `/api/calculate/prepayment`**
- Payload:
  ```json
  {
    "principal": 5000000,
    "annualRate": 8.5,
    "tenureMonths": 240,
    "strategy": "reduce_tenure",
    "extraMonthlyPayment": 5000,
    "annualPrepayment": 50000,
    "lumpSums": [{"month": 12, "amount": 200000}]
  }
  ```

#### 5. Balance Transfer Analysis
- **POST `/api/calculate/balance-transfer`**
- Payload:
  ```json
  {
    "outstandingBalance": 4000000,
    "currentRate": 9.5,
    "remainingTenureMonths": 180,
    "newRate": 8.4,
    "newProcessingFeePercent": 0.5,
    "foreclosurePenaltyPercent": 0
  }
  ```

#### 6. Loan Eligibility Check
- **POST `/api/calculate/eligibility`**
- Payload:
  ```json
  {
    "loanType": "home",
    "grossMonthlyIncome": 120000,
    "existingMonthlyEmi": 15000,
    "annualRate": 8.5,
    "tenureYears": 20,
    "foirPercent": 50
  }
  ```

#### 7. Compare Multiple Loan Offers
- **POST `/api/calculate/compare`**
- Payload:
  ```json
  {
    "offers": [
      {"id": "1", "bankName": "Bank A", "principal": 5000000, "annualRate": 8.5, "tenureMonths": 240, "processingFeePercent": 0.5, "flatProcessingFee": 0, "otherCharges": 0},
      {"id": "2", "bankName": "Bank B", "principal": 5000000, "annualRate": 8.25, "tenureMonths": 240, "processingFeePercent": 0.4, "flatProcessingFee": 0, "otherCharges": 0}
    ]
  }
  ```

#### 8. Saved & Shared Calculations
- **POST `/api/saved`**: Saves calculation to SQLite and returns an 8-character unique `shareCode`.
- **GET `/api/saved`**: Lists all saved calculations.
- **GET `/api/saved/:shareCode`**: Retrieves the stored calculation by its share code.
- **DELETE `/api/saved/:id`**: Deletes a saved record.
