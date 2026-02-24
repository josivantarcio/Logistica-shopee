"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { listarRotas, Rota, formatarData } from "@/lib/db";

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

function dataHojeISO() {
  return new Date().toISOString().split("T")[0];
}

function dataHaMesesISO(meses: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return d.toISOString().split("T")[0];
}

export default function HistoricoPage() {
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [dataInicio, setDataInicio] = useState(dataHaMesesISO(1));
  const [dataFim, setDataFim] = useState(dataHojeISO());
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "em_andamento" | "concluida">("todos");

  useEffect(() => {
    listarRotas().then((r) => {
      setRotas(r);
      setLoading(false);
    });
  }, []);

  const rotasFiltradas = useMemo(() => {
    return rotas.filter((r) => {
      const dentroPeriodo = r.data >= dataInicio && r.data <= dataFim;
      const statusOk = filtroStatus === "todos" || r.status === filtroStatus;
      return dentroPeriodo && statusOk;
    });
  }, [rotas, dataInicio, dataFim, filtroStatus]);

  // Totalizadores do período
  const totais = useMemo(() => {
    const concluidas = rotasFiltradas.filter((r) => r.status === "concluida");
    const kmTotal = concluidas.reduce(
      (s, r) => s + (r.kmChegada && r.kmSaida ? r.kmChegada - r.kmSaida : 0),
      0
    );
    const volumesTotal = rotasFiltradas.reduce(
      (s, r) => s + r.itens.reduce((ss, i) => ss + i.volumesSaida, 0),
      0
    );
    const ocorrenciasTotal = rotasFiltradas.reduce(
      (s, r) => s + r.itens.reduce((ss, i) => ss + (i.ocorrencias?.length ?? 0), 0),
      0
    );
    // Tempo total em minutos
    let minTotal = 0;
    concluidas.forEach((r) => {
      if (r.horaSaida && r.horaChegada) {
        const [hS, mS] = r.horaSaida.split(":").map(Number);
        const [hC, mC] = r.horaChegada.split(":").map(Number);
        const diff = hC * 60 + mC - (hS * 60 + mS);
        if (diff > 0) minTotal += diff;
      }
    });
    const tempoH = Math.floor(minTotal / 60);
    const tempoM = minTotal % 60;
    const tempoStr = tempoH > 0 ? `${tempoH}h ${tempoM}min` : minTotal > 0 ? `${tempoM}min` : "—";

    return { kmTotal, volumesTotal, ocorrenciasTotal, tempoStr, concluidas: concluidas.length };
  }, [rotasFiltradas]);

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
    <div className="flex flex-col pb-24">
      <PageHeader titulo="Histórico" voltar="/" />

      <div className="flex flex-col gap-3 p-4">
        {/* Botão filtro */}
        <button
          onClick={() => setFiltroAberto(!filtroAberto)}
          className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3 active:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#ee4d2d]" />
            <span className="text-sm font-semibold text-gray-700">Filtros</span>
            {filtroStatus !== "todos" && (
              <span className="text-xs bg-[#ee4d2d] text-white px-2 py-0.5 rounded-full">
                {filtroStatus === "em_andamento" ? "Em andamento" : "Concluídas"}
              </span>
            )}
          </div>
          {filtroAberto ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {/* Painel filtros */}
        {filtroAberto && (
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Data início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Data fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <div className="flex gap-2">
                {(["todos", "em_andamento", "concluida"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFiltroStatus(s)}
                    className={`flex-1 text-xs py-2 rounded-xl font-semibold border transition-colors ${
                      filtroStatus === s
                        ? "bg-[#ee4d2d] text-white border-[#ee4d2d]"
                        : "border-gray-200 text-gray-600 active:bg-gray-50"
                    }`}
                  >
                    {s === "todos" ? "Todos" : s === "em_andamento" ? "Andamento" : "Concluídas"}
                  </button>
                ))}
              </div>
            </div>

            {/* Atalhos de período */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "7 dias", meses: 0, dias: 7 },
                { label: "30 dias", meses: 1, dias: 0 },
                { label: "3 meses", meses: 3, dias: 0 },
              ].map(({ label, meses, dias }) => (
                <button
                  key={label}
                  onClick={() => {
                    const d = new Date();
                    if (dias > 0) d.setDate(d.getDate() - dias);
                    else d.setMonth(d.getMonth() - meses);
                    setDataInicio(d.toISOString().split("T")[0]);
                    setDataFim(dataHojeISO());
                  }}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 active:bg-gray-100 font-medium"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Totalizadores do período */}
        {rotasFiltradas.length > 0 && (
          <div className="bg-[#ee4d2d] rounded-2xl p-4 text-white">
            <p className="text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">
              Totais do período — {rotasFiltradas.length} rota(s)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 rounded-xl p-2.5">
                <p className="text-[10px] text-white/70">KM rodados</p>
                <p className="font-bold text-lg">{totais.kmTotal} km</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5">
                <p className="text-[10px] text-white/70">Volumes saída</p>
                <p className="font-bold text-lg">{totais.volumesTotal}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5">
                <p className="text-[10px] text-white/70">Tempo em rota</p>
                <p className="font-bold text-lg">{totais.tempoStr}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5">
                <p className="text-[10px] text-white/70">Ocorrências</p>
                <p className={`font-bold text-lg ${totais.ocorrenciasTotal > 0 ? "text-yellow-300" : ""}`}>
                  {totais.ocorrenciasTotal}
                </p>
              </div>
            </div>
          </div>
        )}

        {rotasFiltradas.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Clock size={44} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma rota no período</p>
            <p className="text-sm">Ajuste os filtros para ver outras rotas</p>
          </div>
        )}

        {rotasFiltradas.map((rota) => {
          const totalVolumes = rota.itens.reduce((s, i) => s + i.volumesSaida, 0);
          const totalEntregues = rota.itens.reduce(
            (s, i) =>
              s + (i.volumesEntregues ?? (i.concluido ? i.volumesSaida - (i.volumesDevolvidos ?? 0) : 0)),
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
            rota.kmChegada && rota.kmSaida ? rota.kmChegada - rota.kmSaida : null;
          const duracao = calcularDuracao(rota.horaSaida, rota.horaChegada);

          return (
            <Link
              key={rota.id}
              href={
                rota.status === "em_andamento"
                  ? `/rota/${rota.id}`
                  : `/historico/${rota.id}`
              }
              className="cursor-pointer"
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
                  <ArrowRight size={16} className="text-gray-400" />
                </div>

                <div className="px-4 py-3 flex flex-col gap-2">
                  {/* Data e horário */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{formatarData(rota.data)}</span>
                    <span className="text-gray-500">
                      {rota.horaSaida}
                      {rota.horaChegada ? ` → ${rota.horaChegada}` : ""}
                      {duracao !== "—" && (
                        <span className="text-gray-400"> ({duracao})</span>
                      )}
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
                      <span className="text-xs text-gray-600">{totalVolumes} vol.</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-green-500" />
                      <span className="text-xs text-gray-600">{totalEntregues} entregues</span>
                    </div>
                    {totalDevolucoes > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={13} className="text-amber-500" />
                        <span className="text-xs text-gray-600">{totalDevolucoes} dev.</span>
                      </div>
                    )}
                  </div>

                  {/* KM e ocorrências */}
                  <div className="flex gap-4 text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1 flex-wrap">
                    <span>KM saída: {rota.kmSaida}</span>
                    {rota.kmChegada && <span>Chegada: {rota.kmChegada}</span>}
                    {kmRodados !== null && (
                      <span className="font-semibold text-gray-700">{kmRodados} km rodados</span>
                    )}
                    {totalOcorrencias > 0 && (
                      <span className="text-amber-600 font-medium">
                        {totalOcorrencias} ocorrência(s)
                      </span>
                    )}
                  </div>

                  {/* Cidades */}
                  <div className="flex flex-wrap gap-1">
                    {rota.itens.map((item, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                          item.concluido
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <MapPin size={9} />
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
