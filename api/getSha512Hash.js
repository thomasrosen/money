// Import the crypto module
import { createHash } from 'crypto';

// Function to get SHA-512 hash of a string
export function getSha512Hash(text) {
  return createHash('sha512').update(text, 'utf-8').digest('hex');
}

// // Example usage
// const text = 'Hello, World!';
// const hash = getSha512Hash(text);
