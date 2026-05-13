export const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  file: null,
  ...overrides,
});

export const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};
