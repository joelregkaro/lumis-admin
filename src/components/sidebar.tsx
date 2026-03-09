"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", icon: "📊" },
  { href: "/users", label: "Users", icon: "👥" },
  { href: "/engagement", label: "Engagement", icon: "📈" },
  { href: "/ai-quality", label: "AI Quality", icon: "🤖" },
  { href: "/growth", label: "Growth", icon: "🚀" },
  { href: "/revenue", label: "Revenue", icon: "💰" },
  { href: "/wellbeing", label: "Wellbeing", icon: "💜" },
  { href: "/events", label: "Events", icon: "🔔" },
  { href: "/feed", label: "Live Feed", icon: "⚡" },
  { href: "/prompt-lab", label: "Prompt Lab", icon: "🧪" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      <div className="p-5 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-white tracking-tight">Lumis Admin</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Internal Dashboard</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={async () => {
            await fetch("/api/auth", { method: "DELETE" });
            window.location.reload();
          }}
          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
