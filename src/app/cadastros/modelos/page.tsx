"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, MapPin, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Btn from "@/components/Btn";
import Input from "@/components/Input";
import {
  listarRotasModelo,
  salvarRotaModelo,
  deletarRotaModelo,
  listarVeiculos,
  listarCidades,
  listarEntregadores,
  RotaModelo,
  ItemRotaModelo,
  Veiculo,
  Cidade,
  Entregador,
} from "@/lib/db";

interface ItemForm {
  cidadeId: string;
  entregadorId: string;
}

const ITEM_VAZIO: ItemForm = { cidadeId: "", entregadorId: "" };

interface FormState {
  nome: string;
  descricao: string;
  veiculoId: string;
  itens: ItemForm[];
}

const FORM_VAZIO: FormState = {
  nome: "",
  descricao: "",
  veiculoId: "",
  itens: [{ ...ITEM_VAZIO }],
};

export default function ModelosPage() {
  const [modelos, setModelos] = useState<RotaModelo[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [abertos, setAbertos] = useState<Set<number>>(new Set());
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const [ms, vs, cs, es] = await Promise.all([
      listarRotasModelo(),
      listarVeiculos(),
      listarCidades(),
      listarEntregadores(),
    ]);
    setModelos(ms);
    setVeiculos(vs.filter((v) => v.ativo));
    setCidades(cs);
    setEntregadores(es.filter((e) => e.ativo));
  }

  useEffect(() => { carregar(); }, []);

  function toggleAberto(id: number) {
    setAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function entregadoresDaCidade(cidadeId: string): Entregador[] {
    if (!cidadeId) return entregadores;
    const cid = Number(cidadeId);
    const filtrados = entregadores.filter((e) => e.cidadesIds.includes(cid));
    return filtrados.length > 0 ? filtrados : entregadores;
  }

  function adicionarItem() {
    setForm((f) => ({ ...f, itens: [...f.itens, { ...ITEM_VAZIO }] }));
  }

  function removerItem(idx: number) {
    setForm((f) => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }));
  }

  function atualizarItem(idx: number, campo: keyof ItemForm, valor: string) {
    setForm((f) => {
      const itens = [...f.itens];
      itens[idx] = { ...itens[idx], [campo]: valor };
      return { ...f, itens };
    });
  }

  function validar(): boolean {
    const novosErros: Record<string, string> = {};
    if (!form.nome.trim()) novosErros.nome = "Informe o nome do modelo";
    if (!form.veiculoId) novosErros.veiculo = "Selecione o veículo";
    form.itens.forEach((it, idx) => {
      if (!it.cidadeId) novosErros[`cidade_${idx}`] = "Selecione a cidade";
      if (!it.entregadorId) novosErros[`entregador_${idx}`] = "Selecione o entregador";
    });
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function salvar() {
    if (!validar()) return;
    setSalvando(true);
    try {
      const veiculo = veiculos.find((v) => String(v.id) === form.veiculoId)!;
      const itensModelo: ItemRotaModelo[] = form.itens.map((it) => {
        const cidade = cidades.find((c) => String(c.id) === it.cidadeId)!;
        const entregador = entregadores.find((e) => String(e.id) === it.entregadorId)!;
        return {
          cidadeId: Number(it.cidadeId),
          cidadeNome: cidade.nome,
          entregadorId: Number(it.entregadorId),
          entregadorNome: entregador.nome,
        };
      });
      const modelo: RotaModelo = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || undefined,
        veiculoId: Number(form.veiculoId),
        veiculoPlaca: veiculo.placa,
        itens: itensModelo,
        criadoEm: new Date().toISOString(),
      };
      await salvarRotaModelo(modelo);
      setForm(FORM_VAZIO);
      setMostrarForm(false);
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function deletar(id: number) {
    await deletarRotaModelo(id);
    await carregar();
  }

  return (
    <div className="flex flex-col pb-24">
      <PageHeader titulo="Rotas Modelo" voltar="/cadastros/cidades" />

      <div className="flex flex-col gap-4 p-4">
        {/* Botão novo modelo */}
        <Btn
          variante="primario"
          fullWidth
          onClick={() => { setMostrarForm(!mostrarForm); setForm(FORM_VAZIO); setErros({}); }}
        >
          <Plus size={16} /> Novo Modelo
        </Btn>

        {/* Formulário */}
        {mostrarForm && (
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-700">Novo Modelo de Rota</h2>

            <Input
              label="Nome do modelo *"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Rota Norte, Segunda-feira..."
              erro={erros.nome}
            />

            <Input
              label="Descrição (opcional)"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Observações sobre esta rota..."
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Veículo padrão *</label>
              <select
                value={form.veiculoId}
                onChange={(e) => setForm((f) => ({ ...f, veiculoId: e.target.value }))}
                className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d] ${
                  erros.veiculo ? "border-red-400" : "border-gray-300"
                }`}
              >
                <option value="">Selecione o veículo</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} — {v.modelo}
                  </option>
                ))}
              </select>
              {erros.veiculo && <p className="text-xs text-red-500">{erros.veiculo}</p>}
            </div>

            {/* Paradas */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Paradas</h3>
                <button
                  onClick={adicionarItem}
                  className="flex items-center gap-1 text-[#ee4d2d] text-xs font-semibold active:opacity-70"
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>

              {form.itens.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#ee4d2d]" />
                      <span className="text-xs font-semibold text-gray-700">Parada {idx + 1}</span>
                    </div>
                    {form.itens.length > 1 && (
                      <button onClick={() => removerItem(idx)} className="text-red-400 active:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Cidade *</label>
                    <select
                      value={item.cidadeId}
                      onChange={(e) => atualizarItem(idx, "cidadeId", e.target.value)}
                      className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d] ${
                        erros[`cidade_${idx}`] ? "border-red-400" : "border-gray-300"
                      }`}
                    >
                      <option value="">Selecione a cidade</option>
                      {cidades.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} — {c.uf}
                        </option>
                      ))}
                    </select>
                    {erros[`cidade_${idx}`] && (
                      <p className="text-xs text-red-500">{erros[`cidade_${idx}`]}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Entregador padrão *</label>
                    <select
                      value={item.entregadorId}
                      onChange={(e) => atualizarItem(idx, "entregadorId", e.target.value)}
                      className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d] ${
                        erros[`entregador_${idx}`] ? "border-red-400" : "border-gray-300"
                      }`}
                    >
                      <option value="">Selecione o entregador</option>
                      {entregadoresDaCidade(item.cidadeId).map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nome}
                        </option>
                      ))}
                    </select>
                    {erros[`entregador_${idx}`] && (
                      <p className="text-xs text-red-500">{erros[`entregador_${idx}`]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Btn variante="secundario" fullWidth onClick={() => setMostrarForm(false)}>
                Cancelar
              </Btn>
              <Btn fullWidth onClick={salvar} disabled={salvando}>
                Salvar Modelo
              </Btn>
            </div>
          </div>
        )}

        {/* Lista de modelos */}
        {modelos.length === 0 && !mostrarForm && (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={44} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum modelo cadastrado</p>
            <p className="text-sm">Crie modelos para agilizar a criação de rotas</p>
          </div>
        )}

        {modelos.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50"
              onClick={() => toggleAberto(m.id!)}
            >
              <div className="bg-orange-100 rounded-full p-1.5">
                <BookOpen size={16} className="text-[#ee4d2d]" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-800">{m.nome}</p>
                <p className="text-xs text-gray-500">
                  {m.veiculoPlaca} · {m.itens.length} parada(s)
                  {m.descricao ? ` · ${m.descricao}` : ""}
                </p>
              </div>
              {abertos.has(m.id!) ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </button>

            {abertos.has(m.id!) && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="flex flex-col gap-1.5 pt-3">
                  {m.itens.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <MapPin size={13} className="text-[#ee4d2d] shrink-0" />
                      <span className="text-gray-700">{it.cidadeNome}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-600">{it.entregadorNome}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => deletar(m.id!)}
                    className="flex items-center gap-1 text-xs text-red-500 active:text-red-700 font-semibold"
                  >
                    <Trash2 size={13} /> Excluir modelo
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
