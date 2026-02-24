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
  Wrench,
  BarChart2,
  MapPin,
  TrendingUp,
} from "lucide-react";
import {
  rotaEmAndamento,
  listarRotas,
  listarVeiculos,
  buscarUltimaManutencao,
  manutencaoVencida,
  dataHojeISO,
  Rota,
} from "@/lib/db";

// ── Componente gráfico de barras SVG puro ────────────────────
interface BarChartData {
  label: string;
  value: number;
  secondaryValue?: number;
}

function BarChart({
  data,
  title,
  color = "#ee4d2d",
  secondaryColor = "#93c5fd",
  unit = "",
}: {
  data: BarChartData[];
  title: string;
  color?: string;
  secondaryColor?: string;
  unit?: string;
}) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue ?? 0)), 1);
  const chartH = 80;
  const barW = 24;
  const gap = 8;
  const totalW = data.length * (barW * (data[0]?.secondaryValue !== undefined ? 2 : 1) + gap + 4);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      <div className="overflow-x-auto">
        <svg width={Math.max(totalW, 280)} height={chartH + 24} className="block">
          {data.map((d, i) => {
            const hasSecondary = d.secondaryValue !== undefined;
            const colW = hasSecondary ? barW * 2 + 4 : barW;
            const x = i * (colW + gap);
            const h1 = Math.max(2, (d.value / maxVal) * chartH);
            const h2 = hasSecondary
              ? Math.max(2, ((d.secondaryValue ?? 0) / maxVal) * chartH)
              : 0;

            return (
              <g key={i}>
                {/* Barra principal */}
                <rect
                  x={x}
                  y={chartH - h1}
                  width={barW}
                  height={h1}
                  rx={4}
                  fill={color}
                  opacity={d.value === 0 ? 0.2 : 0.85}
                />
                {/* Barra secundária */}
                {hasSecondary && (
                  <rect
                    x={x + barW + 4}
                    y={chartH - h2}
                    width={barW}
                    height={h2}
                    rx={4}
                    fill={secondaryColor}
                    opacity={(d.secondaryValue ?? 0) === 0 ? 0.2 : 0.85}
                  />
                )}
                {/* Valor acima da barra */}
                {d.value > 0 && (
                  <text
                    x={x + barW / 2}
                    y={chartH - h1 - 3}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#6b7280"
                    fontWeight="600"
                  >
                    {d.value}{unit}
                  </text>
                )}
                {/* Label */}
                <text
                  x={x + (hasSecondary ? barW + 2 : barW / 2)}
                  y={chartH + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9ca3af"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {data[0]?.secondaryValue !== undefined && (
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
            <span className="text-xs text-gray-500">Volumes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: secondaryColor }} />
            <span className="text-xs text-gray-500">KM</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Gerador de Insights IA Local ─────────────────────────────
interface Insight {
  tipo: "alerta" | "info" | "sucesso";
  texto: string;
  icone: string;
}

function gerarInsights(rotas: Rota[]): Insight[] {
  const insights: Insight[] = [];
  if (rotas.length < 2) return insights;

  const hoje = new Date();
  const d30 = new Date(hoje);
  d30.setDate(d30.getDate() - 30);
  const inicio30 = d30.toISOString().split("T")[0];
  const rotas30 = rotas.filter((r) => r.data >= inicio30 && r.status === "concluida");

  if (rotas30.length === 0) return insights;

  // 1. Entregador com mais ocorrências
  const ocsPorEntregador: Record<string, number> = {};
  rotas30.forEach((r) =>
    r.itens.forEach((i) => {
      const qtd = (i.ocorrencias ?? []).reduce((s, o) => s + o.quantidade, 0);
      if (qtd > 0) {
        ocsPorEntregador[i.entregadorNome] =
          (ocsPorEntregador[i.entregadorNome] ?? 0) + qtd;
      }
    })
  );
  const topEntregador = Object.entries(ocsPorEntregador).sort((a, b) => b[1] - a[1])[0];
  if (topEntregador && topEntregador[1] >= 3) {
    insights.push({
      tipo: "alerta",
      icone: "⚠️",
      texto: `${topEntregador[0]} acumulou ${topEntregador[1]} ocorrências nos últimos 30 dias. Atenção recomendada.`,
    });
  }

  // 2. KM médio por rota e desvios
  const kmsRotas = rotas30
    .filter((r) => r.kmChegada && r.kmSaida)
    .map((r) => r.kmChegada! - r.kmSaida);
  if (kmsRotas.length >= 3) {
    const mediaKm = kmsRotas.reduce((a, b) => a + b, 0) / kmsRotas.length;
    const ultimaKm = kmsRotas[0];
    if (ultimaKm > mediaKm * 1.3) {
      insights.push({
        tipo: "alerta",
        icone: "🛣️",
        texto: `Última rota rodou ${ultimaKm} km — 30% acima da média (${Math.round(mediaKm)} km). Verifique o percurso.`,
      });
    } else {
      insights.push({
        tipo: "info",
        icone: "📏",
        texto: `Média de KM por rota nos últimos 30 dias: ${Math.round(mediaKm)} km.`,
      });
    }
  }

  // 3. Taxa de devolução
  const totalSaida = rotas30.reduce(
    (s, r) => s + r.itens.reduce((ss, i) => ss + i.volumesSaida, 0),
    0
  );
  const totalDev = rotas30.reduce(
    (s, r) => s + r.itens.reduce((ss, i) => ss + (i.volumesDevolvidos ?? 0), 0),
    0
  );
  if (totalSaida > 0) {
    const taxaDev = (totalDev / totalSaida) * 100;
    if (taxaDev > 10) {
      insights.push({
        tipo: "alerta",
        icone: "↩️",
        texto: `Taxa de devolução em ${taxaDev.toFixed(1)}% nos últimos 30 dias (${totalDev}/${totalSaida} volumes). Acima do esperado.`,
      });
    } else if (taxaDev > 0) {
      insights.push({
        tipo: "info",
        icone: "📦",
        texto: `Taxa de devolução: ${taxaDev.toFixed(1)}% — ${totalDev} volumes devolvidos de ${totalSaida} saídos.`,
      });
    } else {
      insights.push({
        tipo: "sucesso",
        icone: "✅",
        texto: `Nenhuma devolução registrada nos últimos 30 dias. Ótimo desempenho!`,
      });
    }
  }

  // 4. Dia da semana com mais ocorrências
  const ocsPorDia: Record<number, number> = {};
  rotas30.forEach((r) => {
    const dia = new Date(r.data + "T12:00:00").getDay();
    const qtd = r.itens.reduce(
      (s, i) => s + (i.ocorrencias ?? []).reduce((ss, o) => ss + o.quantidade, 0),
      0
    );
    ocsPorDia[dia] = (ocsPorDia[dia] ?? 0) + qtd;
  });
  const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const piorDia = Object.entries(ocsPorDia).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  if (piorDia && Number(piorDia[1]) >= 2) {
    insights.push({
      tipo: "info",
      icone: "📅",
      texto: `${DIAS[Number(piorDia[0])]} é o dia com mais ocorrências (${piorDia[1]} registradas). Planeje reforços.`,
    });
  }

  // 5. Cidade problemática
  const ocsPorCidade: Record<string, number> = {};
  rotas30.forEach((r) =>
    r.itens.forEach((i) => {
      const qtd = (i.ocorrencias ?? []).reduce((s, o) => s + o.quantidade, 0);
      if (qtd > 0) {
        ocsPorCidade[i.cidadeNome] = (ocsPorCidade[i.cidadeNome] ?? 0) + qtd;
      }
    })
  );
  const topCidade = Object.entries(ocsPorCidade).sort((a, b) => b[1] - a[1])[0];
  if (topCidade && topCidade[1] >= 3) {
    insights.push({
      tipo: "alerta",
      icone: "📍",
      texto: `${topCidade[0]} concentra ${topCidade[1]} ocorrências nos últimos 30 dias. Investigue a causa.`,
    });
  }

  return insights.slice(0, 4);
}

// ── Helpers ──────────────────────────────────────────────────
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function ultimosDias(n: number): string[] {
  const dias: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dias.push(d.toISOString().split("T")[0]);
  }
  return dias;
}

export default function Dashboard() {
  const [rotaAtiva, setRotaAtiva] = useState<Rota | null>(null);
  const [todasRotas, setTodasRotas] = useState<Rota[]>([]);
  const [alertasManutencao, setAlertasManutencao] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [ativa, todas, veiculos] = await Promise.all([
          rotaEmAndamento(),
          listarRotas(),
          listarVeiculos(),
        ]);
        setRotaAtiva(ativa ?? null);
        setTodasRotas(todas);

        let alertas = 0;
        await Promise.all(
          veiculos
            .filter((v) => v.ativo)
            .map(async (v) => {
              if (!v.id) return;
              const ultima = await buscarUltimaManutencao(v.id);
              if (ultima && manutencaoVencida(ultima, v.kmAtual ?? ultima.kmAtual)) {
                alertas++;
              }
            })
        );
        setAlertasManutencao(alertas);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const hoje = dataHojeISO();
  const rotasHoje = todasRotas.filter((r) => r.data === hoje);

  const totalVolumesHoje = rotasHoje.reduce(
    (s, r) => s + r.itens.reduce((ss, i) => ss + i.volumesSaida, 0),
    0
  );
  const totalDevolucoes = rotasHoje.reduce(
    (s, r) => s + r.itens.reduce((ss, i) => ss + (i.volumesDevolvidos ?? 0), 0),
    0
  );
  const cidadesConcluidas = rotasHoje.reduce(
    (s, r) => s + r.itens.filter((i) => i.concluido).length,
    0
  );

  // Dados para gráfico: últimos 7 dias — volumes e km
  const ultimos7 = ultimosDias(7);
  const dadosGraficoSemana: BarChartData[] = ultimos7.map((data) => {
    const rotasDia = todasRotas.filter((r) => r.data === data);
    const volumes = rotasDia.reduce(
      (s, r) => s + r.itens.reduce((ss, i) => ss + i.volumesSaida, 0),
      0
    );
    const km = rotasDia.reduce(
      (s, r) => s + (r.kmChegada && r.kmSaida ? r.kmChegada - r.kmSaida : 0),
      0
    );
    const diaSemana = DIAS_SEMANA[new Date(data + "T12:00:00").getDay()];
    return { label: diaSemana, value: volumes, secondaryValue: km };
  });

  // Dados para gráfico: ocorrências por tipo (últimos 30 dias)
  const d30 = new Date();
  d30.setDate(d30.getDate() - 30);
  const inicio30 = d30.toISOString().split("T")[0];
  const rotas30 = todasRotas.filter((r) => r.data >= inicio30);
  const ocorrenciasPorTipo: Record<string, number> = {};
  rotas30.forEach((r) =>
    r.itens.forEach((i) =>
      (i.ocorrencias ?? []).forEach((o) => {
        ocorrenciasPorTipo[o.tipo] = (ocorrenciasPorTipo[o.tipo] ?? 0) + o.quantidade;
      })
    )
  );
  const LABELS_OCORRENCIA: Record<string, string> = {
    recusa_cliente: "Recusa",
    duplicidade: "Duplic.",
    nao_localizado: "N.Local.",
    cliente_ausente: "Ausente",
    produto_danificado: "Danif.",
    produto_fora_sistema: "F.Sist.",
    rota_errada: "Rt.Err.",
    outro: "Outro",
  };
  const dadosOcorrencias: BarChartData[] = Object.entries(ocorrenciasPorTipo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tipo, qtd]) => ({
      label: LABELS_OCORRENCIA[tipo] ?? tipo,
      value: qtd,
    }));

  // Totais últimos 30 dias
  const kmTotal30 = rotas30.reduce(
    (s, r) => s + (r.kmChegada && r.kmSaida ? r.kmChegada - r.kmSaida : 0),
    0
  );
  const volumesTotal30 = rotas30.reduce(
    (s, r) => s + r.itens.reduce((ss, i) => ss + i.volumesSaida, 0),
    0
  );
  const rotasConcluidas30 = rotas30.filter((r) => r.status === "concluida").length;

  return (
    <div className="flex flex-col pb-24">
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
        {/* Alerta de manutenção vencida */}
        {!loading && alertasManutencao > 0 && (
          <Link href="/manutencao">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="bg-red-500 text-white rounded-full p-2">
                <Wrench size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-700">Manutenção Vencida</p>
                <p className="text-sm text-red-600">
                  {alertasManutencao} veículo{alertasManutencao > 1 ? "s" : ""} com manutenção atrasada
                </p>
              </div>
              <ArrowRight size={20} className="text-red-500" />
            </div>
          </Link>
        )}

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
            <p className="text-xs text-gray-500">Volumes hoje</p>
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

        {/* Cards totais 30 dias */}
        {!loading && volumesTotal30 > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
              <TrendingUp size={13} /> Últimos 30 dias
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-[#ee4d2d]">{volumesTotal30}</p>
                <p className="text-xs text-gray-500">volumes</p>
              </div>
              <div>
                <p className="text-xl font-bold text-blue-600">{kmTotal30}</p>
                <p className="text-xs text-gray-500">km rodados</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">{rotasConcluidas30}</p>
                <p className="text-xs text-gray-500">rotas</p>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico: volumes e km por dia (últimos 7 dias) */}
        {!loading && todasRotas.length > 0 && (
          <BarChart
            data={dadosGraficoSemana}
            title="Volumes & KM — últimos 7 dias"
            color="#ee4d2d"
            secondaryColor="#93c5fd"
          />
        )}

        {/* Gráfico: ocorrências por tipo (30 dias) */}
        {!loading && dadosOcorrencias.length > 0 && (
          <BarChart
            data={dadosOcorrencias}
            title="Ocorrências por tipo — 30 dias"
            color="#f59e0b"
          />
        )}

        {/* Insights IA Local */}
        {!loading && (() => {
          const insights = gerarInsights(todasRotas);
          if (insights.length === 0) return null;
          return (
            <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                🤖 Insights Automáticos
              </p>
              {insights.map((ins, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl px-3 py-2.5 flex items-start gap-2 ${
                    ins.tipo === "alerta"
                      ? "bg-red-50 border border-red-100"
                      : ins.tipo === "sucesso"
                      ? "bg-green-50 border border-green-100"
                      : "bg-blue-50 border border-blue-100"
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">{ins.icone}</span>
                  <p
                    className={`text-xs leading-relaxed ${
                      ins.tipo === "alerta"
                        ? "text-red-700"
                        : ins.tipo === "sucesso"
                        ? "text-green-700"
                        : "text-blue-700"
                    }`}
                  >
                    {ins.texto}
                  </p>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Atalhos */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Acesso rápido
          </p>
          {[
            { href: "/cadastros", label: "Cadastros", icon: MapPin },
            { href: "/historico", label: "Histórico de Rotas", icon: BarChart2 },
            { href: "/manutencao", label: "Manutenção & Frota", icon: Wrench },
            { href: "/relatorios", label: "Relatórios", icon: TrendingUp },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between px-4 py-3 border-t border-gray-100 active:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Icon size={15} className="text-gray-400" />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
