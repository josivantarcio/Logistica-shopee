"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Settings, Clock } from "lucide-react";

const tabs = [
  { href: "/", label: "Início", icon: Home },
  { href: "/rota/nova", label: "Nova Rota", icon: Plus },
  { href: "/historico", label: "Histórico", icon: Clock },
  { href: "/cadastros/cidades", label: "Cadastros", icon: Settings },
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
              className={`flex-1 flex flex-col items-center py-2 gap-1 text-xs transition-colors ${
                ativo
                  ? "text-[#ee4d2d]"
                  : "text-gray-500"
              }`}
            >
              <Icon size={22} strokeWidth={ativo ? 2.5 : 1.8} />
              <span className={ativo ? "font-semibold" : ""}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
