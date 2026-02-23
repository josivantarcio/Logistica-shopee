"use client";

import { useEffect, useState, use } from "react";
import { MessageCircle, Plus, Trash2, Share2, Wrench, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Btn from "@/components/Btn";
import Input from "@/components/Input";
import {
  buscarVeiculo,
  listarManutencoesPorVeiculo,
  salvarManutencao,
  deletarManutencao,
  manutencaoVencida,
  dataHojeISO,
  Veiculo,
  Manutencao,
  ItemSubstituido,
  ITENS_SUBSTITUIDOS_LABELS,
} from "@/lib/db";
import { mensagemManutencao, mensagemRelatorioManutencoes, abrirWhatsApp } from "@/lib/whatsapp";

const TODOS_ITENS = Object.entries(ITENS_SUBSTITUIDOS_LABELS) as [ItemSubstituido, string][];

const FORM_VAZIO = {
  data: dataHojeISO(),
  kmAtual: "",
  tipoOleo: "",
  itensSubstituidos: [] as ItemSubstituido[],
  proximaTrocaKm: "",
  proximaTrocaData: "",
  observacao: "",
};

export default function ManutencoesPage({
  params,
}: {
  params: Promise<{ veiculoId: string }>;
}) {
  const { veiculoId } = use(params);
  const vidNum = Number(veiculoId);

  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [lista, setLista] = useState<Manutencao[]>([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [mostraForm, setMostraForm] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const [v, mans] = await Promise.all([
      buscarVeiculo(vidNum),
      listarManutencoesPorVeiculo(vidNum),
    ]);
    setVeiculo(v ?? null);
    setLista(mans);
  }

  useEffect(() => { carregar(); }, [vidNum]);

  function abrirNovo() {
    setForm({ ...FORM_VAZIO, data: dataHojeISO() });
    setErros({});
    setMostraForm(true);
  }

  function toggleItem(item: ItemSubstituido) {
    setForm((f) => ({
      ...f,
      itensSubstituidos: f.itensSubstituidos.includes(item)
        ? f.itensSubstituidos.filter((i) => i !== item)
        : [...f.itensSubstituidos, item],
    }));
  }

  async function salvar() {
    const novosErros: Record<string, string> = {};
    if (!form.kmAtual || isNaN(Number(form.kmAtual))) novosErros.kmAtual = "Informe o KM atual";
    if (!form.tipoOleo.trim()) novosErros.tipoOleo = "Informe o tipo de óleo";
    if (form.itensSubstituidos.length === 0) novosErros.itens = "Selecione ao menos um item";
    if (!form.data) novosErros.data = "Informe a data";

    if (Object.keys(novosErros).length) { setErros(novosErros); return; }

    setSalvando(true);
    try {
      await salvarManutencao({
        veiculoId: vidNum,
        veiculoPlaca: veiculo?.placa ?? "",
        data: form.data,
        kmAtual: Number(form.kmAtual),
        tipoOleo: form.tipoOleo,
        itensSubstituidos: form.itensSubstituidos,
        proximaTrocaKm: form.proximaTrocaKm ? Number(form.proximaTrocaKm) : undefined,
        proximaTrocaData: form.proximaTrocaData || undefined,
        observacao: form.observacao || undefined,
        criadoEm: new Date().toISOString(),
      });
      setMostraForm(false);
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: number) {
    if (!confirm("Excluir esta manutenção?")) return;
    await deletarManutencao(id);
    carregar();
  }

  function compartilharHistorico() {
    if (!veiculo) return;
    const msg = mensagemRelatorioManutencoes(veiculo, lista);
    abrirWhatsApp(msg);
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        titulo={`Manutenções — ${veiculo?.placa ?? "..."}`}
        voltar={`/manutencao`}
        acao={
          <button onClick={abrirNovo} className="p-1 rounded-full active:bg-white/20">
            <Plus size={24} />
          </button>
        }
      />

      {/* Formulário */}
      {mostraForm && (
        <div className="m-4 bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800">Nova Manutenção</h2>
          <Input
            label="Data *"
            type="date"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            erro={erros.data}
          />
          <Input
            label="KM atual *"
            type="number"
            value={form.kmAtual}
            onChange={(e) => setForm({ ...form, kmAtual: e.target.value })}
            placeholder={lista.length > 0 ? `Último: ${lista[0].kmAtual}` : "Ex: 45000"}
            erro={erros.kmAtual}
          />
          <Input
            label="Tipo de óleo *"
            value={form.tipoOleo}
            onChange={(e) => setForm({ ...form, tipoOleo: e.target.value })}
            placeholder="Ex: Shell 5W30"
            erro={erros.tipoOleo}
          />

          {/* Itens substituídos */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Itens substituídos *</label>
            {erros.itens && <p className="text-xs text-red-500">{erros.itens}</p>}
            <div className="grid grid-cols-1 gap-1.5">
              {TODOS_ITENS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={form.itensSubstituidos.includes(key)}
                    onChange={() => toggleItem(key)}
                    className="w-4 h-4 accent-[#ee4d2d]"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Próxima troca */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Próx. troca (KM)"
              type="number"
              value={form.proximaTrocaKm}
              onChange={(e) => setForm({ ...form, proximaTrocaKm: e.target.value })}
              placeholder="Ex: 50000"
            />
            <Input
              label="Próx. troca (data)"
              type="date"
              value={form.proximaTrocaData}
              onChange={(e) => setForm({ ...form, proximaTrocaData: e.target.value })}
            />
          </div>

          <Input
            label="Observação (opcional)"
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            placeholder="Observações..."
          />
          <div className="flex gap-2">
            <Btn variante="secundario" fullWidth onClick={() => setMostraForm(false)}>
              Cancelar
            </Btn>
            <Btn fullWidth onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Adicionar"}
            </Btn>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-2 p-4">
        {lista.length === 0 && !mostraForm && (
          <div className="text-center py-12 text-gray-400">
            <Wrench size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma manutenção registrada</p>
            <p className="text-sm">Toque no + para adicionar</p>
          </div>
        )}

        {lista.length > 0 && (
          <button
            onClick={compartilharHistorico}
            className="flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold text-sm py-2.5 rounded-xl border border-green-200 active:bg-green-100 mb-1"
          >
            <Share2 size={15} />
            Compartilhar histórico no WhatsApp
          </button>
        )}

        {lista.map((m) => {
          const vencida = manutencaoVencida(m, veiculo?.kmAtual ?? m.kmAtual);
          return (
            <div
              key={m.id}
              className={`bg-white rounded-2xl shadow-sm px-4 py-3 border-l-4 ${
                vencida ? "border-red-500" : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-2 shrink-0 ${vencida ? "bg-red-100" : "bg-orange-100"}`}>
                  <Wrench size={16} className={vencida ? "text-red-500" : "text-orange-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-sm">
                        {m.data.split("-").reverse().join("/")} · KM {m.kmAtual.toLocaleString("pt-BR")}
                      </p>
                      {vencida && (
                        <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <AlertTriangle size={8} /> VENCIDA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => veiculo && abrirWhatsApp(mensagemManutencao(m, veiculo))}
                        className="p-1.5 text-green-600 active:opacity-70"
                      >
                        <MessageCircle size={15} />
                      </button>
                      <button
                        onClick={() => excluir(m.id!)}
                        className="p-1.5 text-red-400 active:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">🛢️ {m.tipoOleo}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {m.itensSubstituidos.map((i) => ITENS_SUBSTITUIDOS_LABELS[i]).join(", ")}
                  </p>
                  {(m.proximaTrocaKm || m.proximaTrocaData) && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      ⏰ Próx. troca:
                      {m.proximaTrocaKm ? ` KM ${m.proximaTrocaKm.toLocaleString("pt-BR")}` : ""}
                      {m.proximaTrocaData
                        ? ` · ${m.proximaTrocaData.split("-").reverse().join("/")}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
