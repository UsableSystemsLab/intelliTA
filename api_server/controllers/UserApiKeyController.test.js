jest.mock('../models/index.js', () => ({
  __esModule: true,
  User: { findOne: jest.fn() },
  UserApiKey: {
    findOrCreate: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock('../utils/encryption.js', () => ({
  __esModule: true,
  encryptApiKey: jest.fn(),
  decryptApiKey: jest.fn(),
}));

import { User, UserApiKey } from '../models/index.js';
import { encryptApiKey, decryptApiKey } from '../utils/encryption.js';
import UserApiKeyController from '../controllers/UserApiKeyController.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('UserApiKeyController.saveOrUpdate', () => {
  test('returns 400 when required fields are missing', async () => {
    const req = { params: { firebaseUid: 'fb1' }, body: { base_url: 'https://api.openai.com' } };
    const res = makeRes();
    await UserApiKeyController.saveOrUpdate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('required') })
    );
  });

  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = {
      params: { firebaseUid: 'fb_unknown' },
      body: { base_url: 'https://api.openai.com', api_key: 'sk-abc', model_name: 'gpt-4' },
    };
    const res = makeRes();
    await UserApiKeyController.saveOrUpdate(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('creates a new entry and returns 200 with masked key', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    encryptApiKey.mockResolvedValueOnce('encrypted-key');
    const entry = {
      id: 10, base_url: 'https://api.openai.com', model_name: 'gpt-4', label: 'OpenAI',
      update: jest.fn(),
    };
    UserApiKey.findOrCreate.mockResolvedValueOnce([entry, true]);
    const req = {
      params: { firebaseUid: 'fb1' },
      body: { base_url: 'https://api.openai.com', api_key: 'sk-abcdefghijklmnop', model_name: 'gpt-4' },
    };
    const res = makeRes();
    await UserApiKeyController.saveOrUpdate(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.api_key_masked).toMatch(/^sk-a••••••••mnop$/);
    expect(body).not.toHaveProperty('api_key');
  });

  test('updates existing entry and returns 200', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    encryptApiKey.mockResolvedValueOnce('new-encrypted');
    const entry = {
      id: 10, base_url: 'https://api.openai.com', model_name: 'gpt-4o', label: 'OpenAI',
      update: jest.fn().mockResolvedValueOnce(undefined),
    };
    UserApiKey.findOrCreate.mockResolvedValueOnce([entry, false]);
    const req = {
      params: { firebaseUid: 'fb1' },
      body: { base_url: 'https://api.openai.com', api_key: 'sk-newkey12345678', model_name: 'gpt-4o' },
    };
    const res = makeRes();
    await UserApiKeyController.saveOrUpdate(req, res);
    expect(entry.update).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test.each([
    ['OpenAI', 'https://api.openai.com/v1', 'OpenAI'],
    ['Groq', 'https://api.groq.com/v1', 'Groq'],
    ['Anthropic', 'https://api.anthropic.com/v1', 'Anthropic'],
    ['Together AI', 'https://api.together.xyz/v1', 'Together AI'],
    ['DeepSeek', 'https://api.deepseek.com/v1', 'DeepSeek'],
  ])('generates label "%s" for base URL %s', async (label, baseUrl) => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    encryptApiKey.mockResolvedValueOnce('enc');
    const entry = { id: 1, base_url: baseUrl, model_name: 'model', label, update: jest.fn() };
    UserApiKey.findOrCreate.mockResolvedValueOnce([entry, true]);
    const req = {
      params: { firebaseUid: 'fb1' },
      body: { base_url: baseUrl, api_key: 'key12345678', model_name: 'model' },
    };
    const res = makeRes();
    await UserApiKeyController.saveOrUpdate(req, res);
    expect(res.json.mock.calls[0][0].label).toBe(label);
  });
});

describe('UserApiKeyController.getByFirebaseUid', () => {
  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { firebaseUid: 'fb_unknown' } };
    const res = makeRes();
    await UserApiKeyController.getByFirebaseUid(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with masked API keys', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    UserApiKey.findAll.mockResolvedValueOnce([
      { id: 10, base_url: 'https://api.openai.com', model_name: 'gpt-4', label: 'OpenAI', api_key: 'enc1' },
    ]);
    decryptApiKey.mockResolvedValueOnce('sk-abcdefghijklmnop');
    const req = { params: { firebaseUid: 'fb1' } };
    const res = makeRes();
    await UserApiKeyController.getByFirebaseUid(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const keys = res.json.mock.calls[0][0];
    expect(keys).toHaveLength(1);
    expect(keys[0]).not.toHaveProperty('api_key');
    expect(keys[0].api_key_masked).toMatch(/^sk-a••••••••mnop$/);
  });
});

describe('UserApiKeyController.deleteKey', () => {
  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { firebaseUid: 'fb_unknown', id: '10' } };
    const res = makeRes();
    await UserApiKeyController.deleteKey(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 204 when key is deleted', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    UserApiKey.destroy.mockResolvedValueOnce(1);
    const req = { params: { firebaseUid: 'fb1', id: '10' } };
    const res = makeRes();
    await UserApiKeyController.deleteKey(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('returns 404 when key is not found', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    UserApiKey.destroy.mockResolvedValueOnce(0);
    const req = { params: { firebaseUid: 'fb1', id: '99' } };
    const res = makeRes();
    await UserApiKeyController.deleteKey(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'API key not found' });
  });
});

describe('UserApiKeyController.getRawKey', () => {
  test('returns 404 when user is not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { params: { firebaseUid: 'fb_unknown', id: '10' } };
    const res = makeRes();
    await UserApiKeyController.getRawKey(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 404 when key entry is not found', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    UserApiKey.findOne.mockResolvedValueOnce(null);
    const req = { params: { firebaseUid: 'fb1', id: '99' } };
    const res = makeRes();
    await UserApiKeyController.getRawKey(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'API key not found' });
  });

  test('returns 200 with decrypted key', async () => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    UserApiKey.findOne.mockResolvedValueOnce({
      api_key: 'enc', base_url: 'https://api.openai.com', model_name: 'gpt-4',
    });
    decryptApiKey.mockResolvedValueOnce('sk-real-key');
    const req = { params: { firebaseUid: 'fb1', id: '10' } };
    const res = makeRes();
    await UserApiKeyController.getRawKey(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      api_key: 'sk-real-key',
      base_url: 'https://api.openai.com',
      model_name: 'gpt-4',
    });
  });
});

describe('maskKey helper (via saveOrUpdate)', () => {
  const runSaveOrUpdate = async (apiKey) => {
    User.findOne.mockResolvedValueOnce({ id: 1 });
    encryptApiKey.mockResolvedValueOnce('enc');
    const entry = {
      id: 1, base_url: 'https://api.openai.com', model_name: 'gpt-4', label: 'OpenAI',
      update: jest.fn(),
    };
    UserApiKey.findOrCreate.mockResolvedValueOnce([entry, true]);
    const req = {
      params: { firebaseUid: 'fb1' },
      body: { base_url: 'https://api.openai.com', api_key: apiKey, model_name: 'gpt-4' },
    };
    const res = makeRes();
    await UserApiKeyController.saveOrUpdate(req, res);
    return res.json.mock.calls[0][0].api_key_masked;
  };

  test('returns placeholder for keys shorter than 8 characters', async () => {
    const masked = await runSaveOrUpdate('short');
    expect(masked).toBe('••••••••');
  });

  test('shows first 4 and last 4 characters of a normal key', async () => {
    const masked = await runSaveOrUpdate('sk-abcdefghijklmnop');
    expect(masked).toBe('sk-a••••••••mnop');
  });
});
