import { customAlphabet } from 'nanoid';

export function genID() {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12)
  return nanoid()
}
