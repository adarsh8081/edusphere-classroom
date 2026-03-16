import { gamificationRepository } from "./gamification.repository";
import { badges } from "@edusphere/types";

// ── Level thresholds ─────────────────────────────────────────────────────────
export const LEVELS = [
    { level: 1, name: "Apprentice", minXp: 0, icon: "📚", color: "#6B7280" },
    { level: 2, name: "Scholar", minXp: 200, icon: "🎓", color: "#3B82F6" },
    { level: 3, name: "Expert", minXp: 600, icon: "⚡", color: "#8B5CF6" },
    { level: 4, name: "Mentor", minXp: 1500, icon: "🔥", color: "#F59E0B" },
    { level: 5, name: "Legend", minXp: 3500, icon: "👑", color: "#10B981" },
];

export const XP_REWARDS: Record<string, number> = {
    daily_login: 25,
    assignment_submit: 50,
    assignment_early: 80,   // submit > 24hr before deadline
    forum_post: 20,
    forum_answer_helped: 30,   // when another user upvotes their answer
    quiz_complete: 40,
    quiz_perfect: 100,  // 100% score
    career_milestone: 200,
    guild_message: 5,
    badge_earned: 0,    // overridden by badge.xpBonus
};

export const DEFAULT_BADGES = [
    { slug: "pioneer", name: "Pioneer", description: "First user to join EduSphere", icon: "🚀", xpBonus: 150 },
    { slug: "early_bird", name: "Early Bird", description: "Submit 3 assignments before the deadline", icon: "🐦", xpBonus: 75 },
    { slug: "streak_7", name: "Week Warrior", description: "Maintain a 7-day learning streak", icon: "🔥", xpBonus: 100 },
    { slug: "streak_30", name: "Streak Master", description: "Maintain a 30-day learning streak", icon: "⚡", xpBonus: 300 },
    { slug: "quiz_ace", name: "Quiz Ace", description: "Score 100% on any quiz", icon: "🎯", xpBonus: 100 },
    { slug: "forum_helper", name: "Forum Helper", description: "Post 10 helpful forum replies", icon: "🤝", xpBonus: 80 },
    { slug: "level_scholar", name: "Scholar", description: "Reach Scholar level (200 XP)", icon: "🎓", xpBonus: 50 },
    { slug: "level_expert", name: "Expert", description: "Reach Expert level (600 XP)", icon: "⚡", xpBonus: 100 },
    { slug: "level_legend", name: "Legend", description: "Reach Legend level (3500 XP)", icon: "👑", xpBonus: 500 },
    { slug: "career_starter", name: "Career Starter", description: "Enroll in your first Career Path", icon: "💼", xpBonus: 60 },
];

export function calculateLevel(totalXp: number): { level: number; name: string; icon: string; color: string; nextLevelXp: number } {
    let current = LEVELS[0];
    for (const l of LEVELS) {
        if (totalXp >= l.minXp) current = l;
    }
    const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1;
    const nextLevelXp = nextIdx < LEVELS.length ? LEVELS[nextIdx].minXp : current.minXp;
    return { ...current, nextLevelXp };
}

export async function getBadges() {
    return await gamificationRepository.getBadges();
}

// ── Seed default badges ───────────────────────────────────────────────────────
export async function seedBadges() {
    await gamificationRepository.seedBadges(DEFAULT_BADGES);
    console.log("[Gamification] Default badges seeded.");
}

// ── Award XP ─────────────────────────────────────────────────────────────────
export async function awardXP(
    userId: string,
    amount: number,
    reason: string,
    classId?: string,
    referenceId?: string
): Promise<{ totalXp: number; level: number; levelName: string; newBadges: any[] }> {
    // 1. Insert XP transaction
    await gamificationRepository.insertXPTransaction(userId, amount, reason, classId, referenceId);

    // 2. Update user level totals
    await gamificationRepository.ensureUserLevel(userId);
    const ul = await gamificationRepository.addUserXpAndGetLevel(userId, amount);

    // 3. Get updated totals
    const levelInfo = calculateLevel(ul.totalXp);

    // 4. Update level if changed
    if (levelInfo.level !== ul.level) {
        await gamificationRepository.updateUserLevel(userId, levelInfo.level);
    }

    // 5. Check + award badges
    const newBadges = await checkAndAwardBadges(userId, ul.totalXp, levelInfo.level, reason);

    return { totalXp: ul.totalXp, level: levelInfo.level, levelName: levelInfo.name, newBadges };
}

// ── Badge logic ───────────────────────────────────────────────────────────────
async function checkAndAwardBadges(userId: string, totalXp: number, level: number, reason: string): Promise<any[]> {
    const allBadges = await gamificationRepository.getBadges();
    const earned = await gamificationRepository.getEarnedBadges(userId);
    const earnedIds = new Set(earned.map(e => e.badgeId));
    const newlyEarned: any[] = [];

    for (const badge of allBadges) {
        if (earnedIds.has(badge.id)) continue;

        let shouldAward = false;

        if (badge.slug === "level_scholar" && level >= 2) shouldAward = true;
        if (badge.slug === "level_expert" && level >= 3) shouldAward = true;
        if (badge.slug === "level_legend" && level >= 5) shouldAward = true;
        if (badge.slug === "quiz_ace" && reason === "quiz_perfect") shouldAward = true;
        if (badge.slug === "career_starter" && reason === "career_milestone") shouldAward = true;

        // Streak badges are checked separately
        if (shouldAward) {
            await gamificationRepository.awardBadge(userId, badge.id);
            // Award badge bonus XP
            if (badge.xpBonus && badge.xpBonus > 0) {
                await gamificationRepository.awardBadgeBonusXp(userId, badge.slug, badge.xpBonus);
            }
            newlyEarned.push(badge);
        }
    }

    return newlyEarned;
}

// ── Update daily streak ───────────────────────────────────────────────────────
export async function updateStreak(userId: string): Promise<number> {
    const ul = await gamificationRepository.ensureUserLevel(userId);

    const now = new Date();
    const lastActive = ul.lastActiveAt ? new Date(ul.lastActiveAt) : new Date(0);
    const daysSinceLast = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = ul.streak ?? 0;
    if (daysSinceLast === 0) {
        // Same day - no change
    } else if (daysSinceLast === 1) {
        // Consecutive day
        newStreak = newStreak + 1;
    } else {
        // Streak broken
        newStreak = 1;
    }

    await gamificationRepository.updateUserStreak(userId, newStreak, now);

    // Check streak badges
    const ulUpdated = await gamificationRepository.ensureUserLevel(userId); // refreshing total XP, etc
    if (newStreak === 7) await checkAndAwardBadges(userId, ulUpdated.totalXp ?? 0, ulUpdated.level ?? 1, "streak_7");
    if (newStreak === 30) await checkAndAwardBadges(userId, ulUpdated.totalXp ?? 0, ulUpdated.level ?? 1, "streak_30");

    return newStreak;
}

// ── Get user gamification profile ─────────────────────────────────────────────
export async function getUserGamificationProfile(userId: string) {
    const ul = await gamificationRepository.ensureUserLevel(userId);
    const totalXp = ul.totalXp ?? 0;
    const levelInfo = calculateLevel(totalXp);

    const earnedBadges = await gamificationRepository.getUserEarnedBadgesWithDetails(userId);
    const recentXp = await gamificationRepository.getRecentXpTransactions(userId, 10);

    // XP progress toward next level
    const currentLevelXp = LEVELS[levelInfo.level - 1]?.minXp ?? 0;
    const progressToNext = levelInfo.nextLevelXp > currentLevelXp
        ? Math.round(((totalXp - currentLevelXp) / (levelInfo.nextLevelXp - currentLevelXp)) * 100)
        : 100;

    return {
        totalXp,
        level: levelInfo.level,
        levelName: levelInfo.name,
        levelIcon: levelInfo.icon,
        levelColor: levelInfo.color,
        nextLevelXp: levelInfo.nextLevelXp,
        progressPercent: progressToNext,
        streak: ul.streak ?? 0,
        badges: earnedBadges,
        recentXp,
    };
}

// ── Class leaderboard ─────────────────────────────────────────────────────────
export async function getClassLeaderboard(classId: string) {
    const dbResult = await gamificationRepository.getClassLeaderboardData(classId);

    return dbResult.map((r: any) => ({
        rank: Number(r.rank),
        userId: r.id,
        name: r.name,
        avatarUrl: r.avatar_url,
        totalXp: Number(r.total_xp),
        level: Number(r.level),
        levelInfo: calculateLevel(Number(r.total_xp)),
        streak: Number(r.streak),
    }));
}
