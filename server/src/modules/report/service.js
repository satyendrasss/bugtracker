import { prisma } from "../../config/prisma.js";

export async function summary() {
  const [issueTotal, projectTotal, userTotal, byStatus, byPriority, recentIssues] = await Promise.all([
    prisma.issue.count({ where: { deletedAt: null } }),
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.issue.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.issue.groupBy({ by: ["priority"], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.issue.findMany({ where: { deletedAt: null }, include: { project: { select: { name: true, key: true } } }, orderBy: { createdAt: "desc" }, take: 10 })
  ]);
  return {
    totals: { issues: issueTotal, projects: projectTotal, activeUsers: userTotal },
    byStatus: byStatus.map(x => ({ status: x.status, count: x._count._all })),
    byPriority: byPriority.map(x => ({ priority: x.priority, count: x._count._all })),
    recentIssues
  };
}
