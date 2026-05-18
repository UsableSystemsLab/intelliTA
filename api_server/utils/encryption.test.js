jest.mock('../configs/postgresDB.js', () => ({
  __esModule: true,
  sequelize: {
    query: jest.fn(),
    QueryTypes: { SELECT: 'SELECT' },
  },
}));

const loadEncryption = (key) => {
  let encryption;
  let sequelize;
  jest.isolateModules(() => {
    if (key === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = key;
    sequelize = require('../configs/postgresDB.js').sequelize;
    encryption = require('../utils/encryption.js');
  });
  return { encryption, sequelize };
};

describe('encryption utils', () => {
  const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
  });

  test('encryptApiKey returns base64 encrypted text from sequelize', async () => {
    const { encryption, sequelize } = loadEncryption('test-secret');
    sequelize.query.mockResolvedValueOnce([{ encrypted: 'ENC_BASE64' }]);
    const result = await encryption.encryptApiKey('sk-plain');
    expect(result).toBe('ENC_BASE64');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('pgp_sym_encrypt'),
      expect.objectContaining({
        bind: ['sk-plain', 'test-secret'],
        type: 'SELECT',
      })
    );
  });

  test('decryptApiKey returns plaintext from sequelize', async () => {
    const { encryption, sequelize } = loadEncryption('test-secret');
    sequelize.query.mockResolvedValueOnce([{ decrypted: 'sk-plain' }]);
    const result = await encryption.decryptApiKey('ENC_BASE64');
    expect(result).toBe('sk-plain');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('pgp_sym_decrypt'),
      expect.objectContaining({
        bind: ['ENC_BASE64', 'test-secret'],
        type: 'SELECT',
      })
    );
  });

  test('encryptApiKey throws when ENCRYPTION_KEY is missing', async () => {
    const { encryption } = loadEncryption(undefined);
    await expect(encryption.encryptApiKey('x')).rejects.toThrow(
      'ENCRYPTION_KEY environment variable is not set'
    );
  });

  test('decryptApiKey throws when ENCRYPTION_KEY is missing', async () => {
    const { encryption } = loadEncryption(undefined);
    await expect(encryption.decryptApiKey('x')).rejects.toThrow(
      'ENCRYPTION_KEY environment variable is not set'
    );
  });
});
