"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { Avatar } from "./ui";
import {
  IconDashboard,
  IconTasks,
  IconCalendar,
  IconUsers,
  IconInbox,
  IconRobot,
  IconChart,
  IconStar,
  IconLink,
  IconBell,
  IconSearch,
  IconMenu,
  IconClose,
  IconSettings,
  IconLogout,
  IconSparkle,
} from "./icons";

const NAV = [
  { href: "/", label: "Tổng quan", icon: IconDashboard },
  { href: "/kol", label: "KOL của tôi", icon: IconStar },
  { href: "/cong-viec", label: "Công việc", icon: IconTasks },
  { href: "/lich", label: "Lịch", icon: IconCalendar },
  { href: "/khach-hang", label: "Khách hàng & Nhãn hàng", icon: IconUsers },
  { href: "/hop-thu", label: "Hộp thư hợp nhất", icon: IconInbox, badge: 3 },
  { href: "/kich-ban", label: "Kịch bản auto-reply", icon: IconRobot },
  { href: "/bao-cao", label: "Báo cáo", icon: IconChart },
  { href: "/ket-noi", label: "Kết nối kênh", icon: IconLink },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            )}
          >
            <Icon className={cn("size-5 shrink-0", active ? "text-white" : "text-zinc-400 group-hover:text-zinc-600")} />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  active ? "bg-white/25 text-white" : "bg-rose-500 text-white"
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
        <IconSparkle className="size-5" />
      </span>
      <div className="leading-tight">
        <div className="text-[15px] font-bold text-zinc-900">KOL Hub</div>
        <div className="text-[11px] text-zinc-400">Quản lý KOL/KOC</div>
      </div>
    </div>
  );
}

function UserCard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;
  return (
    <div className="border-t border-zinc-100 p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-100">
        <Avatar label={user.avatar} color={user.color} size={38} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold text-zinc-900">{user.name}</div>
          <div className="truncate text-xs text-zinc-400">
            {user.role === "admin" ? "Quản trị viên" : "Nhân viên"}
          </div>
        </div>
        <button
          onClick={() => { logout(); router.push("/login"); }}
          className="text-zinc-400 hover:text-rose-600"
          title="Đăng xuất"
        >
          <IconLogout className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, loaded } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  // Chưa đăng nhập → chuyển về trang login
  useEffect(() => {
    if (loaded && !user && !isLoginPage) router.replace("/login");
  }, [loaded, user, isLoginPage, router]);

  // Trang login: hiển thị toàn màn hình, không có sidebar/topbar
  if (isLoginPage) return <>{children}</>;

  // Đang tải trạng thái đăng nhập, hoặc chưa đăng nhập (chờ chuyển hướng)
  if (!loaded || !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--background)]">
        <div className="size-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <Brand />
        <NavLinks />
        <UserCard />
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <IconClose className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <UserCard />
          </aside>
        </div>
      )}

      {/* Nội dung chính */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur lg:px-6">
          <button
            onClick={() => setOpen(true)}
            className="text-zinc-500 hover:text-zinc-900 lg:hidden"
          >
            <IconMenu className="size-6" />
          </button>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400" />
            <input
              placeholder="Tìm khách hàng, công việc, tin nhắn..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-3 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button className="relative rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
              <IconBell className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <button className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
              <IconSettings className="size-5" />
            </button>
            <div className="ml-1 lg:hidden">
              <Avatar label={user.avatar} color={user.color} size={34} />
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
