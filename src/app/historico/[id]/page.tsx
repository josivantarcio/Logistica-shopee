"use client";

import { useEffect, useState, use } from "react";
import {
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  RotateCcw,
  Flag,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  buscarRota,
  Rota,
  ItemRota,
  TIPOS_OCORRENCIA,
  formatarData,
} from "@/lib/db";

function calcularDuracao(horaSaida: string, horaChegada?: string): string {
  if (!horaChegada) return "—";
  const [hS, mS] = horaSaida.split(":").map(Number);
  const [hC, mC] = horaChegada.split(":").map(Number);
  const totalMin = hC * 60 + mC - (hS * 60 + mS);
  if (totalMin <= 0) return "—";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function DetalheRotaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [rota, setRota] = useState<Rota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarRota(Number(id)).then((r) => {
      setRota(r ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col">
        <PageHeader titulo="Detalhes da Rota" voltar="/historico" />
        <div className="p-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!rota) {
    return (
      <div className="flex flex-col">
        <PageHeader titulo="Detalhes da Rota" voltar="/historico" />
        <div className="p-8 text-center text-gray-400">
          <p>Rota não encontrada.</p>
        </div>
      </div>
    );
  }

  const totalVolumes = rota.itens.reduce((s, i) => s + i.volumesSaida, 0);
  const totalEntregues = rota.itens.reduce(
    (s, i) =>
      s + (i.volumesEntregues ?? (i.concluido ? i.volumesSaida - (i.volumesDevolvidos ?? 0) : 0)),
    0
  );
  const totalDevolvidos = rota.itens.reduce((s, i) => s + (i.volumesDevolvidos ?? 0), 0);
  const totalOcorrencias = rota.itens.reduce((s, i) => s + (i.ocorrencias?.length ?? 0), 0);
  const kmRodados =
    rota.kmChegada && rota.kmSaida ? rota.kmChegada - rota.kmSaida : null;
  const duracao = calcularDuracao(rota.horaSaida, rota.horaChegada);

  return (
    <div className="flex flex-col pb-24">
      <PageHeader titulo="Detalhes da Rota" voltar="/historico" />

      {/* Banner status */}
      <div className="bg-[#ee4d2d] text-white px-4 py-3">
        <div className="flex items-center gap-3 mb-1">
          <Truck size={18} />
          <span className="font-bold">{rota.veiculoPlaca}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              rota.status === "em_andamento"
                ? "bg-blue-200 text-blue-900"
                : "bg-white/20 text-white"
            }`}
          >
            {rota.status === "em_andamento" ? "Em andamento" : "Concluída"}
          </span>
        </div>
        <p className="text-sm text-white/80">{rota.motorista}</p>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Resumo geral */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-700">Resumo</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Data</p>
              <p className="font-semibold text-gray-800">{formatarData(rota.data)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Horário</p>
              <p className="font-semibold text-gray-800">
                {rota.horaSaida}
                {rota.horaChegada ? ` → ${rota.horaChegada}` : ""}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Duração</p>
              <p className="font-semibold text-gray-800 flex items-center gap-1">
                <Clock size={14} className="text-[#ee4d2d]" /> {duracao}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">KM rodados</p>
              <p className="font-semibold text-gray-800">
                {kmRodados !== null ? `${kmRodados} km` : "—"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-blue-500" />
              <span className="text-gray-600">{totalVolumes} volumes saída</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />
              <span className="text-gray-600">{totalEntregues} entregues</span>
            </div>
            {totalDevolvidos > 0 && (
              <div className="flex items-center gap-2">
                <RotateCcw size={15} className="text-amber-500" />
                <span className="text-gray-600">{totalDevolvidos} devolvidos</span>
              </div>
            )}
            {totalOcorrencias > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500" />
                <span className="text-red-600 font-medium">{totalOcorrencias} ocorrência(s)</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-3 flex gap-4 text-xs text-gray-500">
            <span>KM saída: {rota.kmSaida}</span>
            {rota.kmChegada && <span>KM chegada: {rota.kmChegada}</span>}
          </div>
        </div>

        {/* Cidades / Paradas */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-gray-700 px-1">Paradas</h2>
          {rota.itens.map((item: ItemRota, idx: number) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${
                item.concluido ? "border-green-500" : "border-gray-200"
              }`}
            >
              {/* Cabeçalho parada */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div
                  className={`rounded-full p-1.5 ${
                    item.concluido ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <MapPin
                    size={16}
                    className={item.concluido ? "text-green-600" : "text-gray-400"}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.cidadeNome}</p>
                  <p className="text-xs text-gray-500">{item.entregadorNome}</p>
                </div>
                {item.concluido && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    Concluído
                  </span>
                )}
              </div>

              <div className="px-4 py-3 flex flex-col gap-2">
                {/* Volumes */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 rounded-lg px-2 py-1.5">
                    <p className="text-[10px] text-blue-500 font-medium">Saída</p>
                    <p className="font-bold text-blue-700">{item.volumesSaida}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg px-2 py-1.5">
                    <p className="text-[10px] text-green-500 font-medium">Entregues</p>
                    <p className="font-bold text-green-700">
                      {item.volumesEntregues ??
                        (item.concluido
                          ? item.volumesSaida - (item.volumesDevolvidos ?? 0)
                          : "—")}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg px-2 py-1.5">
                    <p className="text-[10px] text-amber-500 font-medium">Devolvidos</p>
                    <p className="font-bold text-amber-700">{item.volumesDevolvidos ?? 0}</p>
                  </div>
                </div>

                {/* Hora conclusão */}
                {item.concluido && item.horaConclusao && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Flag size={11} className="text-green-500" />
                    Concluído às {item.horaConclusao}
                  </div>
                )}

                {/* Ocorrências */}
                {(item.ocorrencias?.length ?? 0) > 0 && (
                  <div className="border-t border-gray-100 pt-2">
                    <div className="flex items-center gap-1 mb-1.5">
                      <AlertTriangle size={13} className="text-amber-500" />
                      <span className="text-xs font-semibold text-amber-700">
                        Ocorrências ({item.ocorrencias.length})
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {item.ocorrencias.map((oco) => (
                        <div
                          key={oco.id}
                          className="bg-amber-50 rounded-lg px-3 py-2"
                        >
                          <p className="text-xs font-semibold text-amber-800">
                            {TIPOS_OCORRENCIA[oco.tipo]} — {oco.quantidade}x
                          </p>
                          {oco.descricao && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              {oco.descricao}
                            </p>
                          )}
                          <p className="text-[10px] text-amber-400 mt-0.5">
                            {new Date(oco.registradoEm).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(item.ocorrencias?.length ?? 0) === 0 && (
                  <p className="text-xs text-gray-400 italic">Sem ocorrências</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
