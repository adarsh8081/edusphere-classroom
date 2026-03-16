import { z } from 'zod';
import * as schemas from '@edusphere/types';

export const errorSchemas = {
    validation: z.object({ message: z.string(), field: z.string().optional() }),
    notFound: z.object({ message: z.string() }),
    unauthorized: z.object({ message: z.string() }),
    internal: z.object({ message: z.string() }),
};

export const api = {
    auth: {
        register: {
            method: 'POST' as const,
            path: '/api/register' as const,
            input: schemas.insertUserSchema,
            responses: {
                201: z.custom<schemas.User>(),
                400: errorSchemas.validation,
            }
        },
        login: {
            method: 'POST' as const,
            path: '/api/login' as const,
            input: z.object({ email: z.string(), password: z.string() }),
            responses: {
                200: z.custom<schemas.User>(),
                401: errorSchemas.unauthorized,
            }
        },
        logout: {
            method: 'POST' as const,
            path: '/api/logout' as const,
            responses: {
                200: z.object({ message: z.string() })
            }
        },
        me: {
            method: 'GET' as const,
            path: '/api/me' as const,
            responses: {
                200: z.custom<schemas.User>(),
                401: errorSchemas.unauthorized,
            }
        }
    },
    classes: {
        list: {
            method: 'GET' as const,
            path: '/api/classes' as const,
            responses: { 200: z.array(z.custom<schemas.Class>()) }
        },
        create: {
            method: 'POST' as const,
            path: '/api/classes' as const,
            input: schemas.insertClassSchema,
            responses: { 201: z.custom<schemas.Class>() }
        },
        get: {
            method: 'GET' as const,
            path: '/api/classes/:classId' as const,
            responses: { 200: z.custom<schemas.Class>(), 404: errorSchemas.notFound }
        },
        update: {
            method: 'PATCH' as const,
            path: '/api/classes/:classId' as const,
            input: schemas.insertClassSchema.partial(),
            responses: { 200: z.custom<schemas.Class>(), 404: errorSchemas.notFound }
        },
        delete: {
            method: 'DELETE' as const,
            path: '/api/classes/:classId' as const,
            responses: { 200: z.object({ success: z.boolean() }), 404: errorSchemas.notFound }
        },
        join: {
            method: 'POST' as const,
            path: '/api/classes/join' as const,
            input: z.object({ classCode: z.string() }),
            responses: { 201: z.object({ message: z.string() }), 400: errorSchemas.validation, 404: errorSchemas.notFound }
        },
        roster: {
            method: 'GET' as const,
            path: '/api/classes/:classId/roster' as const,
            responses: { 200: z.array(z.custom<schemas.User>()) }
        },
        mySubmissions: {
            method: 'GET' as const,
            path: '/api/classes/:classId/my-submissions' as const,
            responses: { 200: z.array(z.any()) }
        }
    },
    posts: {
        list: {
            method: 'GET' as const,
            path: '/api/classes/:classId/posts' as const,
            responses: { 200: z.array(z.any()) }
        },
        create: {
            method: 'POST' as const,
            path: '/api/classes/:classId/posts' as const,
            input: schemas.insertPostSchema.extend({
                scheduledAt: z.string().optional(),
                poll: z.object({
                    question: z.string(),
                    options: z.array(z.string()),
                    multipleAnswers: z.boolean().optional(),
                    closesAt: z.string().optional()
                }).optional()
            }),
            responses: { 201: z.custom<schemas.Post>() }
        },
        translate: {
            method: 'POST' as const,
            path: '/api/posts/:postId/translate' as const,
            input: z.object({ targetLanguage: z.string().default('en') }),
            responses: { 200: z.object({ translatedText: z.string() }) }
        }
    },
    comments: {
        create: {
            method: 'POST' as const,
            path: '/api/posts/:postId/comments' as const,
            input: schemas.insertCommentSchema,
            responses: { 201: z.custom<schemas.Comment>() }
        }
    },
    topics: {
        list: {
            method: 'GET' as const,
            path: '/api/classes/:classId/topics' as const,
            responses: { 200: z.array(z.custom<schemas.Topic>()) }
        },
        create: {
            method: 'POST' as const,
            path: '/api/classes/:classId/topics' as const,
            input: schemas.insertTopicSchema,
            responses: { 201: z.custom<schemas.Topic>() }
        }
    },
    resources: {
        list: {
            method: 'GET' as const,
            path: '/api/topics/:topicId/resources' as const,
            responses: { 200: z.array(z.custom<schemas.Resource>()) }
        },
        create: {
            method: 'POST' as const,
            path: '/api/topics/:topicId/resources' as const,
            input: schemas.insertResourceSchema,
            responses: { 201: z.custom<schemas.Resource>() }
        },
        delete: {
            method: 'DELETE' as const,
            path: '/api/resources/:resourceId' as const,
            responses: { 200: z.object({ success: z.boolean() }) }
        },
        recommendations: {
            method: 'GET' as const,
            path: '/api/resources/:resourceId/recommendations' as const,
            responses: { 200: z.array(z.any()) }
        }
    },
    assignments: {
        list: {
            method: 'GET' as const,
            path: '/api/classes/:classId/assignments' as const,
            responses: { 200: z.array(z.custom<schemas.Assignment>()) }
        },
        create: {
            method: 'POST' as const,
            path: '/api/classes/:classId/assignments' as const,
            input: schemas.insertAssignmentSchema.extend({
                dueDate: z.string().optional(),
                isPeerReview: z.boolean().optional(),
                reviewDeadline: z.string().optional(),
                reviewsPerStudent: z.number().optional(),
                prerequisites: z.array(z.string()).optional()
            }),
            responses: { 201: z.custom<schemas.Assignment>() }
        },
        get: {
            method: 'GET' as const,
            path: '/api/classes/:classId/assignments/:assignmentId' as const,
            responses: { 200: z.custom<schemas.Assignment>() }
        }
    },
    submissions: {
        list: {
            method: 'GET' as const,
            path: '/api/assignments/:assignmentId/submissions' as const,
            responses: { 200: z.array(z.any()) }
        },
        create: {
            method: 'POST' as const,
            path: '/api/assignments/:assignmentId/submissions' as const,
            input: schemas.insertSubmissionSchema,
            responses: { 201: z.custom<schemas.Submission>() }
        },
        grade: {
            method: 'PATCH' as const,
            path: '/api/submissions/:submissionId/grade' as const,
            input: z.object({ grade: z.coerce.number(), feedback: z.string().optional() }),
            responses: { 200: z.custom<schemas.Submission>() }
        },
        checkPlagiarism: {
            method: 'POST' as const,
            path: '/api/submissions/:submissionId/check-plagiarism' as const,
            responses: { 200: z.custom<schemas.Submission>(), 404: errorSchemas.notFound }
        }
    },
    attendance: {
        list: {
            method: 'GET' as const,
            path: '/api/classes/:classId/attendance' as const,
            input: z.object({ date: z.string().optional() }).optional(),
            responses: { 200: z.array(z.custom<schemas.Attendance>()) }
        },
        mark: {
            method: 'POST' as const,
            path: '/api/classes/:classId/attendance' as const,
            input: z.object({
                date: z.string(),
                records: z.array(z.object({
                    studentId: z.string(),
                    status: z.enum(['present', 'absent', 'late'])
                }))
            }),
            responses: { 201: z.object({ message: z.string() }) }
        }
    },
    notifications: {
        list: {
            method: 'GET' as const,
            path: '/api/notifications' as const,
            responses: { 200: z.array(z.any()) }
        },
        markRead: {
            method: 'PATCH' as const,
            path: '/api/notifications/:id/read' as const,
            responses: { 200: z.object({ success: z.boolean() }) }
        },
        preferences: {
            method: 'GET' as const,
            path: '/api/notifications/preferences' as const,
            responses: { 200: z.any() }
        },
        updatePreferences: {
            method: 'PATCH' as const,
            path: '/api/notifications/preferences' as const,
            input: z.any(),
            responses: { 200: z.object({ success: z.boolean() }) }
        }
    },
    parents: {
        children: {
            method: 'GET' as const,
            path: '/api/parents/children' as const,
            responses: { 200: z.array(z.custom<schemas.User>()) }
        },
        dashboard: {
            method: 'GET' as const,
            path: '/api/parents/children/:studentId/dashboard' as const,
            responses: { 200: z.any() }
        },
        invite: {
            method: 'POST' as const,
            path: '/api/parents/invite' as const,
            input: z.object({ studentId: z.string(), parentEmail: z.string().email() }),
            responses: { 200: z.object({ message: z.string() }), 403: errorSchemas.unauthorized, 404: errorSchemas.notFound }
        },
        getInvitation: {
            method: 'GET' as const,
            path: '/api/parents/invitations/:token' as const,
            responses: { 200: z.any(), 404: errorSchemas.notFound }
        },
        linkStudent: {
            method: 'POST' as const,
            path: '/api/parents/link' as const,
            input: z.object({ token: z.string() }),
            responses: { 200: z.object({ message: z.string() }), 400: errorSchemas.validation, 403: errorSchemas.unauthorized }
        }
    },
    messaging: {
        conversations: {
            list: {
                method: 'GET' as const,
                path: '/api/conversations' as const,
                responses: { 200: z.array(z.any()) }
            },
            create: {
                method: 'POST' as const,
                path: '/api/conversations' as const,
                input: z.object({ type: z.string(), name: z.string().optional(), participants: z.array(z.string()) }),
                responses: { 201: z.any() }
            }
        },
        messages: {
            list: {
                method: 'GET' as const,
                path: '/api/conversations/:conversationId/messages' as const,
                responses: { 200: z.array(z.any()) }
            },
            send: {
                method: 'POST' as const,
                path: '/api/conversations/:conversationId/messages' as const,
                input: z.object({ content: z.string() }),
                responses: { 201: z.any() }
            }
        }
    },
    polls: {
        get: {
            method: 'GET' as const,
            path: '/api/posts/:postId/poll' as const,
            responses: { 200: z.any() }
        },
        vote: {
            method: 'POST' as const,
            path: '/api/polls/:pollId/vote' as const,
            input: z.object({ optionId: z.string() }),
            responses: { 200: z.object({ success: z.boolean() }) }
        }
    },
    analytics: {
        engagement: {
            method: 'GET' as const,
            path: '/api/classes/:classId/analytics/engagement' as const,
            responses: { 200: z.array(z.any()) }
        },
        assignment: {
            method: 'GET' as const,
            path: '/api/assignments/:assignmentId/analytics' as const,
            responses: { 200: z.any() }
        },
        atRisk: {
            method: 'GET' as const,
            path: '/api/classes/:classId/analytics/at-risk' as const,
            responses: { 200: z.array(z.any()) }
        },
        riskAssessment: {
            method: 'POST' as const,
            path: '/api/classes/:classId/analytics/risk-assessment' as const,
            responses: { 200: z.object({ message: z.string() }) }
        }
    },
    guilds: {
        list: {
            method: 'GET' as const,
            path: '/api/guilds' as const,
            responses: { 200: z.array(z.any()) }
        },
        create: {
            method: 'POST' as const,
            path: '/api/guilds' as const,
            input: z.object({ name: z.string(), description: z.string().optional(), classId: z.string().optional() }),
            responses: { 201: z.any() }
        },
        channels: {
            method: 'GET' as const,
            path: '/api/guilds/:guildId/channels' as const,
            responses: { 200: z.array(z.any()) }
        },
        join: {
            method: 'POST' as const,
            path: '/api/guilds/:guildId/join' as const,
            responses: { 200: z.object({ message: z.string() }) }
        }
    },
    forums: {
        list: {
            method: 'GET' as const,
            path: '/api/forums' as const,
            responses: { 200: z.array(z.any()) }
        },
        create: {
            method: 'POST' as const,
            path: '/api/forums' as const,
            input: z.object({ title: z.string(), content: z.string(), communityId: z.string().optional() }),
            responses: { 201: z.any() }
        },
        comments: {
            method: 'GET' as const,
            path: '/api/forums/posts/:postId/comments' as const,
            responses: { 200: z.array(z.any()) }
        },
        vote: {
            method: 'POST' as const,
            path: '/api/forums/posts/:postId/vote' as const,
            input: z.object({ direction: z.enum(['up', 'down']) }),
            responses: { 200: z.object({ success: z.boolean() }) }
        }
    },
    career: {
        list: {
            method: 'GET' as const,
            path: '/api/career/paths' as const,
            responses: { 200: z.array(z.any()) }
        },
        enroll: {
            method: 'POST' as const,
            path: '/api/career/paths/:pathId/enroll' as const,
            responses: { 200: z.object({ message: z.string() }) }
        },
        progress: {
            method: 'GET' as const,
            path: '/api/career/progress' as const,
            responses: { 200: z.array(z.any()) }
        }
    },
    ai: {
        summarize: {
            method: 'POST' as const,
            path: '/api/ai/summarize' as const,
            input: z.object({ resourceId: z.string().optional(), text: z.string().optional() }),
            responses: { 200: z.object({ summary: z.string() }) }
        },
        suggestTags: {
            method: 'POST' as const,
            path: '/api/ai/suggest-tags' as const,
            input: z.object({ resourceId: z.string().optional(), text: z.string().optional() }),
            responses: { 200: z.array(z.string()) }
        },
        generateQuiz: {
            method: 'POST' as const,
            path: '/api/ai/generate-quiz' as const,
            input: z.object({ resourceId: z.string().optional(), text: z.string().optional() }),
            responses: { 200: z.array(z.any()) }
        },
        lessonPlan: {
            method: 'POST' as const,
            path: '/api/ai/lesson-plan' as const,
            input: z.object({ topic: z.string(), grade: z.string(), duration: z.string(), objectives: z.string().optional() }),
            responses: { 200: z.object({ plan: z.string() }) }
        }
    },
    gamification: {
        me: {
            method: 'GET' as const,
            path: '/api/gamification/me' as const,
            responses: { 200: z.any() }
        },
        leaderboard: {
            method: 'GET' as const,
            path: '/api/gamification/leaderboard/:classId' as const,
            responses: { 200: z.array(z.any()) }
        },
        awardXp: {
            method: 'POST' as const,
            path: '/api/gamification/xp' as const,
            input: z.object({ userId: z.string(), amount: z.number(), reason: z.string(), classId: z.string().optional() }),
            responses: { 200: z.object({ totalXp: z.number(), level: z.number(), newBadges: z.array(z.any()) }) }
        },
        badges: {
            method: 'GET' as const,
            path: '/api/gamification/badges' as const,
            responses: { 200: z.array(z.any()) }
        }
    },
    attendanceQR: {
        start: {
            method: 'POST' as const,
            path: '/api/attendance/session' as const,
            input: z.object({ classId: z.string() }),
            responses: { 201: z.any() }
        },
        scan: {
            method: 'POST' as const,
            path: '/api/attendance/scan' as const,
            input: z.object({ qrCode: z.string(), latitude: z.number().optional(), longitude: z.number().optional() }),
            responses: { 200: z.object({ message: z.string(), xpAwarded: z.number().optional() }), 400: errorSchemas.validation, 404: errorSchemas.notFound }
        },
        stats: {
            method: 'GET' as const,
            path: '/api/attendance/session/:sessionId/stats' as const,
            responses: { 200: z.any() }
        },
        active: {
            method: 'GET' as const,
            path: '/api/classes/:classId/attendance/active' as const,
            responses: { 200: z.any() }
        }
    },
    marketplace: {
        list: {
            method: 'GET' as const,
            path: '/api/marketplace' as const,
            responses: { 200: z.array(z.any()) }
        },
        get: {
            method: 'GET' as const,
            path: '/api/marketplace/:itemId' as const,
            responses: { 200: z.any(), 404: errorSchemas.notFound }
        },
        create: {
            method: 'POST' as const,
            path: '/api/marketplace' as const,
            input: schemas.insertMarketplaceItemSchema,
            responses: { 201: z.any() }
        },
        purchase: {
            method: 'POST' as const,
            path: '/api/marketplace/:itemId/purchase' as const,
            responses: { 200: z.any(), 400: errorSchemas.validation, 404: errorSchemas.notFound }
        },
        purchases: {
            method: 'GET' as const,
            path: '/api/marketplace/purchases' as const,
            responses: { 200: z.array(z.any()) }
        }
    },
    wellbeing: {
        checkin: {
            method: 'POST' as const,
            path: '/api/wellbeing/checkin' as const,
            input: schemas.insertWellbeingCheckinSchema,
            responses: { 200: z.any() }
        },
        stats: {
            method: 'GET' as const,
            path: '/api/wellbeing/stats/:classId' as const,
            responses: { 200: z.array(z.any()) }
        }
    }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
    let url = path;
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (url.includes(`:${key}`)) {
                url = url.replace(`:${key}`, String(value));
            }
        });
    }
    return url;
}
