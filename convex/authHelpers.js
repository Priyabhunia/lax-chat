import * as bcrypt from "bcryptjs";

// Hash a password
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Compare a password with a hash
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
} 