import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../db/database';

export class SettingsController {
  public static getSettings(req: Request, res: Response): void {
    try {
      const rows = db.prepare('SELECT key, value FROM site_settings').all() as Array<{ key: string; value: string }>;
      const settings: Record<string, string> = {};
      for (const r of rows) {
        settings[r.key] = r.value;
      }
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static updateSettings(req: Request, res: Response): void {
    try {
      const settings = req.body;
      const now = new Date().toISOString();
      const insert = db.prepare('INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)');

      const tx = db.transaction((entries: Record<string, any>) => {
        for (const [key, val] of Object.entries(entries)) {
          insert.run(key, String(val), now);
        }
      });
      tx(settings);

      res.json({ success: true, message: 'Settings updated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static updatePreset(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const p = req.body;

      const stmt = db.prepare(`
        UPDATE loan_presets SET
          name = COALESCE(?, name),
          default_amount = COALESCE(?, default_amount),
          min_amount = COALESCE(?, min_amount),
          max_amount = COALESCE(?, max_amount),
          step_amount = COALESCE(?, step_amount),
          default_rate = COALESCE(?, default_rate),
          min_rate = COALESCE(?, min_rate),
          max_rate = COALESCE(?, max_rate),
          step_rate = COALESCE(?, step_rate),
          default_tenure_years = COALESCE(?, default_tenure_years),
          min_tenure_years = COALESCE(?, min_tenure_years),
          max_tenure_years = COALESCE(?, max_tenure_years),
          default_processing_fee_percent = COALESCE(?, default_processing_fee_percent),
          default_down_payment_percent = COALESCE(?, default_down_payment_percent),
          description = COALESCE(?, description)
        WHERE id = ?
      `);

      const result = stmt.run(
        p.name,
        p.defaultAmount,
        p.minAmount,
        p.maxAmount,
        p.stepAmount,
        p.defaultRate,
        p.minRate,
        p.maxRate,
        p.stepRate,
        p.defaultTenureYears,
        p.minTenureYears,
        p.maxTenureYears,
        p.defaultProcessingFeePercent,
        p.defaultDownPaymentPercent,
        p.description,
        id
      );

      if (result.changes === 0) {
        res.status(404).json({ success: false, error: 'Preset not found' });
        return;
      }

      res.json({ success: true, message: 'Preset updated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static createPreset(req: Request, res: Response): void {
    try {
      const p = req.body;
      const id = p.id || `preset_${Date.now()}`;

      const stmt = db.prepare(`
        INSERT INTO loan_presets (
          id, type, name, default_amount, min_amount, max_amount, step_amount,
          default_rate, min_rate, max_rate, step_rate,
          default_tenure_years, min_tenure_years, max_tenure_years,
          default_processing_fee_percent, default_down_payment_percent, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        p.type || 'home',
        p.name,
        p.defaultAmount || 1000000,
        p.minAmount || 10000,
        p.maxAmount || 50000000,
        p.stepAmount || 10000,
        p.defaultRate || 8.5,
        p.minRate || 5.0,
        p.maxRate || 20.0,
        p.stepRate || 0.1,
        p.defaultTenureYears || 10,
        p.minTenureYears || 1,
        p.maxTenureYears || 30,
        p.defaultProcessingFeePercent || 0.5,
        p.defaultDownPaymentPercent || 20,
        p.description || ''
      );

      res.status(201).json({ success: true, message: 'Preset created', id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static deletePreset(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const result = db.prepare('DELETE FROM loan_presets WHERE id = ?').run(id);
      if (result.changes === 0) {
        res.status(404).json({ success: false, error: 'Preset not found' });
        return;
      }
      res.json({ success: true, message: 'Preset deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static executeSql(req: Request, res: Response): void {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ success: false, error: 'Query string required' });
        return;
      }

      const trimmed = query.trim();
      const isSelect = trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA');

      if (isSelect) {
        const rows = db.prepare(trimmed).all();
        res.json({ success: true, rows, count: rows.length });
      } else {
        const result = db.prepare(trimmed).run();
        res.json({ success: true, changes: result.changes, lastInsertRowid: result.lastInsertRowid });
      }
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  public static getStats(req: Request, res: Response): void {
    try {
      const presetCount = db.prepare('SELECT count(*) as count FROM loan_presets').get() as { count: number };
      const savedCount = db.prepare('SELECT count(*) as count FROM saved_calculations').get() as { count: number };
      const settingsCount = db.prepare('SELECT count(*) as count FROM site_settings').get() as { count: number };

      res.json({
        success: true,
        stats: {
          presets: presetCount.count,
          savedCalculations: savedCount.count,
          settingsKeys: settingsCount.count,
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
