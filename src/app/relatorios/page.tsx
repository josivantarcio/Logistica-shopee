"use client";

import { useEffect, useState } from "react";
import { Share2, Fuel, Wrench, BarChart2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  listarVeiculos,
  listarAbastecimentosPorPeriodo,
  listarManutencoesPorVeiculo,
  dataHojeISO,
  Veiculo,
  Abastecimento,
  Manutencao,
  TIPOS_COMBUSTIVEL,
  ITENS_SUBSTITUIDOS_LABELS,
} from "@/lib/db";
import {
  mensagemAbastecimento,
  mensagemManutencao,
  mensagemRelatorioAbastecimentos,
  mensagemRelatorioManutencoes,
  abrirWhatsApp,
} from "@/lib/whatsapp";

type AbaAtiva = "abastecimentos" | "manutencoes";

function primeiroDoMes(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function RelatoriosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [veiculoId, setVeiculoId] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState(primeiroDoMes());
  const [dataFim, setDataFim] = useState(dataHojeISO());
  const [aba, setAba] = useState<AbaAtiva>("abastecimentos");
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const vs = await listarVeiculos();
      setVeiculos(vs);
      await buscarDados(veiculoId, dataInicio, dataFim, vs);
    }
    init();
  }, []);

  useEffect(() => {
    buscarDados(veiculoId, dataInicio, dataFim, veiculos);
  }, [veiculoId, dataInicio, dataFim]);

  async function buscarDados(vid: string, di: string, df: string, vs: Veiculo[]) {
    setLoading(true);
    try {
      const vidNum = vid === "todos" ? undefined : Number(vid);
      const [abs, mans] = await Promise.all([
        listarAbastecimentosPorPeriodo(di, df, vidNum),
        vidNum !== undefined
          ? listarManutencoesPorVeiculo(vidNum).then((list) =>
              list.filter((m) => m.data >= di && m.data <= df)
            )
          : Promise.all(vs.map((v) => listarManutencoesPorVeiculo(v.id!))).then(
              (listas) => listas.flat().filter((m) => m.data >= di && m.data <= df)
            ),
      ]);
      setAbastecimentos(abs);
      setManutencoes(mans);
    } finally {
      setLoading(false);
    }
  }

  const totalGasto = abastecimentos.reduce((s, a) => s + a.valorTotal, 0);
  const totalLitros = abastecimentos.reduce((s, a) => s + a.litros, 0);
  const comConsumo = abastecimentos.filter((a) => a.consumoKmL !== undefined);
  const consumoMedio =
    comConsumo.length > 0
      ? comConsumo.reduce((s, a) => s + a.consumoKmL!, 0) / comConsumo.length
      : null;

  const veiculoSelecionado = veiculos.find((v) => String(v.id) === veiculoId) ?? null;

  function compartilharAbastecimentos() {
    const msg = mensagemRelatorioAbastecimentos(
      veiculoSelecionado,
      dataInicio,
      dataFim,
      abastecimentos
    );
    abrirWhatsApp(msg);
  }

  function compartilharManutencoes() {
    if (!veiculoSelecionado) return;
    const msg = mensagemRelatorioManutencoes(veiculoSelecionado, manutencoes);
    abrirWhatsApp(msg);
  }

  return (
    <div className="flex flex-col">
      <PageHeader titulo="Relatórios" voltar="/" />

      <div className="flex flex-col gap-4 p-4">
        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
          <p className="font-semibold text-gray-800 text-sm">Filtros</p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Veículo</label>
            <select
              value={veiculoId}
              onChange={(e) => setVeiculoId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d]"
            >
              <option value="todos">Todos os veículos</option>
              {veiculos.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.placa} — {v.modelo}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Até</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d]"
              />
            </div>
          </div>
        </div>

        {/* Card resumo */}
        <div className="bg-[#ee4d2d]/10 border border-[#ee4d2d]/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-[#ee4d2d]" />
              <p className="font-bold text-[#ee4d2d] text-sm">Resumo — Combustível</p>
            </div>
            <button
              onClick={compartilharAbastecimentos}
              className="flex items-center gap-1 text-green-700 bg-green-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg active:bg-green-100"
            >
              <Share2 size={12} />
              WhatsApp
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-xl p-2">
              <p className="text-xs text-gray-500">Total gasto</p>
              <p className="font-bold text-gray-800 text-sm">
                {totalGasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
            <div className="bg-white rounded-xl p-2">
              <p className="text-xs text-gray-500">Total litros</p>
              <p className="font-bold text-gray-800 text-sm">
                {totalLitros.toFixed(1).replace(".", ",")} L
              </p>
            </div>
            <div className="bg-white rounded-xl p-2">
              <p className="text-xs text-gray-500">Consumo</p>
              <p className="font-bold text-gray-800 text-sm">
                {consumoMedio !== null
                  ? `${consumoMedio.toFixed(1).replace(".", ",")} km/L`
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setAba("abastecimentos")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              aba === "abastecimentos"
                ? "bg-white text-[#ee4d2d] shadow-sm"
                : "text-gray-500"
            }`}
          >
            <Fuel size={14} />
            Abastecimentos
          </button>
          <button
            onClick={() => setAba("manutencoes")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              aba === "manutencoes"
                ? "bg-white text-[#ee4d2d] shadow-sm"
                : "text-gray-500"
            }`}
          >
            <Wrench size={14} />
            Manutenções
          </button>
        </div>

        {/* Conteúdo da aba */}
        {loading && (
          <div className="bg-white rounded-2xl p-4 animate-pulse h-20" />
        )}

        {!loading && aba === "abastecimentos" && (
          <div className="flex flex-col gap-2">
            {abastecimentos.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Fuel size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum abastecimento no período</p>
              </div>
            )}
            {abastecimentos.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl shadow-sm px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      {a.veiculoPlaca} · {a.data.split("-").reverse().join("/")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {TIPOS_COMBUSTIVEL[a.tipoCombustivel]} · {a.litros.toFixed(2).replace(".", ",")} L ·{" "}
                      {a.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-xs text-gray-400">KM {a.kmAtual.toLocaleString("pt-BR")}</p>
                    {a.consumoKmL !== undefined && (
                      <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                        ⚡ {a.consumoKmL.toFixed(2).replace(".", ",")} km/L
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const v = veiculos.find((x) => x.id === a.veiculoId);
                      if (v) abrirWhatsApp(mensagemAbastecimento(a, v));
                    }}
                    className="p-1.5 text-green-600 active:opacity-70 shrink-0"
                  >
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && aba === "manutencoes" && (
          <div className="flex flex-col gap-2">
            {manutencoes.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Wrench size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma manutenção no período</p>
              </div>
            )}
            {veiculoSelecionado && manutencoes.length > 0 && (
              <button
                onClick={compartilharManutencoes}
                className="flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold text-sm py-2.5 rounded-xl border border-green-200 active:bg-green-100"
              >
                <Share2 size={15} />
                Compartilhar histórico no WhatsApp
              </button>
            )}
            {manutencoes.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl shadow-sm px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      {m.veiculoPlaca} · {m.data.split("-").reverse().join("/")}
                    </p>
                    <p className="text-sm text-gray-600">🛢️ {m.tipoOleo} · KM {m.kmAtual.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.itensSubstituidos.map((i) => ITENS_SUBSTITUIDOS_LABELS[i]).join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const v = veiculos.find((x) => x.id === m.veiculoId);
                      if (v) abrirWhatsApp(mensagemManutencao(m, v));
                    }}
                    className="p-1.5 text-green-600 active:opacity-70 shrink-0"
                  >
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
