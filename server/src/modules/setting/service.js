import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/httpError.js";

export async function get(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { settings: true } });
  if (!user) throw new HttpError(404, "User not found.");
  return user.settings ?? {};
}
export async function update(userId, patch) {
  const current = await get(userId);
  const settings = { ...current, ...patch };
  const user = await prisma.user.update({ where: { id: userId }, data: { settings }, select: { settings: true } });
  return user.settings;
}
