import request from 'supertest';
import { app } from '../src/index';

describe('API Route Tests', () => {
  it('GET /api/health returns 200 and ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/presets returns loan types configuration', async () => {
    const res = await request(app).get('/api/presets');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.presets.length).toBeGreaterThanOrEqual(5);
  });

  it('POST /api/calculate/emi validates and returns schedule and metrics', async () => {
    const res = await request(app)
      .post('/api/calculate/emi')
      .send({
        principal: 2000000,
        annualRate: 9.0,
        tenureMonths: 60,
        processingFeePercent: 1.0,
        taxPercentOnFee: 18,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.monthlyEmi).toBeGreaterThan(0);
    expect(res.body.data.schedule.yearly.length).toBe(5);
  });

  it('POST /api/calculate/emi rejects invalid input', async () => {
    const res = await request(app)
      .post('/api/calculate/emi')
      .send({
        principal: -500, // Invalid negative principal
        annualRate: 9.0,
        tenureMonths: 60,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/saved creates shareable calculation and GET /api/saved/:code retrieves it', async () => {
    const saveRes = await request(app)
      .post('/api/saved')
      .send({
        title: 'Integration Test Home Loan',
        calculatorType: 'emi',
        loanType: 'home',
        inputData: { principal: 3000000, annualRate: 8.5, tenureMonths: 180 },
        resultSummary: { emi: 29550, totalInterest: 2319000 },
      });

    expect(saveRes.status).toBe(201);
    expect(saveRes.body.success).toBe(true);
    const shareCode = saveRes.body.data.shareCode;
    expect(shareCode).toBeDefined();

    const getRes = await request(app).get(`/api/saved/${shareCode}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.title).toBe('Integration Test Home Loan');
  });

  it('POST /api/calculate/multi-scenario calculates rate & tenure sensitivity matrix', async () => {
    const res = await request(app)
      .post('/api/calculate/multi-scenario')
      .send({
        principal: 4000000,
        rates: [8.25, 8.5, 8.75],
        tenuresYears: [15, 20],
        baseRate: 8.5,
        baseTenureYears: 20,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.matrix.length).toBe(3);
    expect(res.body.data.matrix[0].length).toBe(2);
    expect(res.body.data.baseScenario.monthlyEmi).toBeGreaterThan(0);
  });
});
