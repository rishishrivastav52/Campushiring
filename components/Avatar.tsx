export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-signal/20 font-display font-semibold text-signal"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}
