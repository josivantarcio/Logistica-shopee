"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, Fuel, ArrowRight, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  listarVeiculos,
  listarAbastecimentosPorVeiculo,
  buscarUltimaManutencao,
  manutencaoVencida,
  Veiculo,
  Manutencao,
  Abastecimento,
} from "@/lib/db";

interface VeiculoInfo {
  veiculo: Veiculo;
  ultimaManutencao?: Manutencao;
  vencida: boolean;
  consumoMedio?: number;
}

export default function ManutencaoPage() {
  const [infos, setInfos] = useState<VeiculoInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const veiculos = await listarVeiculos();
        const ativos = veiculos.filter((v) => v.ativo);

        const resultados = await Promise.all(
          ativos.map(async (v): Promise<VeiculoInfo> => {
            const [ultima, abastecimentos] = await Promise.all([
              buscarUltimaManutencao(v.id!),
              listarAbastecimentosPorVeiculo(v.id!),
            ]);

            const comConsumo: Abastecimento[] = abastecimentos
              .filter((a) => a.consumoKmL !== undefined)
              .slice(0, 3);

            const consumoMedio =
              comConsumo.length > 0
                ? comConsumo.reduce((s, a) => s + a.consumoKmL!, 0) / comConsumo.length
                : undefined;

            const vencida = ultima
              ? manutencaoVencida(ultima, v.kmAtual ?? ultima.kmAtual)
              : false;

            return { veiculo: v, ultimaManutencao: ultima, vencida, consumoMedio };
          })
        );

        setInfos(resultados);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  return (
    <div className="flex flex-col">
      <PageHeader titulo="Frota & Manutenção" voltar="/" />

      <div className="flex flex-col gap-3 p-4">
        {loading && (
          <div className="bg-white rounded-2xl p-4 animate-pulse h-24" />
        )}

        {!loading && infos.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Wrench size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum veículo ativo</p>
            <p className="text-sm">Cadastre veículos em Cadastros</p>
          </div>
        )}

        {infos.map(({ veiculo, ultimaManutencao, vencida, consumoMedio }) => (
          <div
            key={veiculo.id}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${
              vencida ? "border-red-500" : "border-gray-200"
            }`}
          >
            {/* Cabeçalho do veículo */}
            <div className="px-4 py-3 flex items-center gap-3">
              <div className={`rounded-full p-2 ${vencida ? "bg-red-100" : "bg-blue-100"}`}>
                <Wrench size={18} className={vencida ? "text-red-500" : "text-blue-600"} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-800">{veiculo.placa}</p>
                  {vencida && (
                    <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <AlertTriangle size={8} /> VENCIDA
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{veiculo.modelo}</p>
              </div>
            </div>

            {/* Status */}
            <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-xl p-2">
                <p className="text-xs text-gray-500">KM Atual</p>
                <p className="font-bold text-gray-800 text-sm">
                  {veiculo.kmAtual !== undefined
                    ? veiculo.kmAtual.toLocaleString("pt-BR")
                    : "—"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2">
                <p className="text-xs text-gray-500">Consumo</p>
                <p className="font-bold text-gray-800 text-sm">
                  {consumoMedio !== undefined
                    ? `${consumoMedio.toFixed(1).replace(".", ",")} km/L`
                    : "—"}
                </p>
              </div>
              <div className={`rounded-xl p-2 ${vencida ? "bg-red-50" : "bg-gray-50"}`}>
                <p className={`text-xs ${vencida ? "text-red-500" : "text-gray-500"}`}>
                  Últ. Troca
                </p>
                <p className={`font-bold text-sm ${vencida ? "text-red-700" : "text-gray-800"}`}>
                  {ultimaManutencao
                    ? `${ultimaManutencao.kmAtual.toLocaleString("pt-BR")} km`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="px-4 pb-4 flex gap-2">
              <Link
                href={`/manutencao/${veiculo.id}/abastecimentos`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 font-semibold text-sm py-2 rounded-xl active:bg-blue-100"
              >
                <Fuel size={15} />
                Abastecimentos
              </Link>
              <Link
                href={`/manutencao/${veiculo.id}/manutencoes`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-50 text-orange-700 font-semibold text-sm py-2 rounded-xl active:bg-orange-100"
              >
                <Wrench size={15} />
                Manutenções
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
