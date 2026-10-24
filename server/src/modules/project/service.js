import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/httpError.js";

const include = { lead: { select: { id: true, name: true, email: true } }, _count: { select: { issues: true } } };
export async function list({ search, status, page = 1, limit = 10 }) {
  const where = { deletedAt: null };
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { key: { contains: search, mode: "insensitive" } }];
  if (status) where.status = status;
  const [items, total] = await Promise.all([
    prisma.project.findMany({ where, include, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.project.count({ where })
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
export async function get(id) {
  const item = await prisma.project.findFirst({ where: { id, deletedAt: null }, include: { ...include, issues: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 20 } } });
  if (!item) throw new HttpError(404, "Project not found.");
  return item;
}
export async function create(input) {
  return prisma.project.create({ data: { ...input, dueDate: input.dueDate ? new Date(input.dueDate) : null }, include });
}
export async function update(id, input) {
  const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "Project not found.");
  const data = { ...input };
  if ("dueDate" in data) data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  return prisma.project.update({ where: { id }, data, include });
}
export async function remove(id) {
  const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "Project not found.");
  return prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
}
