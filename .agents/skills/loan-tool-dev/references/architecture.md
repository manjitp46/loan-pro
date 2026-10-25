# LoanPro Architecture Reference

```
                             [ User Browser ]
                                     |
               +---------------------+---------------------+
               | :3000 (HTTP/HMR)                          | :5001 (Direct API)
               v                                           v
    +-----------------------+                   +-----------------------+
    |  loan-tool-frontend   |                   |   loan-tool-backend   |
    |  (Vite + React 18)    | --/api (proxy)--> |   (Node.js Express)   |
    +-----------------------+                   +-----------------------+
               |                                           |
               |                                           v
               |                                 +--------------------+
               |                                 |   better-sqlite3   |
               |                                 +--------------------+
               |                                           |
               v                                           v
      [ ./frontend (bind) ]                       [ ./data/loan_tool.db ]
                                                  (Persistent host volume)
```

## Service Details

### 1. Frontend (`loan-tool-frontend`)
- **Port**: Container port 3000 mapped to host port 3000.
- **Framework**: React 18 with Vite.
- **Styling**: Tailwind CSS with custom brand colors (emerald/teal/navy palettes).
- **Icons**: Lucide React.
- **Charts**: Recharts (`ResponsiveContainer`, `PieChart`, `BarChart`, `AreaChart`, `LineChart`).
- **PDF/CSV**: Client-side jsPDF with autoTable and RFC-4180 CSV builder.
- **Dev Server**: Bound to `0.0.0.0`, with polling interval of 1000ms ignoring `node_modules` for optimal performance over VM mounts.

### 2. Backend (`loan-tool-backend`)
- **Port**: Container port 5000 mapped to host port 5001 (to avoid macOS AirPlay Receiver conflict on port 5000).
- **Framework**: Express with TypeScript and `ts-node-dev`.
- **Validation**: Zod runtime schema validation on all POST routes.
- **Database Driver**: `better-sqlite3` with WAL mode (`pragma journal_mode = WAL`).

### 3. Database Persistence (`./data/loan_tool.db`)
- Initialized automatically on server start via `initDatabase()` in `backend/src/db/database.ts`.
- Tables:
  - `loan_presets`: Standard loan configurations (Home, Personal, Car, Education, Business).
  - `saved_calculations`: User-saved calculations and comparisons with 8-character share codes (`share_code`).
