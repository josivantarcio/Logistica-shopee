"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Btn from "@/components/Btn";
import Input from "@/components/Input";
import {
  listarCidades,
  salvarCidade,
  deletarCidade,
  Cidade,
} from "@/lib/db";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const VAZIO: Omit<Cidade, "id" | "criadoEm"> = {
  nome: "",
  uf: "SP",
  distanciaKm: undefined,
};

export default function CidadesPage() {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [form, setForm] = useState<Omit<Cidade, "id" | "criadoEm">>(VAZIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostraForm, setMostraForm] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCidades(await listarCidades());
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setForm(VAZIO);
    setEditandoId(null);
    setErro("");
    setMostraForm(true);
  }

  function abrirEditar(c: Cidade) {
    setForm({ nome: c.nome, uf: c.uf, distanciaKm: c.distanciaKm });
    setEditandoId(c.id!);
    setErro("");
    setMostraForm(true);
  }

  async function salvar() {
    if (!form.nome.trim()) { setErro("Informe o nome da cidade"); return; }
    await salvarCidade({
      ...form,
      ...(editandoId ? { id: editandoId, criadoEm: "" } : {}),
    } as Cidade);
    setMostraForm(false);
    carregar();
  }

  async function excluir(id: number) {
    if (!confirm("Excluir esta cidade?")) return;
    await deletarCidade(id);
    carregar();
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        titulo="Cidades"
        voltar="/"
        acao={
          <button
            onClick={abrirNovo}
            className="p-1 rounded-full active:bg-white/20"
          >
            <Plus size={24} />
          </button>
        }
      />

      {/* Formulário */}
      {mostraForm && (
        <div className="m-4 bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800">
            {editandoId ? "Editar Cidade" : "Nova Cidade"}
          </h2>
          <Input
            label="Nome da cidade *"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex: São Paulo"
            erro={erro}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">UF *</label>
            <select
              value={form.uf}
              onChange={(e) => setForm({ ...form, uf: e.target.value })}
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d]"
            >
              {UFS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <Input
            label="Distância estimada (km)"
            type="number"
            value={form.distanciaKm ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                distanciaKm: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Ex: 150"
          />
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

      {/* Lista */}
      <div className="flex flex-col gap-2 p-4">
        {cidades.length === 0 && !mostraForm && (
          <div className="text-center py-12 text-gray-400">
            <MapPin size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma cidade cadastrada</p>
            <p className="text-sm">Toque no + para adicionar</p>
          </div>
        )}
        {cidades.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3"
          >
            <div className="bg-[#ee4d2d]/10 rounded-full p-2">
              <MapPin size={18} className="text-[#ee4d2d]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{c.nome}</p>
              <p className="text-xs text-gray-500">
                {c.uf}
                {c.distanciaKm ? ` · ${c.distanciaKm} km` : ""}
              </p>
            </div>
            <button
              onClick={() => abrirEditar(c)}
              className="p-2 text-gray-400 active:text-gray-600"
            >
              <Pencil size={17} />
            </button>
            <button
              onClick={() => excluir(c.id!)}
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
