import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/httpError.js";

const safeSelect = { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true };
export async function list({ search, role, status, page = 1, limit = 10 }) {
  const where = {};
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }];
  if (role) where.role = role;
  if (status) where.status = status;
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: safeSelect, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.user.count({ where })
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
export async function get(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: safeSelect });
  if (!user) throw new HttpError(404, "User not found.");
  return user;
}
export async function create(input) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({ data: { name: input.name, email: input.email.toLowerCase(), passwordHash, role: input.role, status: input.status }, select: safeSelect });
}
export async function update(id, input) {
  const data = { ...input };
  if (data.email) data.email = data.email.toLowerCase();
  if (data.password) { data.passwordHash = await bcrypt.hash(data.password, 12); delete data.password; }
  return prisma.user.update({ where: { id }, data, select: safeSelect });
}
export async function remove(id, currentUserId) {
  if (id === currentUserId) throw new HttpError(400, "You cannot disable your own account.");
  return prisma.user.update({ where: { id }, data: { status: "DISABLED" }, select: safeSelect });
}
