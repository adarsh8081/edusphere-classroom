import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsRepository } from '../analytics.repository';
import { db } from '../../../core/database/db';

vi.mock('../../../core/database/db', () => ({
    db: {
        select: vi.fn(),
        execute: vi.fn(),
    }
}));

describe('Analytics Repository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getCoreTotals calculates sums successfully', async () => {
        // Chain mock for `db.select().from(table)`
        const mockFrom = vi.fn().mockResolvedValue([{ count: 10 }]);
        vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

        const totals = await analyticsRepository.getCoreTotals();

        // It should have called db.select 3 times (users, classes, wellbeingCheckins)
        expect(db.select).toHaveBeenCalledTimes(3);
        expect(totals).toEqual({
            userCount: { count: 10 },
            classCount: { count: 10 },
            wellbeingCount: { count: 10 }
        });
    });

    it('getDailyActivityHeatmap executes raw SQL', async () => {
        vi.mocked(db.execute).mockResolvedValue({ rows: [{ date: '2023-10-01', count: 5 }] } as any);

        const heatmap = await analyticsRepository.getDailyActivityHeatmap(new Date());

        expect(db.execute).toHaveBeenCalled();
        expect(heatmap.rows).toBeDefined();
        expect(heatmap.rows[0].count).toBe(5);
    });
});
