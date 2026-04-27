import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const getSecret = () => process.env.JWT_SECRET || 'your_fallback_secret';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(password, hashed);
};

export const generateToken = (userId: string, role: string, ngoId?: string): string => {
  return jwt.sign({ id: userId, role, ngoId }, getSecret(), {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, getSecret());
  } catch (error) {
    return null;
  }
};
