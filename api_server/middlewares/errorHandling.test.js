jest.mock('@sentry/node', () => ({
  __esModule: true,
  captureException: jest.fn(),
}));

jest.mock('../configs/logger.js', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

import * as Sentry from '@sentry/node';
import logger from '../configs/logger.js';
import errorHandling from '../middlewares/errorHandling.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandling middleware', () => {
  test('responds with 500 Internal Server Error', () => {
    const err = new Error('Something went wrong');
    errorHandling(err, {}, makeRes(), jest.fn());
    const res = makeRes();
    errorHandling(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('captures the exception with Sentry', () => {
    const err = new Error('db timeout');
    errorHandling(err, {}, makeRes(), jest.fn());
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  test('logs the error message and stack via Winston', () => {
    const err = new Error('log me');
    errorHandling(err, {}, makeRes(), jest.fn());
    expect(logger.error).toHaveBeenCalledWith(err.message, { metadata: err.stack });
  });
});
