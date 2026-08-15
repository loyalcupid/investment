import { GRADE_META, type Grade } from "@/lib/constants/copy";

export function GradeBadge({ grade, size = "md" }: { grade: Grade; size?: "sm" | "md" | "lg" }) {
  const meta = GRADE_META[grade];
  const sizeClass =
    size === "lg" ? "text-base px-3 py-1.5" : size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-white ${sizeClass}`}
      style={{ backgroundColor: meta.color }}
    >
      <span aria-hidden>{grade}</span>
      <span className="font-medium">{meta.label}</span>
    </span>
  );
}
