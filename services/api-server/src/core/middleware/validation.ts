import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Create a middleware that validates request body against a Zod schema.
 */
export function validateBody(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
            }
            next(err);
        }
    };
}

/**
 * Create a middleware that validates query params against a Zod schema.
 */
export function validateQuery(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.query = schema.parse(req.query) as any;
            next();
        } catch (err) {
            if (err instanceof z.ZodError) {
                return res
                    .status(400)
                    .json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
            }
            next(err);
        }
    };
}
