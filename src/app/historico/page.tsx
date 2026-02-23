"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Truck, Package, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { listarRotas, Rota, formatarData } from "@/lib/db";

export default function HistoricoPage() {
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarRotas().then((r) => {
      setRotas(r);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col">
        <PageHeader titulo="Histórico" voltar="/" />
        <div className="p-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader titulo="Histórico" voltar="/" />

      <div className="flex flex-col gap-3 p-4">
        {rotas.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Clock size={44} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma rota registrada</p>
            <p className="text-sm">Inicie sua primeira rota pelo menu</p>
          </div>
        )}

        {rotas.map((rota) => {
          const totalVolumes = rota.itens.reduce((s, i) => s + i.volumesSaida, 0);
          const totalEntregues = rota.itens.reduce(
            (s, i) => s + (i.volumesEntregues ?? (i.concluido ? i.volumesSaida - (i.volumesDevolvidos ?? 0) : 0)),
            0
          );
          const totalDevolucoes = rota.itens.reduce(
            (s, i) => s + (i.volumesDevolvidos ?? 0),
            0
          );
          const totalOcorrencias = rota.itens.reduce(
            (s, i) => s + (i.ocorrencias?.length ?? 0),
            0
          );
          const kmRodados =
            rota.kmChegada && rota.kmSaida
              ? rota.kmChegada - rota.kmSaida
              : null;

          return (
            <Link
              key={rota.id}
              href={rota.status === "em_andamento" ? `/rota/${rota.id}` : "#"}
              className={rota.status === "em_andamento" ? "cursor-pointer" : "cursor-default"}
            >
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 border-[#ee4d2d]">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-[#ee4d2d]" />
                    <span className="font-bold text-gray-800">{rota.veiculoPlaca}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        rota.status === "em_andamento"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {rota.status === "em_andamento" ? "Em andamento" : "Concluída"}
                    </span>
                  </div>
                  {rota.status === "em_andamento" && (
                    <ArrowRight size={16} className="text-gray-400" />
                  )}
                </div>

                <div className="px-4 py-3 flex flex-col gap-2">
                  {/* Data e horário */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{formatarData(rota.data)}</span>
                    <span className="text-gray-500">
                      {rota.horaSaida}
                      {rota.horaChegada ? ` → ${rota.horaChegada}` : ""}
                    </span>
                  </div>

                  {/* Motorista */}
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-400">Motorista: </span>
                    {rota.motorista}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Package size={13} className="text-blue-500" />
                      <span className="text-xs text-gray-600">
                        {totalVolumes} vol.
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-green-500" />
                      <span className="text-xs text-gray-600">
                        {totalEntregues} entregues
                      </span>
                    </div>
                    {totalDevolucoes > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={13} className="text-amber-500" />
                        <span className="text-xs text-gray-600">
                          {totalDevolucoes} dev.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* KM e ocorrências */}
                  <div className="flex gap-4 text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1">
                    <span>KM saída: {rota.kmSaida}</span>
                    {rota.kmChegada && <span>Chegada: {rota.kmChegada}</span>}
                    {kmRodados !== null && (
                      <span className="font-semibold text-gray-700">
                        {kmRodados} km rodados
                      </span>
                    )}
                    {totalOcorrencias > 0 && (
                      <span className="text-amber-600">
                        {totalOcorrencias} ocorrência(s)
                      </span>
                    )}
                  </div>

                  {/* Cidades */}
                  <div className="flex flex-wrap gap-1">
                    {rota.itens.map((item, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.concluido
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.cidadeNome}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
