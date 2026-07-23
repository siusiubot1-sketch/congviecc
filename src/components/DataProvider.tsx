"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Brand, Task, Creator, AutoRule } from "@/lib/types";
import { BRAND_COLORS } from "@/lib/mock-data";

type NewBrandInput = {
  name: string;
  industry?: string;
  stage?: Brand["stage"];
  ownerId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  note?: string;
};

interface DataContextValue {
  loaded: boolean;
  brands: Brand[];
  addBrand: (input: NewBrandInput) => Brand;
  updateBrand: (id: string, patch: Partial<Brand>) => void;
  removeBrand: (id: string) => void;
  findBrand: (id?: string) => Brand | undefined;
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  creators: Creator[];
  addCreator: (creator: Creator) => void;
  updateCreator: (id: string, patch: Partial<Creator>) => void;
  removeCreator: (id: string) => void;
  findCreator: (id?: string) => Creator | undefined;
  rules: AutoRule[];
  addRule: (rule: AutoRule) => void;
  updateRule: (id: string, patch: Partial<AutoRule>) => void;
  removeRule: (id: string) => void;
  resetDemo: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export const uid = (p = "id") => `${p}_${Date.now()}_${Math.round(Math.random() * 1e4)}`;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---- Gọi API database ----
type Model = "brands" | "tasks" | "creators" | "rules";
function apiCreate(model: Model, obj: unknown) {
  fetch(`/api/db/${model}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  }).catch(() => {});
}
function apiUpdate(model: Model, id: string, obj: unknown) {
  fetch(`/api/db/${model}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  }).catch(() => {});
}
function apiDelete(model: Model, id: string) {
  fetch(`/api/db/${model}/${id}`, { method: "DELETE" }).catch(() => {});
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [rules, setRules] = useState<AutoRule[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const d = await res.json();
        setBrands(d.brands ?? []);
        setTasks(d.tasks ?? []);
        setCreators(d.creators ?? []);
        setRules(d.rules ?? []);
      }
    } catch {
      /* DB chưa sẵn sàng — hiển thị rỗng */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // ---- Nhãn hàng ----
  const addBrand = useCallback((input: NewBrandInput): Brand => {
    const brand: Brand = {
      id: uid("b"),
      name: input.name.trim(),
      industry: input.industry?.trim() || "Chưa phân loại",
      logo: initials(input.name),
      color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
      stage: input.stage ?? "lead",
      ownerId: input.ownerId ?? "u1",
      totalValue: 0,
      note: input.note?.trim() || undefined,
      contacts:
        input.contactName || input.contactEmail || input.contactPhone
          ? [{ name: input.contactName?.trim() || input.name.trim(), role: "Liên hệ", email: input.contactEmail?.trim() || undefined, phone: input.contactPhone?.trim() || undefined }]
          : [],
      attachments: [],
      bookings: [],
      timeline: [{ id: uid("t"), type: "note", content: "Tạo hồ sơ nhãn hàng", date: new Date().toISOString(), authorId: input.ownerId ?? "u1" }],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setBrands((prev) => [brand, ...prev]);
    apiCreate("brands", brand);
    return brand;
  }, []);
  const updateBrand = useCallback((id: string, patch: Partial<Brand>) => {
    setBrands((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...patch, logo: patch.name ? initials(patch.name) : b.logo } : b));
      const u = next.find((b) => b.id === id);
      if (u) apiUpdate("brands", id, u);
      return next;
    });
  }, []);
  const removeBrand = useCallback((id: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== id));
    apiDelete("brands", id);
  }, []);
  const findBrand = useCallback((id?: string) => brands.find((b) => b.id === id), [brands]);

  // ---- Công việc ----
  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [task, ...prev]);
    apiCreate("tasks", task);
  }, []);
  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
      const u = next.find((t) => t.id === id);
      if (u) apiUpdate("tasks", id, u);
      return next;
    });
  }, []);
  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    apiDelete("tasks", id);
  }, []);

  // ---- KOL ----
  const addCreator = useCallback((creator: Creator) => {
    setCreators((prev) => [creator, ...prev]);
    apiCreate("creators", creator);
  }, []);
  const updateCreator = useCallback((id: string, patch: Partial<Creator>) => {
    setCreators((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      const u = next.find((c) => c.id === id);
      if (u) apiUpdate("creators", id, u);
      return next;
    });
  }, []);
  const removeCreator = useCallback((id: string) => {
    setCreators((prev) => prev.filter((c) => c.id !== id));
    apiDelete("creators", id);
  }, []);
  const findCreator = useCallback((id?: string) => creators.find((c) => c.id === id), [creators]);

  // ---- Kịch bản ----
  const addRule = useCallback((rule: AutoRule) => {
    setRules((prev) => [...prev, rule]);
    apiCreate("rules", rule);
  }, []);
  const updateRule = useCallback((id: string, patch: Partial<AutoRule>) => {
    setRules((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      const u = next.find((r) => r.id === id);
      if (u) apiUpdate("rules", id, u);
      return next;
    });
  }, []);
  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    apiDelete("rules", id);
  }, []);

  const resetDemo = useCallback(async () => {
    await fetch("/api/db/reset", { method: "POST" }).catch(() => {});
    await reload();
  }, [reload]);

  return (
    <DataContext.Provider
      value={{
        loaded,
        brands, addBrand, updateBrand, removeBrand, findBrand,
        tasks, addTask, updateTask, removeTask,
        creators, addCreator, updateCreator, removeCreator, findCreator,
        rules, addRule, updateRule, removeRule,
        resetDemo,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData phải dùng bên trong <DataProvider>");
  return ctx;
}
