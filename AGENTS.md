# AGENTS.md - LoanPro Agent Instructions & Operational Guidelines

This document provides definitive instructions, architectural constraints, and engineering workflows for any AI agent or pair programmer collaborating on the **LoanPro** loan comparison and financial analytics platform.

---

## 1. Prime Directives & Containerized Purity

1. **Docker Compose is the Sole Source of Truth**:
   - All runtime execution, dependencies, and testing occur inside Docker containers.
   - **Never run `npm install` directly on the host machine**; all packages are managed inside the container images.
   - The developer uses **Colima** on macOS (`colima start`). Do not attempt to invoke Docker Desktop.

2. **Port Allocations & Network Routing**:
   - **Frontend App**: `http://localhost:3000` (Container internal: 3000)
   - **Admin Console**: `http://localhost:3001` (Container internal: 3001)
   - **Backend API**: `http://localhost:5001` (Container internal: 5000 — mapped to 5001 on the host to avoid macOS AirPlay Receiver port 5000 conflicts)
   - Internal container-to-container communication runs over Docker network `loan-network`.

3. **Database Architecture & Persistence**:
   - Database: SQLite with WAL mode (`PRAGMA journal_mode = WAL`).
   - Persistent volume: Mounted from `./data` on the host to `/app/data` in the backend and admin containers.
   - Database file path: `/app/data/loan_tool.db`.
   - Never place temporary database files outside the `./data` volume.

---

## 2. Financial Engineering Integrity Rules

When extending financial calculations, amortization schedules, or borrowing algorithms:

1. **Mathematical Precision & Epsilon Rounding**:
   - Always round monetary amounts using mathematical epsilon:
     ```typescript
     function round(val: number, decimals: number = 2): number {
       const factor = Math.pow(10, decimals);
       return Math.round((val + Number.EPSILON) * factor) / factor;
     }
     ```
2. **Amortization Schedule Reconciliation**:
   - **Principal Balance Invariant**: In any generated monthly schedule, the sum of all monthly `principal` payments must equal the initial principal borrowed.
   - **Final Month Absorption**: In the final scheduled month ($m = n$), scheduled principal must absorb any fractional cent/paisa rounding differences, forcing `endingBalance = 0`.
3. **Dual-Engine Synchronization**:
   - The server financial math engine is located at [`backend/src/services/financialMath.ts`](file:///Users/manjit/work/manjit/loan-tool/backend/src/services/financialMath.ts).
   - The zero-latency client-side engine is located at [`frontend/src/utils/calculatorEngine.ts`](file:///Users/manjit/work/manjit/loan-tool/frontend/src/utils/calculatorEngine.ts).
   - Any formula improvement, new strategy, or edge-case handling must be **mirrored in both files**.

---

## 3. Unified Lifecycle Management (`./scripts/manage.sh`)

Always utilize the single management script for all application lifecycle tasks:

```bash
# Start all containers in background
./scripts/manage.sh start

# Verify container health and HTTP port status
./scripts/manage.sh status

# Run automated unit and integration tests inside Docker
./scripts/manage.sh test

# Stream logs (backend, frontend, admin, or all)
./scripts/manage.sh logs [backend|frontend|admin]

# Rebuild containers after modifying Dockerfiles or package dependencies
./scripts/manage.sh rebuild

# Stop all services gracefully
./scripts/manage.sh stop
```

---

## 4. Verification & Quality Runbook

Before concluding any development task or submitting changes:
1. Run the automated quality verification suite:
   ```bash
   ./.agents/skills/loan-tool-dev/scripts/run_checks.sh
   ```
2. Ensure:
   - All 17+ backend Jest tests pass (`financialMath.test.ts` & `api.test.ts`).
   - Frontend TypeScript compiler (`npx tsc --noEmit`) passes with **0 errors**.
   - All 3 containers (`backend`, `frontend`, `admin`) respond with HTTP 200.

---

## 5. Technology Stack Quick Reference

- **Backend**: Node.js 20, Express, TypeScript, Zod, Better-SQLite3, Jest, Supertest.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, jsPDF, jspdf-autotable.
- **Admin**: Lightweight Node.js + Express container with direct SQLite connection and Tailwind UI.
- **Orchestration**: Docker Compose, Colima VM.
