"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Btn from "@/components/Btn";
import Input from "@/components/Input";
import {
  listarEntregadores,
  salvarEntregador,
  deletarEntregador,
  listarCidades,
  Entregador,
  Cidade,
} from "@/lib/db";

const VAZIO: Omit<Entregador, "id" | "criadoEm"> = {
  nome: "",
  telefone: "",
  cidadesIds: [],
  ativo: true,
};

export default function EntregadoresPage() {
  const [lista, setLista] = useState<Entregador[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [form, setForm] = useState<Omit<Entregador, "id" | "criadoEm">>(VAZIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostraForm, setMostraForm] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  async function carregar() {
    const [ents, cids] = await Promise.all([
      listarEntregadores(),
      listarCidades(),
    ]);
    setLista(ents);
    setCidades(cids);
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setForm(VAZIO);
    setEditandoId(null);
    setErros({});
    setMostraForm(true);
  }

  function abrirEditar(e: Entregador) {
    setForm({
      nome: e.nome,
      telefone: e.telefone,
      cidadesIds: e.cidadesIds,
      ativo: e.ativo,
    });
    setEditandoId(e.id!);
    setErros({});
    setMostraForm(true);
  }

  async function salvar() {
    const novosErros: Record<string, string> = {};
    if (!form.nome.trim()) novosErros.nome = "Informe o nome";
    if (Object.keys(novosErros).length) { setErros(novosErros); return; }

    await salvarEntregador({
      ...form,
      ...(editandoId ? { id: editandoId, criadoEm: "" } : {}),
    } as Entregador);
    setMostraForm(false);
    carregar();
  }

  async function excluir(id: number) {
    if (!confirm("Excluir este entregador?")) return;
    await deletarEntregador(id);
    carregar();
  }

  function toggleCidade(cidadeId: number) {
    setForm((f) => ({
      ...f,
      cidadesIds: f.cidadesIds.includes(cidadeId)
        ? f.cidadesIds.filter((id) => id !== cidadeId)
        : [...f.cidadesIds, cidadeId],
    }));
  }

  function nomeCidade(id: number) {
    return cidades.find((c) => c.id === id)?.nome ?? "?";
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        titulo="Entregadores"
        voltar="/"
        acao={
          <button onClick={abrirNovo} className="p-1 rounded-full active:bg-white/20">
            <Plus size={24} />
          </button>
        }
      />

      {mostraForm && (
        <div className="m-4 bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800">
            {editandoId ? "Editar Entregador" : "Novo Entregador"}
          </h2>
          <Input
            label="Nome *"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome completo"
            erro={erros.nome}
          />
          <Input
            label="WhatsApp (com DDD)"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            placeholder="Ex: 11999998888"
            type="tel"
          />

          {/* Cidades */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Cidades que atende
            </label>
            {cidades.length === 0 ? (
              <p className="text-xs text-gray-400">
                Cadastre cidades primeiro
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {cidades.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCidade(c.id!)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      form.cidadesIds.includes(c.id!)
                        ? "bg-[#ee4d2d] text-white border-[#ee4d2d]"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ativo */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              className="w-4 h-4 accent-[#ee4d2d]"
            />
            <span className="text-sm text-gray-700">Ativo</span>
          </label>

          <div className="flex gap-2">
            <Btn variante="secundario" fullWidth onClick={() => setMostraForm(false)}>
              Cancelar
            </Btn>
            <Btn fullWidth onClick={salvar}>
              {editandoId ? "Salvar" : "Adicionar"}
            </Btn>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 p-4">
        {lista.length === 0 && !mostraForm && (
          <div className="text-center py-12 text-gray-400">
            <User size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum entregador cadastrado</p>
            <p className="text-sm">Toque no + para adicionar</p>
          </div>
        )}
        {lista.map((e) => (
          <div
            key={e.id}
            className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-start gap-3"
          >
            <div
              className={`rounded-full p-2 mt-0.5 ${
                e.ativo ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <User
                size={18}
                className={e.ativo ? "text-green-600" : "text-gray-400"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{e.nome}</p>
              {e.telefone && (
                <p className="text-xs text-gray-500">{e.telefone}</p>
              )}
              {e.cidadesIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {e.cidadesIds.map((cid) => (
                    <span
                      key={cid}
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                    >
                      {nomeCidade(cid)}
                    </span>
                  ))}
                </div>
              )}
              {!e.ativo && (
                <span className="text-xs text-gray-400 italic">Inativo</span>
              )}
            </div>
            <button
              onClick={() => abrirEditar(e)}
              className="p-2 text-gray-400 active:text-gray-600"
            >
              <Pencil size={17} />
            </button>
            <button
              onClick={() => excluir(e.id!)}
              className="p-2 text-red-400 active:text-red-600"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
