"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Car } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Btn from "@/components/Btn";
import Input from "@/components/Input";
import {
  listarVeiculos,
  salvarVeiculo,
  deletarVeiculo,
  Veiculo,
} from "@/lib/db";

const VAZIO: Omit<Veiculo, "id" | "criadoEm"> = {
  placa: "",
  modelo: "",
  motoristaPadrao: "",
  ativo: true,
};

export default function VeiculosPage() {
  const [lista, setLista] = useState<Veiculo[]>([]);
  const [form, setForm] = useState<Omit<Veiculo, "id" | "criadoEm">>(VAZIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostraForm, setMostraForm] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  async function carregar() {
    setLista(await listarVeiculos());
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setForm(VAZIO);
    setEditandoId(null);
    setErros({});
    setMostraForm(true);
  }

  function abrirEditar(v: Veiculo) {
    setForm({
      placa: v.placa,
      modelo: v.modelo,
      motoristaPadrao: v.motoristaPadrao ?? "",
      ativo: v.ativo,
    });
    setEditandoId(v.id!);
    setErros({});
    setMostraForm(true);
  }

  async function salvar() {
    const novosErros: Record<string, string> = {};
    if (!form.placa.trim()) novosErros.placa = "Informe a placa";
    if (!form.modelo.trim()) novosErros.modelo = "Informe o modelo";
    if (Object.keys(novosErros).length) { setErros(novosErros); return; }

    await salvarVeiculo({
      ...form,
      placa: form.placa.toUpperCase(),
      ...(editandoId ? { id: editandoId, criadoEm: "" } : {}),
    } as Veiculo);
    setMostraForm(false);
    carregar();
  }

  async function excluir(id: number) {
    if (!confirm("Excluir este veículo?")) return;
    await deletarVeiculo(id);
    carregar();
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        titulo="Veículos"
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
            {editandoId ? "Editar Veículo" : "Novo Veículo"}
          </h2>
          <Input
            label="Placa *"
            value={form.placa}
            onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
            placeholder="Ex: ABC-1234"
            erro={erros.placa}
            style={{ textTransform: "uppercase" }}
          />
          <Input
            label="Modelo *"
            value={form.modelo}
            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            placeholder="Ex: Fiat Strada"
            erro={erros.modelo}
          />
          <Input
            label="Motorista padrão"
            value={form.motoristaPadrao ?? ""}
            onChange={(e) => setForm({ ...form, motoristaPadrao: e.target.value })}
            placeholder="Nome do motorista"
          />
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
            <Car size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum veículo cadastrado</p>
            <p className="text-sm">Toque no + para adicionar</p>
          </div>
        )}
        {lista.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3"
          >
            <div className={`rounded-full p-2 ${v.ativo ? "bg-blue-100" : "bg-gray-100"}`}>
              <Car size={18} className={v.ativo ? "text-blue-600" : "text-gray-400"} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 tracking-wide">{v.placa}</p>
              <p className="text-sm text-gray-600">{v.modelo}</p>
              {v.motoristaPadrao && (
                <p className="text-xs text-gray-400">{v.motoristaPadrao}</p>
              )}
              {!v.ativo && (
                <span className="text-xs text-gray-400 italic">Inativo</span>
              )}
            </div>
            <button
              onClick={() => abrirEditar(v)}
              className="p-2 text-gray-400 active:text-gray-600"
            >
              <Pencil size={17} />
            </button>
            <button
              onClick={() => excluir(v.id!)}
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
