"use client";

interface CategoryBarProps {
  tabs: readonly string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export function CategoryBar({ tabs, activeTab, onSelectTab }: CategoryBarProps) {
  return (
    <div className="relative z-40 border-b border-[#F1F2F4] dark:border-slate-800/80 px-3 sm:px-5 pt-1">
      <div className="scrollbar-none flex items-end gap-1.5 sm:gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={`relative shrink-0 transition-all ${isActive
                ? "-mb-px z-10 rounded-t-[10px] rounded-b-none bg-[linear-gradient(180deg,#EFEDFF_0%,#F8F7FF_45%,#FFFFFF_85%)] px-4 sm:px-5 py-2.5 font-bold text-[#1E293B] shadow-[0_-3px_14px_rgba(147,130,250,0.15)] dark:bg-[linear-gradient(180deg,#2D2654_0%,#1E293B_100%)] dark:text-white dark:shadow-[0_-3px_14px_rgba(0,0,0,0.4)]"
                : "px-2.5 sm:px-3 rounded-t-[10px] py-2.5 font-semibold text-[#B3B8C0] hover:text-[#64748B] dark:text-slate-400 dark:hover:text-slate-200"
                }`}
            >
              <span className="text-[14px] sm:text-[15px] whitespace-nowrap leading-none block">
                {tab}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
