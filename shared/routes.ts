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
      input: insertPostSchema,
      responses: { 201: z.custom<typeof posts.$inferSelect>() }
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
  assignments: {
    list: {
      method: 'GET' as const,
      path: '/api/classes/:classId/assignments' as const,
      responses: { 200: z.array(z.custom<typeof assignments.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes/:classId/assignments' as const,
      input: insertAssignmentSchema.extend({ dueDate: z.string().optional() }),
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
