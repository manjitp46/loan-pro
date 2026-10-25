# LoanPro - Advanced Loan Comparison & Financial Analytics Platform

LoanPro is a production-grade, responsive loan comparison and financial analytics platform inspired by [emicalculator.net](https://emicalculator.net/). Built with **React 18 + TypeScript + Tailwind CSS** on the frontend, **Node.js + Express + TypeScript** on the backend, and **SQLite** for zero-configuration persistent storage, fully containerized via **Docker Compose**.

---

## 🌟 Key Features

1. **Comprehensive Multi-Loan EMI Calculators**
   - Supports **Home Loans**, **Personal Loans**, **Car Loans**, **Education Loans**, and **Business Loans**.
   - Dual-synchronized sliders and direct numerical inputs.
   - Down payment deduction, tenure toggle (Years / Months), and configurable processing fees with GST / taxes.
   - Live Institutional-Grade KPI Cards: Monthly EMI, Principal Borrowed, Total Interest, Total Repayment, and Effective APR.

2. **Side-by-Side Loan Comparison Engine**
   - Compare up to 4 loan offers simultaneously (customizable lenders like HDFC, SBI, ICICI, Chase, etc.).
   - Side-by-side metric table comparing EMI, total interest, upfront fees, and APR.
   - Intelligent algorithms highlight **Lowest EMI**, **Lowest Total Interest**, **Lowest Cost**, and **Recommended Best Value Offer**.
   - Visual multi-bar cost breakdown comparisons.

3. **Prepayment & Early Debt-Freedom Simulator**
   - Model the compound interest impact of:
     - **Recurring Extra Monthly Payments** (e.g. +₹5,000 / +$200 per month).
     - **Annual Lump-Sum Prepayments** (e.g. bonus / extra EMI once a year).
     - **Milestone Lump-Sum Infusions** (at custom months).
   - Choose between two strategic objectives:
     - **Reduce Loan Tenure (Keep EMI constant)**: Drastically reduces interest and clears the loan years ahead of schedule.
     - **Reduce Monthly EMI (Keep Tenure constant)**: Lowers ongoing monthly payment obligations.
   - Visual balance payoff curve comparing baseline loan payoff vs accelerated payoff.

4. **Balance Transfer & Refinancing Calculator**
   - Evaluates whether migrating an existing loan to a lower-interest lender produces actual net savings.
   - Accounts for new lender processing fees and existing lender foreclosure/prepayment penalties.
   - Computes monthly EMI difference, net savings, and **breakeven period in months**.
   - Visual status badges: *Highly Recommended*, *Moderately Recommended*, or *Not Recommended*.

5. **Borrower Loan Eligibility Calculator**
   - Based on banking **Fixed Obligation to Income Ratio (FOIR)** standards (40% - 65%).
   - Factors in net take-home salary and existing monthly debt commitments.
   - Computes maximum approved loan limit, maximum allowable EMI, and disposable monthly income.
   - Provides personalized actionable guidance to maximize loan approval limits.

6. **Fixed vs Floating Interest Rate Simulator**
   - Simulates central bank repo rate hiking and easing cycles.
   - Add custom rate revision points at future loan months.
   - Compares total interest liability between a fixed-rate loan and a floating-rate trajectory.

7. **Interactive Amortization Schedules & Visualizations**
   - Yearly summary table with one-click drill-down to all 12 monthly payments for any year.
   - Progress bar tracking principal reduction over time.
   - High-fidelity **Donut Charts**, **Stacked Yearly Bar Charts**, and **Balance Payoff Area Charts** powered by Recharts.

8. **Export & Sharing Capabilities**
   - **Spreadsheet CSV Export**: Complete yearly and monthly amortization schedule ready for Excel.
   - **Executive PDF Statements**: Professional financial statement with header banner, KPI summary box, and styled amortization table.
   - **Persistent SQLite Saving & Shareable Reports**: Generates unique shareable codes (`/share/:code`) persisted directly in the local SQLite database.

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, jsPDF, jspdf-autotable.
- **Backend**: Node.js 20, Express, TypeScript, Zod (runtime validation), Better-SQLite3, Jest, Supertest.
- **Database**: SQLite (persisted via Docker volume mount `./data` <-> `/app/data`).
- **Containerization**: Docker Compose with multi-container bridge network, bind mounts for hot reload, and isolated dependencies.

---

## 🚀 Quick Start with Docker Compose

Everything runs completely inside Docker; **nothing needs to be installed locally** except Docker.

### 1. Build and Start the Application
```bash
docker compose up --build
```

### 2. Access the Application
- **Frontend Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **API Documentation Root**: [http://localhost:5000/](http://localhost:5000/)

### 3. Hot Reload in Development
- Edits made to `frontend/src/*` trigger automatic hot-module replacement (HMR) at [http://localhost:3000](http://localhost:3000).
- Edits made to `backend/src/*` trigger automatic server reloads via `ts-node-dev`.
- Database files in `./data/loan_tool.db` persist across all container rebuilds and restarts.

---

## 🧪 Running Automated Tests

Run the test suite directly inside the Docker container:

```bash
docker compose run --rm backend npm test
```

This executes:
- **Unit Tests (`financialMath.test.ts`)**: EMI calculations, edge cases (0% interest, negative principals), amortization balance reconciliation, prepayment tenure reductions, APR Newton-Raphson approximation, and balance transfer breakeven math.
- **Integration Tests (`api.test.ts`)**: HTTP endpoints for `/api/presets`, `/api/calculate/emi`, `/api/saved`, validation rejections, and shareable link retrieval.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check and server timestamp |
| `GET` | `/api/presets` | Standard loan configuration presets for all loan types |
| `POST` | `/api/calculate/emi` | Calculate EMI, total interest, APR, and full amortization schedule |
| `POST` | `/api/calculate/prepayment` | Simulate extra monthly and lump-sum prepayment outcomes |
| `POST` | `/api/calculate/balance-transfer` | Compute refinance net savings and breakeven horizon |
| `POST` | `/api/calculate/eligibility` | FOIR-based maximum borrowing capacity check |
| `POST` | `/api/calculate/floating-rate` | Benchmark fixed interest against variable rate changes |
| `POST` | `/api/calculate/compare` | Multi-lender side-by-side offer comparison |
| `POST` | `/api/saved` | Persist calculation to SQLite and generate 8-character share code |
| `GET` | `/api/saved` | Retrieve list of saved comparison reports |
| `GET` | `/api/saved/:code` | Retrieve specific calculation report by share code |
| `DELETE` | `/api/saved/:id` | Delete saved report from database |

---

## 📐 Financial Formulas Reference

### Monthly EMI
$$E = P \cdot r \cdot \frac{(1+r)^n}{(1+r)^n - 1}$$
Where:
- $P$ = Net Principal Loan Disbursed
- $r$ = Monthly Interest Rate $\left(\frac{\text{Annual Rate}}{12 \times 100}\right)$
- $n$ = Tenure in Months

### Monthly Interest Portion
$$I_m = B_{m-1} \cdot r$$
Where $B_{m-1}$ is the outstanding principal balance at the beginning of month $m$.

### Monthly Scheduled Principal
$$P_m = \min(E - I_m, B_{m-1})$$

### Prepayment Acceleration
When extra payment $X_m$ is made in month $m$:
$$B_m = B_{m-1} - P_m - X_m$$
For **Reduce Tenure**, $E$ remains identical, causing the principal balance $B_m$ to hit zero in $n' \ll n$ months.

---

## 📄 License
MIT License. Free for personal and commercial financial analysis.
