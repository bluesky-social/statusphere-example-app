import type { ErrorRequestHandler, RequestHandler } from 'express'

const unexpectedRequest: RequestHandler = (_req, res) => {
  res.sendStatus(404)
}

const addErrorToRequestLog: ErrorRequestHandler = (err, _req, res, next) => {
  res.locals.err = err
  next(err)
}

export default () => [unexpectedRequest, addErrorToRequestLog]
