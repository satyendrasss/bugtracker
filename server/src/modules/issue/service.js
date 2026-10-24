import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/httpError.js";

const include = {
  project: { select: { id: true, name: true, key: true, color: true } },
  reporter: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true, attachments: true } }
};

async function nextKey() {
  const count = await prisma.issue.count();
  return `BUG-${String(count + 1).padStart(4, "0")}`;
}
export async function list({ search, projectId, status, priority, assigneeId, page = 1, limit = 10 }) {
  const where = { deletedAt: null };
  if (search) where.OR = [{ title: { contains: search, mode: "insensitive" } }, { key: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  const [items, total] = await Promise.all([
    prisma.issue.findMany({ where, include, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.issue.count({ where })
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
export async function get(id) {
  const issue = await prisma.issue.findFirst({
    where: { OR: [{ id }, { key: id }], deletedAt: null },
    include: { ...include, comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true, email: true } } } }, attachments: { orderBy: { createdAt: "desc" } } }
  });
  if (!issue) throw new HttpError(404, "Issue not found.");
  return issue;
}
export async function create(input, reporterId) {
  const key = await nextKey();
  return prisma.issue.create({
    data: { ...input, key, reporterId, dueDate: input.dueDate ? new Date(input.dueDate) : null },
    include
  });
}
export async function update(id, input) {
  const existing = await prisma.issue.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "Issue not found.");
  const data = { ...input };
  if ("dueDate" in data) data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  return prisma.issue.update({ where: { id }, data, include });
}
export async function remove(id) {
  const existing = await prisma.issue.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError(404, "Issue not found.");
  return prisma.issue.update({ where: { id }, data: { deletedAt: new Date() } });
}
export async function addComment(issueId, authorId, body) {
  const issue = await prisma.issue.findFirst({ where: { id: issueId, deletedAt: null } });
  if (!issue) throw new HttpError(404, "Issue not found.");
  return prisma.comment.create({ data: { issueId, authorId, body }, include: { author: { select: { id: true, name: true, email: true } } } });
}
export async function deleteComment(issueId, commentId, user) {
  const comment = await prisma.comment.findFirst({ where: { id: commentId, issueId } });
  if (!comment) throw new HttpError(404, "Comment not found.");
  if (comment.authorId !== user.id && user.role !== "ADMIN") throw new HttpError(403, "You can only delete your own comments.");
  await prisma.comment.delete({ where: { id: commentId } });
}
