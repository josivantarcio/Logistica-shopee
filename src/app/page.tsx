"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  rotaEmAndamento,
  listarRotas,
  dataHojeISO,
  Rota,
} from "@/lib/db";

export default function Dashboard() {
  const [rotaAtiva, setRotaAtiva] = useState<Rota | null>(null);
  const [rotasHoje, setRotasHoje] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [ativa, todas] = await Promise.all([
          rotaEmAndamento(),
          listarRotas(),
        ]);
        setRotaAtiva(ativa ?? null);
        setRotasHoje(todas.filter((r) => r.data === dataHojeISO()));
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const totalVolumesHoje = rotasHoje.reduce(
    (s, r) => s + r.itens.reduce((ss, i) => ss + i.volumesSaida, 0),
    0
  );
  const totalDevolucoes = rotasHoje.reduce(
    (s, r) =>
      s + r.itens.reduce((ss, i) => ss + (i.volumesDevolvidos ?? 0), 0),
    0
  );
  const cidadesConcluidas = rotasHoje.reduce(
    (s, r) => s + r.itens.filter((i) => i.concluido).length,
    0
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="bg-[#ee4d2d] text-white px-4 pt-10 pb-6">
        <p className="text-sm text-white/80">Bem-vindo ao</p>
        <h1 className="text-2xl font-bold">Logística Shopee</h1>
        <p className="text-sm text-white/70 mt-1">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* Rota ativa */}
        {loading ? (
          <div className="bg-white rounded-2xl p-4 animate-pulse h-24" />
        ) : rotaAtiva ? (
          <Link href={`/rota/${rotaAtiva.id}`}>
            <div className="bg-[#ee4d2d]/10 border border-[#ee4d2d]/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="bg-[#ee4d2d] text-white rounded-full p-2">
                <Truck size={22} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#ee4d2d]">Rota em andamento</p>
                <p className="text-sm text-gray-600">
                  {rotaAtiva.veiculoPlaca} · saiu às {rotaAtiva.horaSaida}
                </p>
                <p className="text-xs text-gray-500">
                  {rotaAtiva.itens.filter((i) => i.concluido).length}/
                  {rotaAtiva.itens.length} cidades concluídas
                </p>
              </div>
              <ArrowRight size={20} className="text-[#ee4d2d]" />
            </div>
          </Link>
        ) : (
          <Link href="/rota/nova">
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50">
              <div className="bg-gray-100 rounded-full p-2">
                <Plus size={22} className="text-gray-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Iniciar nova rota</p>
                <p className="text-sm text-gray-500">Nenhuma rota em andamento</p>
              </div>
            </div>
          </Link>
        )}

        {/* Cards resumo do dia */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="flex justify-center mb-1">
              <Package size={20} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalVolumesHoje}</p>
            <p className="text-xs text-gray-500">Volumes</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="flex justify-center mb-1">
              <CheckCircle2 size={20} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{cidadesConcluidas}</p>
            <p className="text-xs text-gray-500">Cidades OK</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="flex justify-center mb-1">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalDevolucoes}</p>
            <p className="text-xs text-gray-500">Devoluções</p>
          </div>
        </div>

        {/* Atalhos */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Acesso rápido
          </p>
          {[
            { href: "/cadastros/cidades", label: "Gerenciar Cidades" },
            { href: "/cadastros/entregadores", label: "Gerenciar Entregadores" },
            { href: "/cadastros/veiculos", label: "Gerenciar Veículos" },
            { href: "/historico", label: "Histórico de Rotas" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between px-4 py-3 border-t border-gray-100 active:bg-gray-50"
            >
              <span className="text-sm text-gray-700">{label}</span>
              <ArrowRight size={16} className="text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
