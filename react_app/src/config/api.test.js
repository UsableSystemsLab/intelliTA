import { API_BASE, LLM_BASE, getAuthHeaders } from './api';

describe('config/api', () => {
  test('API_BASE has a default value', () => {
    expect(typeof API_BASE).toBe('string');
    expect(API_BASE.length).toBeGreaterThan(0);
  });

  test('LLM_BASE has a default value', () => {
    expect(typeof LLM_BASE).toBe('string');
    expect(LLM_BASE.length).toBeGreaterThan(0);
  });

  test('getAuthHeaders returns a Bearer header with the user token', async () => {
    const user = { getIdToken: jest.fn(() => Promise.resolve('tkn-123')) };
    const headers = await getAuthHeaders(user);
    expect(user.getIdToken).toHaveBeenCalled();
    expect(headers).toEqual({ Authorization: 'Bearer tkn-123' });
  });

  test('getAuthHeaders awaits token resolution', async () => {
    const user = {
      getIdToken: () => new Promise((res) => setTimeout(() => res('late'), 5)),
    };
    const headers = await getAuthHeaders(user);
    expect(headers.Authorization).toBe('Bearer late');
  });

  test('getAuthHeaders propagates token errors', async () => {
    const user = { getIdToken: jest.fn(() => Promise.reject(new Error('nope'))) };
    await expect(getAuthHeaders(user)).rejects.toThrow('nope');
  });
});
