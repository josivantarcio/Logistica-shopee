"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Settings, Clock, Wrench } from "lucide-react";

const tabs = [
  { href: "/", label: "Início", icon: Home },
  { href: "/rota/nova", label: "Rota", icon: Plus },
  { href: "/historico", label: "Histórico", icon: Clock },
  { href: "/manutencao", label: "Frota", icon: Wrench },
  { href: "/cadastros", label: "Cadastros", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const ativo =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                ativo
                  ? "text-[#ee4d2d]"
                  : "text-gray-500"
              }`}
            >
              <Icon size={20} strokeWidth={ativo ? 2.5 : 1.8} />
              <span className={`text-[10px] ${ativo ? "font-semibold" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
