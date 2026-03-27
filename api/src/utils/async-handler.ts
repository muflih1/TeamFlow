import {NextFunction, Request, RequestHandler, Response} from 'express';

export function asyncHandler<T>(
  asyncFn: (req: Request, res: Response, next: NextFunction) => Promise<T>,
): RequestHandler {
  return function handler(req, res, next) {
    Promise.resolve(asyncFn(req, res, next)).then(null, next);
  };
}
