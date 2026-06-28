import { NavLink } from "react-router-dom";
import {
  BulbIcon,
  ChartIcon,
  HomeIcon,
  ListIcon,
  PlusIcon,
  SettingsIcon,
} from "@/components/ui/Icons";
import { useAddTransaction } from "@/context/AddTransactionContext";

const items = [
  { to: "/", label: "Home", Icon: HomeIcon, end: true },
  { to: "/spending", label: "Spending", Icon: ChartIcon },
  { to: "/transactions", label: "Activity", Icon: ListIcon },
  { to: "/insights", label: "Insights", Icon: BulbIcon },
  { to: "/settings", label: "Settings", Icon: SettingsIcon },
];

export function BottomNav() {
  const { openAdd } = useAddTransaction();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-2">
        {items.slice(0, 2).map(({ to, label, Icon, end }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} end={end} />
        ))}

        {/* Center add button */}
        <button
          onClick={() => openAdd()}
          className="relative -mt-5 flex h-14 w-14 flex-none items-center justify-center rounded-full bg-blue-600 text-white shadow-lift transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          aria-label="Add a transaction"
        >
          <PlusIcon width={26} height={26} />
        </button>

        {items.slice(2).map(({ to, label, Icon, end }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} end={end} />
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

function NavItem({
  to,
  label,
  Icon,
  end,
}: {
  to: string;
  label: string;
  Icon: typeof HomeIcon;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
          isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
        }`
      }
    >
      <Icon width={22} height={22} />
      <span>{label}</span>
    </NavLink>
  );
}
