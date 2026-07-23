"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { currentUser } from "@/lib/mock-data";
import { IconSparkle, IconMail, IconRobot } from "@/components/icons";

export default function LoginPage() {
  const { user, loaded, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Đã đăng nhập → về trang chủ
  useEffect(() => {
    if (loaded && user) router.replace("/");
  }, [loaded, user, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = login(email, password);
    if (res.ok) router.replace("/");
    else setError(res.error ?? "Đăng nhập thất bại.");
  }

  return (
    <div className="flex min-h-dvh bg-[var(--background)]">
      {/* Panel thương hiệu (ẩn trên mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <IconSparkle className="size-6" />
          </span>
          <div>
            <div className="text-lg font-bold">KOL Hub</div>
            <div className="text-xs text-white/70">Quản lý KOL/KOC</div>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            Quản lý công việc, khách hàng & tin nhắn — tất cả trong một màn hình.
          </h1>
          <div className="mt-8 space-y-4">
            {[
              { icon: IconMail, text: "Hộp thư hợp nhất Zalo, Gmail — trả lời ngay trong app" },
              { icon: IconRobot, text: "Tự động trả lời theo kịch bản AI" },
              { icon: IconSparkle, text: "CRM, công việc, KOL & báo cáo tập trung" },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm text-white/90">{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-white/50">© 2026 KOL Hub. Bản demo.</div>
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 size-56 rounded-full bg-fuchsia-300/20 blur-2xl" />
      </div>

      {/* Form đăng nhập */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
              <IconSparkle className="size-6" />
            </span>
            <div className="text-lg font-bold text-zinc-900">KOL Hub</div>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900">Đăng nhập</h2>
          <p className="mt-1 text-sm text-zinc-500">Chào mừng trở lại 👋 Đăng nhập để tiếp tục.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="ban@kolhub.vn"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-500">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 pr-16 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-violet-600 hover:text-violet-700"
                >
                  {showPass ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">✕ {error}</div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              Đăng nhập
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
