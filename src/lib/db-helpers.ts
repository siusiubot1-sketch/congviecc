import { prisma } from "./prisma";
import {
  seedBrands,
  seedTasks,
  seedCreators,
  seedAutoRules,
} from "./mock-data";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Map tên collection (dùng ở URL) → delegate Prisma tương ứng
export function delegateFor(model: string): any | null {
  switch (model) {
    case "brands":
      return prisma.brand;
    case "tasks":
      return prisma.task;
    case "creators":
      return prisma.creator;
    case "rules":
      return prisma.rule;
    default:
      return null;
  }
}

// Nạp dữ liệu mẫu vào DB lần đầu (nếu chưa seed)
export async function ensureSeeded() {
  const meta = await prisma.meta.findUnique({ where: { key: "seeded" } });
  if (meta) return;
  await prisma.$transaction([
    ...seedBrands.map((b) => prisma.brand.create({ data: { id: b.id, data: b as any } })),
    ...seedTasks.map((t) => prisma.task.create({ data: { id: t.id, data: t as any } })),
    ...seedCreators.map((c) => prisma.creator.create({ data: { id: c.id, data: c as any } })),
    ...seedAutoRules.map((r) => prisma.rule.create({ data: { id: r.id, data: r as any } })),
    prisma.meta.create({ data: { key: "seeded", value: "1" } }),
  ]);
}

// Xóa sạch & nạp lại dữ liệu mẫu
export async function resetDemo() {
  await prisma.$transaction([
    prisma.brand.deleteMany(),
    prisma.task.deleteMany(),
    prisma.creator.deleteMany(),
    prisma.rule.deleteMany(),
    prisma.meta.deleteMany(),
  ]);
  await ensureSeeded();
}

// Lấy toàn bộ dữ liệu (mảng object đúng shape frontend)
export async function loadAll() {
  await ensureSeeded();
  const [brands, tasks, creators, rules] = await Promise.all([
    prisma.brand.findMany(),
    prisma.task.findMany(),
    prisma.creator.findMany(),
    prisma.rule.findMany(),
  ]);
  return {
    brands: brands.map((r) => r.data),
    tasks: tasks.map((r) => r.data),
    creators: creators.map((r) => r.data),
    rules: rules.map((r) => r.data),
  };
}
