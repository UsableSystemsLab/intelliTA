import { sequelize } from "../configs/postgresDB.js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Encrypts a string using pgcrypto's pgp_sym_encrypt function.
 * @param {string} plainText - The text to encrypt
 * @returns {Promise<string>} - The encrypted text (base64 encoded)
 */
export async function encryptApiKey(plainText) {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  const [result] = await sequelize.query(
    `SELECT encode(pgp_sym_encrypt($1, $2), 'base64') as encrypted`,
    {
      bind: [plainText, ENCRYPTION_KEY],
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return result.encrypted;
}

/**
 * Decrypts a string using pgcrypto's pgp_sym_decrypt function.
 * @param {string} encryptedText - The encrypted text (base64 encoded)
 * @returns {Promise<string>} - The decrypted text
 */
export async function decryptApiKey(encryptedText) {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  const [result] = await sequelize.query(
    `SELECT pgp_sym_decrypt(decode($1, 'base64'), $2) as decrypted`,
    {
      bind: [encryptedText, ENCRYPTION_KEY],
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return result.decrypted;
}
