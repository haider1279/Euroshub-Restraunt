import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

/** Duck-type check for ZodError compatible with both ESM and CJS module instances. */
function isZodError(err: unknown): err is ZodError {
  return (
    err instanceof ZodError ||
    (err != null &&
      typeof err === 'object' &&
      'issues' in err &&
      Array.isArray((err as any).issues) &&
      (err as any).constructor?.name === 'ZodError')
  );
}

export const validateBody = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      if (isZodError(err)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request payload',
            details: (err.issues ?? err.errors).map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(err);
    }
  };
};

export const validateQuery = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (err) {
      if (isZodError(err)) {
        return res.status(400).json({
          error: {
            code: 'QUERY_VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: (err.issues ?? err.errors).map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(err);
    }
  };
};
