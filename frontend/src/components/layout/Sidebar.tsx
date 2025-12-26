import { NavLink } from "react-router-dom";
import { LayoutDashboard, Globe2, Package, Flag, Settings, Map, Share2 } from "lucide-react";

const navItems = [
  { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/" },
  { name: "Countries", icon: <Flag size={18} />, path: "/countries" },
  { name: "Commodities", icon: <Package size={18} />, path: "/commodities" },
  { name: "Geopolitics", icon: <Globe2 size={18} />, path: "/geopolitics" },
  { name: "Atlas", icon: <Share2 size={18} />, path: "/atlas" },
  { name: "Simulation", icon: <Map size={18} />, path: "/simulation" },
];

export default function Sidebar() {
  return (
    <div className="glass-panel hidden h-full w-64 shrink-0 flex-col rounded-3xl border border-white/10 p-5 shadow-[0_35px_120px_rgba(2,8,30,0.55)] lg:flex">
      <div className="mb-8 flex items-center gap-2 text-2xl font-semibold tracking-wide text-sky-200">
        <span className="text-3xl">◆</span>
        <span>SupplySim</span>
      </div>

      <nav className="flex flex-col gap-2 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2 font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white/15 text-sky-50 shadow-inner shadow-slate-900/40"
                  : "text-slate-200/80 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <span className="text-slate-200/70">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
