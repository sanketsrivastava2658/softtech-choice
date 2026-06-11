import { ThemeToggle } from "@/components/ui/ThemeToggle";

/** Global top bar: brand lockup + theme toggle. Sticky across the app. */
export function Topbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-7">
        <div className="flex items-center gap-[10px] font-display text-[16px] font-extrabold tracking-[-0.02em]">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-chip bg-amber font-mono text-[13px] font-semibold text-amber-ink">
            ◆
          </span>
          Northbeam
          <span className="font-mono text-[11px] font-normal tracking-normal text-faint">
            / outbound terminal
          </span>
        </div>
        <div className="flex-1" />
        <ThemeToggle />
      </div>
    </header>
  );
}
