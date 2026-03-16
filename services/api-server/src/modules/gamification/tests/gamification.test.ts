import { describe, it, expect, vi, beforeEach } from 'vitest';
import { awardXP, calculateLevel } from '../gamification.service';
import { gamificationRepository } from '../gamification.repository';

// Mock the gamification repository exclusively
vi.mock('../gamification.repository', () => ({
    gamificationRepository: {
        insertXPTransaction: vi.fn(),
        ensureUserLevel: vi.fn(),
        addUserXpAndGetLevel: vi.fn(),
        updateUserLevel: vi.fn(),
        getBadges: vi.fn(),
        getEarnedBadges: vi.fn(),
        awardBadge: vi.fn(),
        awardBadgeBonusXp: vi.fn()
    }
}));

describe('Gamification Service', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('calculateLevel', () => {
        it('should correctly calculate level starting at 1', () => {
            expect(calculateLevel(0).level).toBe(1);
            expect(calculateLevel(50).level).toBe(1);
            expect(calculateLevel(99).level).toBe(1);
        });

        it('should calculate level 2 at exactly 200 XP', () => {
            expect(calculateLevel(200).level).toBe(2);
            expect(calculateLevel(450).level).toBe(2);
        });

        it('should scale levels accurately based on predefined brackets', () => {
            expect(calculateLevel(600).level).toBe(3);
            expect(calculateLevel(1500).level).toBe(4);
            expect(calculateLevel(3500).level).toBe(5);
            expect(calculateLevel(9999).level).toBe(5); // max Legend
        });
    });

    describe('awardXP', () => {
        it('should award XP and return appropriately if threshold not met', async () => {
            // Mock db returns
            vi.mocked(gamificationRepository.insertXPTransaction).mockResolvedValue(undefined as any);
            vi.mocked(gamificationRepository.ensureUserLevel).mockResolvedValue(true as any);
            vi.mocked(gamificationRepository.addUserXpAndGetLevel).mockResolvedValue({
                userId: 'user1',
                totalXp: 50,
                level: 1
            } as any);
            vi.mocked(gamificationRepository.getBadges).mockResolvedValue([]);
            vi.mocked(gamificationRepository.getEarnedBadges).mockResolvedValue([]);

            const result = await awardXP('user1', 30, 'quiz_completed');

            expect(gamificationRepository.insertXPTransaction).toHaveBeenCalledWith('user1', 30, 'quiz_completed', undefined, undefined);
            expect(gamificationRepository.ensureUserLevel).toHaveBeenCalledWith('user1');
            expect(result).toEqual({ totalXp: 50, level: 1, levelName: 'Apprentice', newBadges: [] });
        });

        it('should detect level up when XP crosses a bracket boundary', async () => {
            vi.mocked(gamificationRepository.insertXPTransaction).mockResolvedValue(undefined as any);
            vi.mocked(gamificationRepository.ensureUserLevel).mockResolvedValue(true as any);
            vi.mocked(gamificationRepository.addUserXpAndGetLevel).mockResolvedValue({
                userId: 'user2',
                totalXp: 210, // Newly added reaches 210 -> Level 2
                level: 1 // Previous level was 1 in the DB record
            } as any);
            vi.mocked(gamificationRepository.getBadges).mockResolvedValue([
                { id: 'b1', slug: 'level_scholar', xpBonus: 50 } as any
            ]);
            vi.mocked(gamificationRepository.getEarnedBadges).mockResolvedValue([]);

            const result = await awardXP('user2', 50, 'assignment_submitted');

            // It detected the level change and triggered the update
            expect(gamificationRepository.updateUserLevel).toHaveBeenCalledWith('user2', 2);
            expect(gamificationRepository.awardBadge).toHaveBeenCalledWith('user2', 'b1');
            expect(result.level).toBe(2);
            expect(result.levelName).toBe('Scholar');
            expect(result.newBadges.length).toBe(1);
        });
    });

});
