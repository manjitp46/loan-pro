---
name: loan-tool-dev
description: >-
  Development runbook, workflows, and procedures for extending and maintaining the
  LoanPro advanced loan comparison and EMI calculation platform. Use this skill when
  adding new financial calculators, updating interest/amortization math, adding loan
  presets, extending backend Express endpoints, modifying SQLite database schemas,
  building React UI components/charts, or running Docker verification suites.
---

# LoanPro Development Skill

This skill guides development on the **LoanPro** loan comparison and financial analytics platform. Follow these procedures to maintain architectural integrity, accurate financial calculations, and zero-host-dependency Docker workflows.

---

## 1. Core Architecture & Stack

- **Container Runtime**: Docker Compose with Colima. Everything runs in isolated containers; **no local host npm or node installations required**.
- **Backend**: Express + TypeScript in `/app` (Docker) mapped to `./backend` on host. Uses `better-sqlite3` and `zod`. Hot-reloaded via `ts-node-dev`.
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS in `/app` (Docker) mapped to `./frontend` on host. Uses `recharts`, `lucide-react`, `jspdf`. Hot-reloaded via Vite.
- **Database**: SQLite stored at `/app/data/loan_tool.db` (persisted to host `./data/loan_tool.db` via volume mount).

For detailed architecture diagrams and file responsibilities, consult:
[Architecture Reference](./references/architecture.md)

---

## 2. Lifecycle Commands (`./scripts/manage.sh`)

Always manage the stack using the unified management script:

```bash
# Start the full stack in background
./scripts/manage.sh start

# Check container health and HTTP port status
./scripts/manage.sh status

# Run automated unit and integration tests inside Docker
./scripts/manage.sh test

# Stream live container logs
./scripts/manage.sh logs [backend|frontend]

# Rebuild images after modifying Dockerfiles or package.json
./scripts/manage.sh rebuild

# Stop services cleanly
./scripts/manage.sh stop
```

---

## 3. Financial Calculation Standards

When modifying or introducing financial logic:
1. **Mathematical Precision**: Always round to 2 decimal places using `FinancialMath.round(val, 2)`:
   $$\text{round}(v) = \frac{\lfloor (v + \epsilon) \cdot 100 \rceil}{100}$$
2. **Reconciliation**:
   - In any amortization schedule, the sum of all monthly `principal` amounts must equal the initial borrowed principal.
   - The final scheduled month must absorb any remaining rounding fraction so that `endingBalance = 0`.
3. **Dual Synchronization**:
   - Complex persistent calculations and server validation reside in `backend/src/services/financialMath.ts`.
   - Client-side real-time calculation logic resides in `frontend/src/utils/calculatorEngine.ts` to ensure 0ms latency slider adjustments. Keep formulas aligned between both engines.

For detailed formula definitions (reducing balance EMI, APR Newton-Raphson approximation, FOIR eligibility, and prepayment amortization), see:
[Financial Formulas Reference](./references/financial_formulas.md)

---

## 4. Backend Extension Procedures

### Adding a New Financial Calculator or Endpoint
1. **Define Types**: Add input and output interfaces in `backend/src/types/loan.ts`.
2. **Implement Logic**: Add calculation method to `FinancialMath` in `backend/src/services/financialMath.ts`.
3. **Controller & Validation**:
   - Add Zod validation schema in `backend/src/controllers/loanController.ts`.
   - Add endpoint method in `LoanController`.
4. **Register Route**: Mount the new route in `backend/src/routes/api.ts`.
5. **Unit & API Tests**: Add corresponding test cases in `backend/tests/financialMath.test.ts` and `backend/tests/api.test.ts`.
6. Run `./scripts/manage.sh test` to verify.

### Modifying SQLite Database Schema
1. Database initialization and migrations live in `backend/src/db/database.ts`.
2. Add `CREATE TABLE IF NOT EXISTS` or schema migration logic inside `initDatabase()`.
3. Ensure persistence is maintained in `./data/loan_tool.db`.

For full API endpoint documentation and request/response payloads:
[REST API Reference](./references/api_reference.md)

---

## 5. Frontend Extension Procedures

### Adding a New Calculator View
1. Create new component in `frontend/src/components/calculators/<CalculatorName>.tsx`.
2. Import and use `ClientCalculatorEngine` from `frontend/src/utils/calculatorEngine.ts` for real-time reactivity.
3. Import formatters (`formatCurrency`, `formatPercent`, `formatTenure`) from `frontend/src/utils/formatters.ts`.
4. Register the new tab in `frontend/src/components/layout/Navbar.tsx` and render it in `frontend/src/App.tsx`.
5. Ensure type safety by running:
   ```bash
   docker compose exec frontend npx tsc --noEmit
   ```

---

## 6. Verification Runbook

Before completing any task, execute the automated verification script:

```bash
./.agents/skills/loan-tool-dev/scripts/run_checks.sh
```

This script verifies:
1. Docker daemon & Colima status.
2. Container health and HTTP endpoints (`:3000` and `:5001/api/health`).
3. Backend Jest test suite passes 100%.
4. Frontend TypeScript compiler (`tsc --noEmit`) passes with 0 errors.
5. SQLite database file integrity and permissions.
