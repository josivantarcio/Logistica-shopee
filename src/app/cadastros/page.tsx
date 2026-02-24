"use client";

import Link from "next/link";
import { MapPin, Users, Truck, BookOpen, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const itens = [
  {
    href: "/cadastros/cidades",
    icon: MapPin,
    titulo: "Cidades",
    descricao: "Cadastrar e editar cidades da rota",
  },
  {
    href: "/cadastros/entregadores",
    icon: Users,
    titulo: "Entregadores",
    descricao: "Cadastrar e editar entregadores",
  },
  {
    href: "/cadastros/veiculos",
    icon: Truck,
    titulo: "Veículos",
    descricao: "Cadastrar e editar veículos",
  },
  {
    href: "/cadastros/modelos",
    icon: BookOpen,
    titulo: "Rotas Modelo",
    descricao: "Rotas pré-definidas para agilizar a criação",
  },
];

export default function CadastrosPage() {
  return (
    <div className="flex flex-col pb-24">
      <PageHeader titulo="Cadastros" voltar="/" />
      <div className="flex flex-col gap-3 p-4">
        {itens.map(({ href, icon: Icon, titulo, descricao }) => (
          <Link key={href} href={href}>
            <div className="bg-white rounded-2xl shadow-sm px-4 py-4 flex items-center gap-4 active:bg-gray-50">
              <div className="bg-orange-50 rounded-full p-3">
                <Icon size={22} className="text-[#ee4d2d]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{titulo}</p>
                <p className="text-xs text-gray-500">{descricao}</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
