"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  MessageCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Package,
  AlertTriangle,
  Truck,
  Flag,
  Clock,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Btn from "@/components/Btn";
import Input from "@/components/Input";
import {
  buscarRota,
  salvarRota,
  listarAbastecimentosPorVeiculo,
  buscarUltimaManutencao,
  manutencaoVencida,
  horaAtual,
  Rota,
  ItemRota,
  Ocorrencia,
  TipoOcorrencia,
  TIPOS_OCORRENCIA,
} from "@/lib/db";
import { mensagemCidadeConcluida, mensagemEncerramentoRota, abrirWhatsApp } from "@/lib/whatsapp";

interface ModalOcorrencia {
  idxCidade: number;
  tipo: TipoOcorrencia;
  descricao: string;
  quantidade: string;
}

interface ModalConcluirCidade {
  idx: number;
  hora: string;
  enviarWhatsApp: boolean;
}

const MODAL_VAZIO: ModalOcorrencia = {
  idxCidade: 0,
  tipo: "recusa_cliente",
  descricao: "",
  quantidade: "1",
};

export default function RotaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [rota, setRota] = useState<Rota | null>(null);
  const [abertos, setAbertos] = useState<Set<number>>(new Set([0]));
  const [modalOco, setModalOco] = useState<ModalOcorrencia | null>(null);
  const [modalConcluir, setModalConcluir] = useState<ModalConcluirCidade | null>(null);
  const [kmChegada, setKmChegada] = useState("");
  const [horaChegada, setHoraChegada] = useState(horaAtual());
  const [mostraFinalizacao, setMostraFinalizacao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [consumoMedioVeiculo, setConsumoMedioVeiculo] = useState<number | undefined>(undefined);
  const [alertaManutencaoVeiculo, setAlertaManutencaoVeiculo] = useState(false);
  const [erroKm, setErroKm] = useState("");

  async function carregar() {
    const r = await buscarRota(Number(id));
    if (r) {
      setRota(r);
      const [abs, ultimaMan] = await Promise.all([
        listarAbastecimentosPorVeiculo(r.veiculoId),
        buscarUltimaManutencao(r.veiculoId),
      ]);
      const comConsumo = abs.filter((a) => a.consumoKmL !== undefined).slice(0, 5);
      if (comConsumo.length > 0) {
        const media = comConsumo.reduce((s, a) => s + a.consumoKmL!, 0) / comConsumo.length;
        setConsumoMedioVeiculo(media);
      }
      if (ultimaMan) {
        setAlertaManutencaoVeiculo(manutencaoVencida(ultimaMan, r.kmSaida));
      }
    }
  }

  useEffect(() => { carregar(); }, [id]);

  function toggleAberto(idx: number) {
    setAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(idx)) novo.delete(idx);
      else novo.add(idx);
      return novo;
    });
  }

  function abrirModalConcluir(idx: number, enviarWhatsApp: boolean) {
    setModalConcluir({ idx, hora: horaAtual(), enviarWhatsApp });
  }

  async function confirmarConclusaoCidade() {
    if (!rota || !modalConcluir) return;
    const { idx, hora, enviarWhatsApp } = modalConcluir;
    setSalvando(true);
    try {
      const novosItens = [...rota.itens];
      novosItens[idx] = {
        ...novosItens[idx],
        concluido: true,
        horaConclusao: hora,
      };
      const rotaAtualizada = { ...rota, itens: novosItens };
      await salvarRota(rotaAtualizada);
      setRota(rotaAtualizada);

      if (enviarWhatsApp) {
        const msg = mensagemCidadeConcluida(rotaAtualizada, novosItens[idx]);
        abrirWhatsApp(msg);
      }
      setModalConcluir(null);
    } finally {
      setSalvando(false);
    }
  }

  async function atualizarVolumes(
    idx: number,
    campo: "volumesEntregues" | "volumesDevolvidos",
    valor: string
  ) {
    if (!rota) return;
    const novosItens = [...rota.itens];
    novosItens[idx] = {
      ...novosItens[idx],
      [campo]: valor === "" ? undefined : Number(valor),
    };
    const rotaAtualizada = { ...rota, itens: novosItens };
    setRota(rotaAtualizada);
    await salvarRota(rotaAtualizada);
  }

  async function adicionarOcorrencia() {
    if (!rota || !modalOco) return;
    const novosItens = [...rota.itens];
    const oco: Ocorrencia = {
      id: Date.now().toString(),
      tipo: modalOco.tipo,
      descricao: modalOco.descricao || undefined,
      quantidade: Number(modalOco.quantidade) || 1,
      registradoEm: new Date().toISOString(),
    };
    novosItens[modalOco.idxCidade] = {
      ...novosItens[modalOco.idxCidade],
      ocorrencias: [...(novosItens[modalOco.idxCidade].ocorrencias ?? []), oco],
    };
    const rotaAtualizada = { ...rota, itens: novosItens };
    await salvarRota(rotaAtualizada);
    setRota(rotaAtualizada);
    setModalOco(null);
  }

  async function removerOcorrencia(idxCidade: number, ocoId: string) {
    if (!rota) return;
    const novosItens = [...rota.itens];
    novosItens[idxCidade] = {
      ...novosItens[idxCidade],
      ocorrencias: novosItens[idxCidade].ocorrencias.filter(
        (o) => o.id !== ocoId
      ),
    };
    const rotaAtualizada = { ...rota, itens: novosItens };
    await salvarRota(rotaAtualizada);
    setRota(rotaAtualizada);
  }

  async function finalizarRota(enviarWhatsApp: boolean) {
    if (!rota) return;
    if (!kmChegada || isNaN(Number(kmChegada)) || Number(kmChegada) <= rota.kmSaida) {
      setErroKm(
        !kmChegada
          ? "Informe o KM de chegada"
          : Number(kmChegada) <= rota.kmSaida
          ? `KM deve ser maior que o de saída (${rota.kmSaida})`
          : "KM inválido"
      );
      return;
    }
    setErroKm("");
    setSalvando(true);
    try {
      const rotaFinalizada: Rota = {
        ...rota,
        status: "concluida",
        horaChegada: horaChegada,
        kmChegada: Number(kmChegada),
      };
      await salvarRota(rotaFinalizada);

      if (enviarWhatsApp) {
        const msg = mensagemEncerramentoRota(rotaFinalizada, consumoMedioVeiculo, alertaManutencaoVeiculo);
        abrirWhatsApp(msg);
      }

      router.push("/historico");
    } finally {
      setSalvando(false);
    }
  }

  if (!rota) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  const todasConcluidas = rota.itens.every((i) => i.concluido);
  const totalVolumes = rota.itens.reduce((s, i) => s + i.volumesSaida, 0);
  const totalConcluidas = rota.itens.filter((i) => i.concluido).length;
  const totalDevolucoes = rota.itens.reduce(
    (s, i) => s + (i.volumesDevolvidos ?? 0),
    0
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        titulo={`Rota — ${rota.veiculoPlaca}`}
        voltar="/"
      />

      {/* Resumo */}
      <div className="bg-[#ee4d2d] text-white px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <Truck size={18} />
          <span className="text-sm font-semibold">{rota.motorista}</span>
          <span className="text-white/70 text-sm">· Saiu às {rota.horaSaida}</span>
        </div>
        <div className="flex gap-4 text-sm">
          <span>📦 {totalVolumes} volumes</span>
          <span>✅ {totalConcluidas}/{rota.itens.length} cidades</span>
          {totalDevolucoes > 0 && <span>↩️ {totalDevolucoes} dev.</span>}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 pb-24">
        {/* Itens de rota */}
        {rota.itens.map((item: ItemRota, idx: number) => (
          <div
            key={idx}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${
              item.concluido ? "border-green-500" : "border-gray-200"
            }`}
          >
            {/* Cabeçalho da cidade */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50"
              onClick={() => toggleAberto(idx)}
            >
              <div
                className={`rounded-full p-1.5 ${
                  item.concluido ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <CheckCircle2
                  size={18}
                  className={item.concluido ? "text-green-600" : "text-gray-400"}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-800">{item.cidadeNome}</p>
                <p className="text-xs text-gray-500">
                  {item.entregadorNome} · {item.volumesSaida} vol.
                  {item.concluido && item.horaConclusao
                    ? ` · ✅ ${item.horaConclusao}`
                    : ""}
                </p>
              </div>
              {abertos.has(idx) ? (
                <ChevronUp size={18} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} className="text-gray-400" />
              )}
            </button>

            {/* Detalhes expandidos */}
            {abertos.has(idx) && (
              <div className="px-4 pb-4 flex flex-col gap-3 border-t border-gray-100">
                {/* Volumes */}
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                      Entregues
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={item.volumesSaida}
                      value={item.volumesEntregues ?? ""}
                      onChange={(e) =>
                        atualizarVolumes(idx, "volumesEntregues", e.target.value)
                      }
                      disabled={item.concluido}
                      placeholder={String(item.volumesSaida)}
                      className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                      Devolvidos
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={item.volumesSaida}
                      value={item.volumesDevolvidos ?? ""}
                      onChange={(e) =>
                        atualizarVolumes(idx, "volumesDevolvidos", e.target.value)
                      }
                      disabled={item.concluido}
                      placeholder="0"
                      className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                </div>

                {/* Ocorrências */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="text-xs font-semibold text-gray-600">
                        Ocorrências ({item.ocorrencias?.length ?? 0})
                      </span>
                    </div>
                    {!item.concluido && (
                      <button
                        onClick={() =>
                          setModalOco({ ...MODAL_VAZIO, idxCidade: idx })
                        }
                        className="flex items-center gap-1 text-amber-600 text-xs font-semibold active:opacity-70"
                      >
                        <Plus size={13} /> Registrar
                      </button>
                    )}
                  </div>
                  {(item.ocorrencias ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">
                      Nenhuma ocorrência
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {item.ocorrencias.map((oco) => (
                        <div
                          key={oco.id}
                          className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-1.5"
                        >
                          <Package size={13} className="text-amber-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amber-800">
                              {TIPOS_OCORRENCIA[oco.tipo]} ({oco.quantidade}x)
                            </p>
                            {oco.descricao && (
                              <p className="text-xs text-amber-600 truncate">
                                {oco.descricao}
                              </p>
                            )}
                          </div>
                          {!item.concluido && (
                            <button
                              onClick={() => removerOcorrencia(idx, oco.id)}
                              className="text-amber-400 active:text-red-500 text-xs shrink-0"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botões de conclusão */}
                {!item.concluido && (
                  <div className="flex gap-2">
                    <Btn
                      variante="whatsapp"
                      fullWidth
                      onClick={() => abrirModalConcluir(idx, true)}
                      disabled={salvando}
                    >
                      <MessageCircle size={16} />
                      Concluir + WhatsApp
                    </Btn>
                    <Btn
                      variante="secundario"
                      onClick={() => abrirModalConcluir(idx, false)}
                      disabled={salvando}
                    >
                      ✓
                    </Btn>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Finalizar rota */}
        {todasConcluidas && rota.status === "em_andamento" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Flag size={20} className="text-green-600" />
              <p className="font-bold text-green-800">Todas as cidades concluídas!</p>
            </div>
            {mostraFinalizacao ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="KM chegada *"
                    type="number"
                    value={kmChegada}
                    onChange={(e) => { setKmChegada(e.target.value); setErroKm(""); }}
                    placeholder={`Saída: ${rota.kmSaida}`}
                    erro={erroKm}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Clock size={13} /> Hora chegada
                    </label>
                    <input
                      type="time"
                      value={horaChegada}
                      onChange={(e) => setHoraChegada(e.target.value)}
                      className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-400">Edite se o horário não for agora</p>
                  </div>
                </div>
                <Btn
                  variante="whatsapp"
                  fullWidth
                  tamanho="lg"
                  onClick={() => finalizarRota(true)}
                  disabled={salvando}
                >
                  <MessageCircle size={18} />
                  Encerrar e Enviar Resumo no WhatsApp
                </Btn>
                <div className="flex gap-2">
                  <Btn
                    variante="secundario"
                    fullWidth
                    onClick={() => setMostraFinalizacao(false)}
                  >
                    Cancelar
                  </Btn>
                  <Btn fullWidth onClick={() => finalizarRota(false)} disabled={salvando}>
                    Encerrar sem avisar
                  </Btn>
                </div>
              </>
            ) : (
              <Btn
                fullWidth
                tamanho="lg"
                onClick={() => setMostraFinalizacao(true)}
              >
                Encerrar rota
              </Btn>
            )}
          </div>
        )}
      </div>

      {/* Modal Concluir Cidade (com hora editável) */}
      {modalConcluir && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-end"
          onClick={(e) => { if (e.target === e.currentTarget) setModalConcluir(null); }}
        >
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Confirmar Conclusão</h3>
              <button
                onClick={() => setModalConcluir(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                Cidade:{" "}
                <span className="font-bold text-gray-800">
                  {rota.itens[modalConcluir.idx].cidadeNome}
                </span>
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Clock size={13} /> Hora de conclusão
                </label>
                <input
                  type="time"
                  value={modalConcluir.hora}
                  onChange={(e) =>
                    setModalConcluir({ ...modalConcluir, hora: e.target.value })
                  }
                  className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d]"
                />
                <p className="text-xs text-gray-400">
                  Ajuste se o horário real foi diferente
                </p>
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <Btn variante="secundario" fullWidth onClick={() => setModalConcluir(null)}>
                Cancelar
              </Btn>
              <Btn
                fullWidth
                variante={modalConcluir.enviarWhatsApp ? "whatsapp" : "primario"}
                onClick={confirmarConclusaoCidade}
                disabled={salvando}
              >
                {modalConcluir.enviarWhatsApp ? (
                  <>
                    <MessageCircle size={15} /> Concluir + WA
                  </>
                ) : (
                  "Confirmar"
                )}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ocorrência */}
      {modalOco && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-end"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOco(null); }}
        >
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl flex flex-col max-h-[90vh]">
            {/* Cabeçalho fixo */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-800">Nova Ocorrência</h3>
              <button
                onClick={() => setModalOco(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                Cidade:{" "}
                <span className="font-bold text-gray-800">
                  {rota.itens[modalOco.idxCidade].cidadeNome}
                </span>
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Tipo *</label>
                <select
                  value={modalOco.tipo}
                  onChange={(e) =>
                    setModalOco({ ...modalOco, tipo: e.target.value as TipoOcorrencia })
                  }
                  className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d]"
                >
                  {Object.entries(TIPOS_OCORRENCIA).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Quantidade *"
                type="number"
                min="1"
                value={modalOco.quantidade}
                onChange={(e) =>
                  setModalOco({ ...modalOco, quantidade: e.target.value })
                }
              />

              <Input
                label="Observação (opcional)"
                value={modalOco.descricao}
                onChange={(e) =>
                  setModalOco({ ...modalOco, descricao: e.target.value })
                }
                placeholder="Detalhes da ocorrência..."
              />
            </div>

            {/* Botões fixos no rodapé — sempre visíveis */}
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100 shrink-0 bg-white">
              <Btn
                variante="secundario"
                fullWidth
                onClick={() => setModalOco(null)}
              >
                Cancelar
              </Btn>
              <Btn fullWidth onClick={adicionarOcorrencia}>
                Registrar
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
