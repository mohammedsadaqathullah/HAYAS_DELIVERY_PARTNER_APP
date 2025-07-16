import CryptoJS from 'crypto-js'
import { validationKey } from './validationLey';
 

const secretKey = validationKey

// Encrypt any JavaScript object or string
function encryptData(data : string | object) {
  const stringified = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringified, secretKey).toString();
}

// Decrypt string and return JSON if possible
function decryptData(encrypted : string | object) {
  const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);

  try {
    return JSON.parse(decrypted); // Try to parse JSON
  } catch {
    return decrypted; // Return as plain string if not JSON
  }
}

export { encryptData, decryptData };