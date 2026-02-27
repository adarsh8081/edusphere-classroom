import { z } from 'zod';
import {
  insertUserSchema, users, classes, insertClassSchema, posts, insertPostSchema,
  comments, insertCommentSchema, topics, insertTopicSchema, assignments, insertAssignmentSchema,
  submissions, insertSubmissionSchema, attendance, resources, insertResourceSchema
} from './schema';

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
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({ email: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
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
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  classes: {
    list: {
      method: 'GET' as const,
      path: '/api/classes' as const,
      responses: { 200: z.array(z.custom<typeof classes.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes' as const,
      input: insertClassSchema,
      responses: { 201: z.custom<typeof classes.$inferSelect>() }
    },
    get: {
      method: 'GET' as const,
      path: '/api/classes/:classId' as const,
      responses: { 200: z.custom<typeof classes.$inferSelect>(), 404: errorSchemas.notFound }
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
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) }
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
      responses: { 200: z.array(z.any()) } // post with author and comments
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes/:classId/posts' as const,
      input: insertPostSchema.extend({
        scheduledAt: z.string().optional(),
        poll: z.object({
          question: z.string(),
          options: z.array(z.string()),
          multipleAnswers: z.boolean().optional(),
          closesAt: z.string().optional()
        }).optional()
      }),
      responses: { 201: z.custom<typeof posts.$inferSelect>() }
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
      input: insertCommentSchema,
      responses: { 201: z.custom<typeof comments.$inferSelect>() }
    }
  },
  topics: {
    list: {
      method: 'GET' as const,
      path: '/api/classes/:classId/topics' as const,
      responses: { 200: z.array(z.custom<typeof topics.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes/:classId/topics' as const,
      input: insertTopicSchema,
      responses: { 201: z.custom<typeof topics.$inferSelect>() }
    }
  },
  resources: {
    list: {
      method: 'GET' as const,
      path: '/api/topics/:topicId/resources' as const,
      responses: { 200: z.array(z.custom<typeof resources.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/topics/:topicId/resources' as const,
      input: insertResourceSchema,
      responses: { 201: z.custom<typeof resources.$inferSelect>() }
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
      responses: { 200: z.array(z.custom<typeof assignments.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes/:classId/assignments' as const,
      input: insertAssignmentSchema.extend({
        dueDate: z.string().optional(),
        isPeerReview: z.boolean().optional(),
        reviewDeadline: z.string().optional(),
        reviewsPerStudent: z.number().optional(),
        prerequisites: z.array(z.string()).optional()
      }),
      responses: { 201: z.custom<typeof assignments.$inferSelect>() }
    },
    get: {
      method: 'GET' as const,
      path: '/api/classes/:classId/assignments/:assignmentId' as const,
      responses: { 200: z.custom<typeof assignments.$inferSelect>() }
    }
  },
  submissions: {
    list: {
      method: 'GET' as const,
      path: '/api/assignments/:assignmentId/submissions' as const,
      responses: { 200: z.array(z.any()) } // submission + student info
    },
    create: {
      method: 'POST' as const,
      path: '/api/assignments/:assignmentId/submissions' as const,
      input: insertSubmissionSchema,
      responses: { 201: z.custom<typeof submissions.$inferSelect>() }
    },
    grade: {
      method: 'PATCH' as const,
      path: '/api/submissions/:submissionId/grade' as const,
      input: z.object({ grade: z.coerce.number(), feedback: z.string().optional() }),
      responses: { 200: z.custom<typeof submissions.$inferSelect>() }
    }
  },
  attendance: {
    list: {
      method: 'GET' as const,
      path: '/api/classes/:classId/attendance' as const,
      input: z.object({ date: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof attendance.$inferSelect>()) }
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
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) }
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
