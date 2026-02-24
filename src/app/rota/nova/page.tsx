"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, MapPin, MessageCircle, RotateCcw, BookOpen } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Btn from "@/components/Btn";
import Input from "@/components/Input";
import {
  listarVeiculos,
  listarCidades,
  listarEntregadores,
  listarRotasModelo,
  salvarRota,
  horaAtual,
  dataHojeISO,
  Veiculo,
  Cidade,
  Entregador,
  ItemRota,
  Rota,
  RotaModelo,
} from "@/lib/db";
import { mensagemSaidaRota, abrirWhatsApp } from "@/lib/whatsapp";

interface ItemFormulario {
  cidadeId: string;
  entregadorId: string;
  volumesSaida: string;
}

const ITEM_VAZIO: ItemFormulario = {
  cidadeId: "",
  entregadorId: "",
  volumesSaida: "",
};

const RASCUNHO_KEY = "nova-rota-rascunho";

interface Rascunho {
  veiculoId: string;
  motorista: string;
  kmSaida: string;
  horaSaida: string;
  itens: ItemFormulario[];
  savedAt: string;
}

export default function NovaRotaPage() {
  const router = useRouter();

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [modelos, setModelos] = useState<RotaModelo[]>([]);

  const [veiculoId, setVeiculoId] = useState("");
  const [motorista, setMotorista] = useState("");
  const [kmSaida, setKmSaida] = useState("");
  const [horaSaida, setHoraSaida] = useState(horaAtual());
  const [itens, setItens] = useState<ItemFormulario[]>([{ ...ITEM_VAZIO }]);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [temRascunho, setTemRascunho] = useState(false);
  const [mostrarModelos, setMostrarModelos] = useState(false);
  const carregadoRef = useRef(false);

  useEffect(() => {
    async function carregar() {
      const [vs, cs, es, ms] = await Promise.all([
        listarVeiculos(),
        listarCidades(),
        listarEntregadores(),
        listarRotasModelo(),
      ]);
      setVeiculos(vs.filter((v) => v.ativo));
      setCidades(cs);
      setEntregadores(es.filter((e) => e.ativo));
      setModelos(ms);

      // Restaurar rascunho
      const raw = localStorage.getItem(RASCUNHO_KEY);
      if (raw) {
        try {
          const rascunho: Rascunho = JSON.parse(raw);
          setVeiculoId(rascunho.veiculoId || "");
          setMotorista(rascunho.motorista || "");
          setKmSaida(rascunho.kmSaida || "");
          setHoraSaida(rascunho.horaSaida || horaAtual());
          setItens(rascunho.itens?.length ? rascunho.itens : [{ ...ITEM_VAZIO }]);
          setTemRascunho(true);
        } catch {
          localStorage.removeItem(RASCUNHO_KEY);
        }
      }
      carregadoRef.current = true;
    }
    carregar();
  }, []);

  // Salvar rascunho automaticamente quando o formulário muda
  useEffect(() => {
    if (!carregadoRef.current) return;
    const rascunho: Rascunho = {
      veiculoId,
      motorista,
      kmSaida,
      horaSaida,
      itens,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(RASCUNHO_KEY, JSON.stringify(rascunho));
  }, [veiculoId, motorista, kmSaida, horaSaida, itens]);

  function descartarRascunho() {
    localStorage.removeItem(RASCUNHO_KEY);
    setTemRascunho(false);
    setVeiculoId("");
    setMotorista("");
    setKmSaida("");
    setHoraSaida(horaAtual());
    setItens([{ ...ITEM_VAZIO }]);
    setErros({});
  }

  function aplicarModelo(modelo: RotaModelo) {
    setVeiculoId(String(modelo.veiculoId));
    // preenche motorista padrão do veículo se disponível
    const v = veiculos.find((vv) => vv.id === modelo.veiculoId);
    if (v?.motoristaPadrao) setMotorista(v.motoristaPadrao);
    setItens(
      modelo.itens.map((it) => ({
        cidadeId: String(it.cidadeId),
        entregadorId: String(it.entregadorId),
        volumesSaida: "",
      }))
    );
    setMostrarModelos(false);
  }

  function selecionarVeiculo(id: string) {
    setVeiculoId(id);
    const v = veiculos.find((v) => String(v.id) === id);
    if (v?.motoristaPadrao) setMotorista(v.motoristaPadrao);
  }

  function adicionarItem() {
    setItens([...itens, { ...ITEM_VAZIO }]);
  }

  function removerItem(idx: number) {
    setItens(itens.filter((_, i) => i !== idx));
  }

  function atualizarItem(idx: number, campo: keyof ItemFormulario, valor: string) {
    const novo = [...itens];
    novo[idx] = { ...novo[idx], [campo]: valor };
    setItens(novo);
  }

  function entregadoresDaCidade(cidadeId: string): Entregador[] {
    if (!cidadeId) return entregadores;
    const cid = Number(cidadeId);
    const filtrados = entregadores.filter((e) => e.cidadesIds.includes(cid));
    return filtrados.length > 0 ? filtrados : entregadores;
  }

  function validar(): boolean {
    const novosErros: Record<string, string> = {};
    if (!veiculoId) novosErros.veiculo = "Selecione o veículo";
    if (!motorista.trim()) novosErros.motorista = "Informe o motorista";
    if (!kmSaida || Number(kmSaida) <= 0) novosErros.km = "Informe o KM de saída";

    itens.forEach((item, idx) => {
      if (!item.cidadeId) novosErros[`cidade_${idx}`] = "Selecione a cidade";
      if (!item.entregadorId) novosErros[`entregador_${idx}`] = "Selecione o entregador";
      if (!item.volumesSaida || Number(item.volumesSaida) <= 0)
        novosErros[`volumes_${idx}`] = "Informe os volumes";
    });

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function iniciarRota(enviarWhatsApp: boolean) {
    if (!validar()) return;
    setSalvando(true);

    try {
      const veiculo = veiculos.find((v) => String(v.id) === veiculoId)!;

      const itensRota: ItemRota[] = itens.map((item) => {
        const cidade = cidades.find((c) => String(c.id) === item.cidadeId)!;
        const entregador = entregadores.find(
          (e) => String(e.id) === item.entregadorId
        )!;
        return {
          cidadeId: Number(item.cidadeId),
          cidadeNome: cidade.nome,
          entregadorId: Number(item.entregadorId),
          entregadorNome: entregador.nome,
          volumesSaida: Number(item.volumesSaida),
          concluido: false,
          ocorrencias: [],
        };
      });

      const rota: Rota = {
        data: dataHojeISO(),
        veiculoId: Number(veiculoId),
        veiculoPlaca: veiculo.placa,
        motorista,
        kmSaida: Number(kmSaida),
        horaSaida,
        status: "em_andamento",
        itens: itensRota,
        criadoEm: new Date().toISOString(),
      };

      const id = await salvarRota(rota);

      // Limpar rascunho após salvar com sucesso
      localStorage.removeItem(RASCUNHO_KEY);

      if (enviarWhatsApp) {
        const rotaSalva = { ...rota, id };
        const msg = mensagemSaidaRota(rotaSalva);
        abrirWhatsApp(msg);
      }

      router.push(`/rota/${id}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col pb-24">
      <PageHeader titulo="Nova Rota" voltar="/" />

      <div className="flex flex-col gap-4 p-4">
        {/* Banner rascunho recuperado */}
        {temRascunho && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-amber-800">Rascunho recuperado</p>
              <p className="text-xs text-amber-600">Suas informações anteriores foram restauradas</p>
            </div>
            <button
              onClick={descartarRascunho}
              className="flex items-center gap-1 text-xs text-amber-700 font-semibold border border-amber-300 rounded-lg px-2 py-1 active:bg-amber-100"
            >
              <RotateCcw size={12} /> Descartar
            </button>
          </div>
        )}

        {/* Botão usar modelo */}
        {modelos.length > 0 && (
          <button
            onClick={() => setMostrarModelos(!mostrarModelos)}
            className="flex items-center gap-2 text-[#ee4d2d] text-sm font-semibold bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 active:opacity-70"
          >
            <BookOpen size={16} />
            Usar rota modelo
          </button>
        )}

        {/* Lista de modelos */}
        {mostrarModelos && (
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
            <p className="text-sm font-semibold text-gray-700 mb-1">Escolha um modelo:</p>
            {modelos.map((m) => (
              <button
                key={m.id}
                onClick={() => aplicarModelo(m)}
                className="text-left border border-gray-200 rounded-xl px-3 py-2.5 active:bg-gray-50"
              >
                <p className="text-sm font-semibold text-gray-800">{m.nome}</p>
                <p className="text-xs text-gray-500">
                  {m.itens.length} parada(s)
                  {m.descricao ? ` · ${m.descricao}` : ""}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Veículo */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-700">Veículo</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Veículo *</label>
            <select
              value={veiculoId}
              onChange={(e) => selecionarVeiculo(e.target.value)}
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
            {erros.veiculo && (
              <p className="text-xs text-red-500">{erros.veiculo}</p>
            )}
          </div>

          <Input
            label="Motorista *"
            value={motorista}
            onChange={(e) => setMotorista(e.target.value)}
            placeholder="Nome do motorista"
            erro={erros.motorista}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="KM saída *"
              type="number"
              value={kmSaida}
              onChange={(e) => setKmSaida(e.target.value)}
              placeholder="Ex: 45230"
              erro={erros.km}
            />
            <Input
              label="Hora saída"
              type="time"
              value={horaSaida}
              onChange={(e) => setHoraSaida(e.target.value)}
            />
          </div>
        </div>

        {/* Cidades da rota */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Cidades da Rota</h2>
            <button
              onClick={adicionarItem}
              className="flex items-center gap-1 text-[#ee4d2d] text-sm font-semibold active:opacity-70"
            >
              <Plus size={16} /> Adicionar
            </button>
          </div>

          {itens.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-[#ee4d2d]" />
                  <span className="text-sm font-semibold text-gray-700">
                    Parada {idx + 1}
                  </span>
                </div>
                {itens.length > 1 && (
                  <button
                    onClick={() => removerItem(idx)}
                    className="text-red-400 active:text-red-600"
                  >
                    <Trash2 size={16} />
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
                <label className="text-xs font-medium text-gray-600">Entregador *</label>
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

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Volumes *</label>
                <input
                  type="number"
                  min="1"
                  value={item.volumesSaida}
                  onChange={(e) => atualizarItem(idx, "volumesSaida", e.target.value)}
                  placeholder="Qtd de volumes"
                  className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/40 focus:border-[#ee4d2d] ${
                    erros[`volumes_${idx}`] ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {erros[`volumes_${idx}`] && (
                  <p className="text-xs text-red-500">{erros[`volumes_${idx}`]}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botões */}
        <Btn
          variante="whatsapp"
          fullWidth
          tamanho="lg"
          onClick={() => iniciarRota(true)}
          disabled={salvando}
        >
          <MessageCircle size={20} />
          Iniciar e Avisar no WhatsApp
        </Btn>
        <Btn
          variante="secundario"
          fullWidth
          onClick={() => iniciarRota(false)}
          disabled={salvando}
        >
          Iniciar sem avisar
        </Btn>
      </div>
    </div>
  );
}
