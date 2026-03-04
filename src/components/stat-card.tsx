interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  color?: "default" | "green" | "red" | "purple" | "amber";
}

const COLORS = {
  default: "bg-zinc-900 border-zinc-800",
  green: "bg-emerald-950/40 border-emerald-800/40",
  red: "bg-red-950/40 border-red-800/40",
  purple: "bg-violet-950/40 border-violet-800/40",
  amber: "bg-amber-950/40 border-amber-800/40",
};

const VALUE_COLORS = {
  default: "text-white",
  green: "text-emerald-400",
  red: "text-red-400",
  purple: "text-violet-400",
  amber: "text-amber-400",
};

export default function StatCard({ title, value, subtitle, color = "default" }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${COLORS[color]}`}>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${VALUE_COLORS[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}
