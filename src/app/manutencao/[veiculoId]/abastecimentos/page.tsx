"use client";

import { useEffect, useState, use } from "react";
import { MessageCircle, Plus, Trash2, Share2, Fuel } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Btn from "@/components/Btn";
import Input from "@/components/Input";
import {
  buscarVeiculo,
  listarAbastecimentosPorVeiculo,
  salvarAbastecimento,
  deletarAbastecimento,
  dataHojeISO,
  Veiculo,
  Abastecimento,
  TipoCombustivel,
  TIPOS_COMBUSTIVEL,
} from "@/lib/db";
import { mensagemAbastecimento, mensagemRelatorioAbastecimentos, abrirWhatsApp } from "@/lib/whatsapp";

const FORM_VAZIO = {
  data: dataHojeISO(),
  kmAtual: "",
  litros: "",
  valorTotal: "",
  tipoCombustivel: "gasolina" as TipoCombustivel,
  posto: "",
  observacao: "",
};

export default function AbastecimentosPage({
  params,
}: {
  params: Promise<{ veiculoId: string }>;
}) {
  const { veiculoId } = use(params);
  const vidNum = Number(veiculoId);

  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [lista, setLista] = useState<Abastecimento[]>([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [mostraForm, setMostraForm] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [ultimoCalculado, setUltimoCalculado] = useState<Abastecimento | null>(null);

  async function carregar() {
    const [v, abs] = await Promise.all([
      buscarVeiculo(vidNum),
      listarAbastecimentosPorVeiculo(vidNum),
    ]);
    setVeiculo(v ?? null);
    setLista(abs);
  }

  useEffect(() => { carregar(); }, [vidNum]);

  function abrirNovo() {
    setForm({ ...FORM_VAZIO, data: dataHojeISO() });
    setErros({});
    setUltimoCalculado(null);
    setMostraForm(true);
  }

  async function salvar() {
    const novosErros: Record<string, string> = {};
    if (!form.kmAtual || isNaN(Number(form.kmAtual))) novosErros.kmAtual = "Informe o KM atual";
    if (!form.litros || isNaN(Number(form.litros))) novosErros.litros = "Informe os litros";
    if (!form.valorTotal || isNaN(Number(form.valorTotal))) novosErros.valorTotal = "Informe o valor";
    if (!form.data) novosErros.data = "Informe a data";

    if (lista.length > 0) {
      const maiorKm = lista[0].kmAtual;
      if (Number(form.kmAtual) <= maiorKm) {
        novosErros.kmAtual = `KM deve ser maior que o último (${maiorKm})`;
      }
    }

    if (Object.keys(novosErros).length) { setErros(novosErros); return; }

    setSalvando(true);
    try {
      const novoId = await salvarAbastecimento({
        veiculoId: vidNum,
        veiculoPlaca: veiculo?.placa ?? "",
        data: form.data,
        kmAtual: Number(form.kmAtual),
        litros: Number(form.litros),
        valorTotal: Number(form.valorTotal),
        tipoCombustivel: form.tipoCombustivel,
        posto: form.posto || undefined,
        observacao: form.observacao || undefined,
        criadoEm: new Date().toISOString(),
      });

      await carregar();
      setMostraForm(false);

      // Mostra o consumo calculado como feedback
      const novaLista = await listarAbastecimentosPorVeiculo(vidNum);
      const salvo = novaLista.find((a) => a.id === novoId);
      if (salvo?.consumoKmL !== undefined) {
        setUltimoCalculado(salvo);
      }
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: number) {
    if (!confirm("Excluir este abastecimento?")) return;
    await deletarAbastecimento(id);
    carregar();
  }

  function compartilharTodos() {
    if (!veiculo) return;
    const hoje = dataHojeISO();
    const tresAnos = `${Number(hoje.split("-")[0]) - 3}-${hoje.split("-")[1]}-${hoje.split("-")[2]}`;
    const msg = mensagemRelatorioAbastecimentos(veiculo, tresAnos, hoje, lista);
    abrirWhatsApp(msg);
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        titulo={`Abastecimentos — ${veiculo?.placa ?? "..."}`}
        voltar={`/manutencao`}
        acao={
          <button onClick={abrirNovo} className="p-1 rounded-full active:bg-white/20">
            <Plus size={24} />
          </button>
        }
      />

      {/* Feedback de consumo calculado */}
      {ultimoCalculado?.consumoKmL !== undefined && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-green-800">Consumo calculado!</p>
          <p className="text-green-700 text-sm">
            ⚡ {ultimoCalculado.consumoKmL.toFixed(2).replace(".", ",")} km/L
            {ultimoCalculado.custoKm !== undefined &&
              ` · R$ ${ultimoCalculado.custoKm.toFixed(3).replace(".", ",")}/km`}
          </p>
          <button
            className="text-xs text-green-600 font-semibold mt-1 active:opacity-70"
            onClick={() => setUltimoCalculado(null)}
          >
            Fechar
          </button>
        </div>
      )}

      {/* Formulário */}
      {mostraForm && (
        <div className="m-4 bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800">Novo Abastecimento</h2>
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
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Litros *"
              type="number"
              step="0.01"
              value={form.litros}
              onChange={(e) => setForm({ ...form, litros: e.target.value })}
              placeholder="Ex: 40,00"
              erro={erros.litros}
            />
            <Input
              label="Valor total (R$) *"
              type="number"
              step="0.01"
              value={form.valorTotal}
              onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
              placeholder="Ex: 280,00"
              erro={erros.valorTotal}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Combustível *</label>
            <select
              value={form.tipoCombustivel}
              onChange={(e) => setForm({ ...form, tipoCombustivel: e.target.value as TipoCombustivel })}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d]"
            >
              {Object.entries(TIPOS_COMBUSTIVEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <Input
            label="Posto (opcional)"
            value={form.posto}
            onChange={(e) => setForm({ ...form, posto: e.target.value })}
            placeholder="Nome do posto"
          />
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
            <Fuel size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum abastecimento registrado</p>
            <p className="text-sm">Toque no + para adicionar</p>
          </div>
        )}

        {lista.length > 0 && (
          <button
            onClick={compartilharTodos}
            className="flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold text-sm py-2.5 rounded-xl border border-green-200 active:bg-green-100 mb-1"
          >
            <Share2 size={15} />
            Compartilhar histórico no WhatsApp
          </button>
        )}

        {lista.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl shadow-sm px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2 shrink-0">
                <Fuel size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-800 text-sm">
                    {a.data.split("-").reverse().join("/")} · KM {a.kmAtual.toLocaleString("pt-BR")}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => veiculo && abrirWhatsApp(mensagemAbastecimento(a, veiculo))}
                      className="p-1.5 text-green-600 active:opacity-70"
                    >
                      <MessageCircle size={15} />
                    </button>
                    <button
                      onClick={() => excluir(a.id!)}
                      className="p-1.5 text-red-400 active:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {TIPOS_COMBUSTIVEL[a.tipoCombustivel]} · {a.litros.toFixed(2).replace(".", ",")} L · R$ {a.valorTotal.toFixed(2).replace(".", ",")}
                </p>
                {a.posto && <p className="text-xs text-gray-400">{a.posto}</p>}
                {a.consumoKmL !== undefined && (
                  <div className="mt-1.5 flex gap-2">
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      ⚡ {a.consumoKmL.toFixed(2).replace(".", ",")} km/L
                    </span>
                    {a.custoKm !== undefined && (
                      <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        R$ {a.custoKm.toFixed(3).replace(".", ",")}/km
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
