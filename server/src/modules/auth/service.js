import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/httpError.js";

const publicUser = ({ passwordHash, ...user }) => user;

export async function register(input) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new HttpError(409, "An account with this email already exists.");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email.toLowerCase(), passwordHash, role: "DEVELOPER" },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
  });
  return { user, accessToken: signToken(user) };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Email or password is incorrect.");
  }
  if (user.status !== "ACTIVE") throw new HttpError(403, "This account is not active.");
  return { user: publicUser(user), accessToken: signToken(user) };
}

function signToken(user) {
  return jwt.sign(
    { role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { subject: user.id, expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
}

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true, settings: true, createdAt: true }
  });
  if (!user) throw new HttpError(404, "User not found.");
  return user;
}

export async function updateProfile(userId, input) {
  const data = { ...input };
  if (data.email) {
    data.email = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) throw new HttpError(409, "That email address is already in use.");
  }
  return prisma.user.update({ where: { id: userId }, data, select: { id: true, name: true, email: true, role: true, status: true, settings: true, createdAt: true } });
}
