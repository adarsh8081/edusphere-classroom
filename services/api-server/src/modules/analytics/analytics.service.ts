import { analyticsRepository } from "./analytics.repository";
import { subDays } from "date-fns";

export class AnalyticsService {
    /**
     * Aggregates platform-wide data for the Institutional Analytics Cockpit.
     */
    static async getInstitutionalStats() {
        // 1. Core Totals
        const { userCount, classCount, wellbeingCount } = await analyticsRepository.getCoreTotals();

        // 2. Engagement Heatmap Data (Daily Activity for the last 30 days)
        const thirtyDaysAgo = subDays(new Date(), 30);
        const dailyActivity = await analyticsRepository.getDailyActivityHeatmap(thirtyDaysAgo);

        // 3. Class Engagement Rankings
        const classPerformance = await analyticsRepository.getClassPerformanceRankings();

        // 4. Institutional Wellbeing Baseline
        const avgMood = await analyticsRepository.getInstitutionalWellbeingBaseline();

        return {
            totals: {
                users: Number(userCount.count),
                classes: Number(classCount.count),
                checkins: Number(wellbeingCount.count)
            },
            wellbeing: {
                averageMood: Number(avgMood.score || 0),
                activeFlags: Number(avgMood.flaggedCount || 0)
            },
            heatmap: Array.isArray(dailyActivity) ? dailyActivity : (dailyActivity as any).rows,
            rankings: classPerformance
        };
    }
}
