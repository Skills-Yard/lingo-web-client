export type NameValueRow = { name: string; value: string; /** `on` picks the value out in green, `off` in grey. */ tone?: "on" | "off" };

/** Names with their values, one to a line, on a soft card: `Is_present  True`. */
export function NameValueCard({ rows, className = "" }: { rows: readonly NameValueRow[]; className?: string }) {
  return (
    <div className={`flex w-[330px] flex-col gap-0.5 rounded-[8px] border-4 border-white bg-[#F6F4FE] px-3 py-2 shadow-[1px_1px_6px_1px_rgba(0,0,0,0.15)] dark:border-transparent dark:bg-[#0F1F26] ${className}`}>
      {rows.map(({ name, value, tone }) => (
        <div key={name} className="flex justify-between text-[13px] leading-5 font-semibold text-[#444444] dark:text-white">
          <span className="font-mono">{name}</span>
          <span className={tone === "on" ? "text-[#01A17F]" : tone === "off" ? "text-[#8A94A0]" : undefined}>{value}</span>
        </div>
      ))}
    </div>
  );
}
