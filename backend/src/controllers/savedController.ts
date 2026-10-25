import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import db from '../db/database';
import { SavedCalculationRecord } from '../types/loan';

const saveCalculationSchema = z.object({
  title: z.string().min(1).max(120),
  calculatorType: z.enum(['emi', 'comparison', 'prepayment', 'transfer', 'eligibility', 'floating']),
  loanType: z.enum(['home', 'personal', 'car', 'education', 'business']).default('home'),
  inputData: z.record(z.any()),
  resultSummary: z.record(z.any()),
});

function generateShareCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters
}

export class SavedController {
  public static save(req: Request, res: Response): void {
    try {
      const validated = saveCalculationSchema.parse(req.body);
      const id = crypto.randomUUID();
      const shareCode = generateShareCode();
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO saved_calculations (
          id, share_code, title, calculator_type, loan_type, input_data, result_summary, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        shareCode,
        validated.title,
        validated.calculatorType,
        validated.loanType,
        JSON.stringify(validated.inputData),
        JSON.stringify(validated.resultSummary),
        now,
        now
      );

      res.status(201).json({
        success: true,
        data: {
          id,
          shareCode,
          title: validated.title,
          calculatorType: validated.calculatorType,
          loanType: validated.loanType,
          shareUrl: `/share/${shareCode}`,
          createdAt: now,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static getByShareCode(req: Request, res: Response): void {
    try {
      const { code } = req.params;
      const row = db.prepare('SELECT * FROM saved_calculations WHERE share_code = ?').get(code) as any;

      if (!row) {
        res.status(404).json({ success: false, error: 'Calculation report not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: row.id,
          shareCode: row.share_code,
          title: row.title,
          calculatorType: row.calculator_type,
          loanType: row.loan_type,
          inputData: JSON.parse(row.input_data),
          resultSummary: JSON.parse(row.result_summary),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static list(req: Request, res: Response): void {
    try {
      const type = req.query.type as string | undefined;
      let query = 'SELECT id, share_code, title, calculator_type, loan_type, result_summary, created_at FROM saved_calculations';
      const params: any[] = [];

      if (type) {
        query += ' WHERE calculator_type = ?';
        params.push(type);
      }
      query += ' ORDER BY created_at DESC LIMIT 50';

      const rows = db.prepare(query).all(...params) as any[];
      const data = rows.map((r) => ({
        id: r.id,
        shareCode: r.share_code,
        title: r.title,
        calculatorType: r.calculator_type,
        loanType: r.loan_type,
        resultSummary: JSON.parse(r.result_summary),
        createdAt: r.created_at,
      }));

      res.json({ success: true, calculations: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static delete(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const result = db.prepare('DELETE FROM saved_calculations WHERE id = ? OR share_code = ?').run(id, id);

      if (result.changes === 0) {
        res.status(404).json({ success: false, error: 'Calculation not found' });
        return;
      }

      res.json({ success: true, message: 'Calculation deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
