import { openDB, DBSchema, IDBPDatabase } from "idb";

export type TipoOcorrencia =
  | "recusa_cliente"
  | "duplicidade"
  | "nao_localizado"
  | "cliente_ausente"
  | "produto_danificado"
  | "produto_fora_sistema"
  | "rota_errada"
  | "outro";

export type TipoCombustivel = "gasolina" | "etanol" | "diesel" | "gnv";

export type ItemSubstituido =
  | "oleoMotor"
  | "oleoCambio"
  | "oleoDiferencial"
  | "filtroOleo"
  | "filtroAr"
  | "filtroCabine"
  | "filtroCombustivel";

export interface Cidade {
  id?: number;
  nome: string;
  uf: string;
  distanciaKm?: number;
  criadoEm: string;
}

export interface Entregador {
  id?: number;
  nome: string;
  telefone: string;
  cidadesIds: number[];
  ativo: boolean;
  criadoEm: string;
}

export interface Veiculo {
  id?: number;
  placa: string;
  modelo: string;
  motoristaPadrao?: string;
  ativo: boolean;
  kmAtual?: number;
  criadoEm: string;
}

export interface ItemRota {
  cidadeId: number;
  cidadeNome: string;
  entregadorId: number;
  entregadorNome: string;
  volumesSaida: number;
  volumesEntregues?: number;
  volumesDevolvidos?: number;
  horaConclusao?: string;
  concluido: boolean;
  ocorrencias: Ocorrencia[];
}

export interface Ocorrencia {
  id: string;
  tipo: TipoOcorrencia;
  descricao?: string;
  quantidade: number;
  registradoEm: string;
}

export interface Rota {
  id?: number;
  data: string;
  veiculoId: number;
  veiculoPlaca: string;
  motorista: string;
  kmSaida: number;
  kmChegada?: number;
  horaSaida: string;
  horaChegada?: string;
  status: "em_andamento" | "concluida";
  itens: ItemRota[];
  criadoEm: string;
}

export interface ItemRotaModelo {
  cidadeId: number;
  cidadeNome: string;
  entregadorId: number;
  entregadorNome: string;
}

export interface RotaModelo {
  id?: number;
  nome: string;
  descricao?: string;
  veiculoId: number;
  veiculoPlaca: string;
  itens: ItemRotaModelo[];
  criadoEm: string;
}

export interface Abastecimento {
  id?: number;
  veiculoId: number;
  veiculoPlaca: string;
  data: string;
  kmAtual: number;
  litros: number;
  valorTotal: number;
  tipoCombustivel: TipoCombustivel;
  posto?: string;
  observacao?: string;
  kmAnterior?: number;
  consumoKmL?: number;
  custoKm?: number;
  criadoEm: string;
}

export interface Manutencao {
  id?: number;
  veiculoId: number;
  veiculoPlaca: string;
  data: string;
  kmAtual: number;
  tipoOleo: string;
  itensSubstituidos: ItemSubstituido[];
  proximaTrocaKm?: number;
  proximaTrocaData?: string;
  observacao?: string;
  criadoEm: string;
}

interface LogisticaDB extends DBSchema {
  cidades: {
    key: number;
    value: Cidade;
    indexes: { por_nome: string };
  };
  entregadores: {
    key: number;
    value: Entregador;
    indexes: { por_nome: string };
  };
  veiculos: {
    key: number;
    value: Veiculo;
    indexes: { por_placa: string };
  };
  rotas: {
    key: number;
    value: Rota;
    indexes: { por_data: string; por_status: string };
  };
  abastecimentos: {
    key: number;
    value: Abastecimento;
    indexes: { por_veiculo: number; por_data: string };
  };
  manutencoes: {
    key: number;
    value: Manutencao;
    indexes: { por_veiculo: number; por_data: string };
  };
  rotasModelo: {
    key: number;
    value: RotaModelo;
    indexes: { por_nome: string };
  };
}

let dbInstance: IDBPDatabase<LogisticaDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<LogisticaDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<LogisticaDB>("logistica-shopee", 3, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const cidades = db.createObjectStore("cidades", {
          keyPath: "id",
          autoIncrement: true,
        });
        cidades.createIndex("por_nome", "nome");

        const entregadores = db.createObjectStore("entregadores", {
          keyPath: "id",
          autoIncrement: true,
        });
        entregadores.createIndex("por_nome", "nome");

        const veiculos = db.createObjectStore("veiculos", {
          keyPath: "id",
          autoIncrement: true,
        });
        veiculos.createIndex("por_placa", "placa");

        const rotas = db.createObjectStore("rotas", {
          keyPath: "id",
          autoIncrement: true,
        });
        rotas.createIndex("por_data", "data");
        rotas.createIndex("por_status", "status");
      }

      if (oldVersion < 2) {
        const abastecimentos = db.createObjectStore("abastecimentos", {
          keyPath: "id",
          autoIncrement: true,
        });
        abastecimentos.createIndex("por_veiculo", "veiculoId");
        abastecimentos.createIndex("por_data", "data");

        const manutencoes = db.createObjectStore("manutencoes", {
          keyPath: "id",
          autoIncrement: true,
        });
        manutencoes.createIndex("por_veiculo", "veiculoId");
        manutencoes.createIndex("por_data", "data");
      }

      if (oldVersion < 3) {
        const rotasModelo = db.createObjectStore("rotasModelo", {
          keyPath: "id",
          autoIncrement: true,
        });
        rotasModelo.createIndex("por_nome", "nome");
      }
    },
  });

  return dbInstance;
}

// ── Cidades ──────────────────────────────────────────────
export async function listarCidades(): Promise<Cidade[]> {
  const db = await getDB();
  return db.getAll("cidades");
}

export async function salvarCidade(cidade: Cidade): Promise<number> {
  const db = await getDB();
  if (cidade.id) {
    await db.put("cidades", cidade);
    return cidade.id;
  }
  return db.add("cidades", { ...cidade, criadoEm: new Date().toISOString() });
}

export async function deletarCidade(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("cidades", id);
}

// ── Entregadores ─────────────────────────────────────────
export async function listarEntregadores(): Promise<Entregador[]> {
  const db = await getDB();
  return db.getAll("entregadores");
}

export async function salvarEntregador(e: Entregador): Promise<number> {
  const db = await getDB();
  if (e.id) {
    await db.put("entregadores", e);
    return e.id;
  }
  return db.add("entregadores", { ...e, criadoEm: new Date().toISOString() });
}

export async function deletarEntregador(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("entregadores", id);
}

// ── Veículos ─────────────────────────────────────────────
export async function listarVeiculos(): Promise<Veiculo[]> {
  const db = await getDB();
  return db.getAll("veiculos");
}

export async function salvarVeiculo(v: Veiculo): Promise<number> {
  const db = await getDB();
  if (v.id) {
    await db.put("veiculos", v);
    return v.id;
  }
  return db.add("veiculos", { ...v, criadoEm: new Date().toISOString() });
}

export async function deletarVeiculo(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("veiculos", id);
}

export async function buscarVeiculo(id: number): Promise<Veiculo | undefined> {
  const db = await getDB();
  return db.get("veiculos", id);
}

// ── Rotas ─────────────────────────────────────────────────
export async function listarRotas(): Promise<Rota[]> {
  const db = await getDB();
  const rotas = await db.getAll("rotas");
  return rotas.sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
  );
}

export async function buscarRota(id: number): Promise<Rota | undefined> {
  const db = await getDB();
  return db.get("rotas", id);
}

export async function salvarRota(rota: Rota): Promise<number> {
  const db = await getDB();
  if (rota.id) {
    await db.put("rotas", rota);
    return rota.id;
  }
  return db.add("rotas", { ...rota, criadoEm: new Date().toISOString() });
}

export async function rotaEmAndamento(): Promise<Rota | undefined> {
  const db = await getDB();
  const todas = await db.getAllFromIndex("rotas", "por_status", "em_andamento");
  return todas[0];
}

// ── Abastecimentos ────────────────────────────────────────
export async function listarAbastecimentosPorVeiculo(
  veiculoId: number
): Promise<Abastecimento[]> {
  const db = await getDB();
  const todos = await db.getAllFromIndex("abastecimentos", "por_veiculo", veiculoId);
  return todos.sort((a, b) => b.kmAtual - a.kmAtual);
}

export async function listarAbastecimentosPorPeriodo(
  dataInicio: string,
  dataFim: string,
  veiculoId?: number
): Promise<Abastecimento[]> {
  const db = await getDB();
  const todos = await db.getAll("abastecimentos");
  return todos
    .filter((a) => {
      const dentroDoperiodo = a.data >= dataInicio && a.data <= dataFim;
      if (veiculoId !== undefined) return dentroDoperiodo && a.veiculoId === veiculoId;
      return dentroDoperiodo;
    })
    .sort((a, b) => b.data.localeCompare(a.data));
}

export async function buscarUltimoAbastecimento(
  veiculoId: number,
  kmMenorQue: number
): Promise<Abastecimento | undefined> {
  const todos = await listarAbastecimentosPorVeiculo(veiculoId);
  return todos.find((a) => a.kmAtual < kmMenorQue);
}

export async function salvarAbastecimento(a: Abastecimento): Promise<number> {
  const db = await getDB();

  const dados = { ...a };

  if (!dados.id) {
    // Calcula consumo com base no abastecimento anterior
    const anterior = await buscarUltimoAbastecimento(a.veiculoId, a.kmAtual);
    if (anterior) {
      const kmPercorridos = a.kmAtual - anterior.kmAtual;
      if (kmPercorridos > 0 && anterior.litros > 0) {
        dados.kmAnterior = anterior.kmAtual;
        dados.consumoKmL = kmPercorridos / anterior.litros;
        dados.custoKm = a.valorTotal / kmPercorridos;
      }
    }
    dados.criadoEm = new Date().toISOString();

    // Atualiza kmAtual do veículo
    const veiculo = await buscarVeiculo(a.veiculoId);
    if (veiculo && (veiculo.kmAtual === undefined || a.kmAtual > veiculo.kmAtual)) {
      await salvarVeiculo({ ...veiculo, kmAtual: a.kmAtual });
    }

    return db.add("abastecimentos", dados);
  }

  await db.put("abastecimentos", dados);
  return dados.id!;
}

export async function deletarAbastecimento(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("abastecimentos", id);
}

// ── Manutenções ───────────────────────────────────────────
export async function listarManutencoesPorVeiculo(
  veiculoId: number
): Promise<Manutencao[]> {
  const db = await getDB();
  const todas = await db.getAllFromIndex("manutencoes", "por_veiculo", veiculoId);
  return todas.sort((a, b) => b.kmAtual - a.kmAtual);
}

export async function buscarUltimaManutencao(
  veiculoId: number
): Promise<Manutencao | undefined> {
  const lista = await listarManutencoesPorVeiculo(veiculoId);
  return lista[0];
}

export async function salvarManutencao(m: Manutencao): Promise<number> {
  const db = await getDB();
  if (m.id) {
    await db.put("manutencoes", m);
    return m.id;
  }

  // Atualiza kmAtual do veículo
  const veiculo = await buscarVeiculo(m.veiculoId);
  if (veiculo && (veiculo.kmAtual === undefined || m.kmAtual > veiculo.kmAtual)) {
    await salvarVeiculo({ ...veiculo, kmAtual: m.kmAtual });
  }

  return db.add("manutencoes", { ...m, criadoEm: new Date().toISOString() });
}

export async function deletarManutencao(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("manutencoes", id);
}

export function manutencaoVencida(
  ultima: Manutencao,
  kmAtual: number
): boolean {
  if (ultima.proximaTrocaKm && kmAtual >= ultima.proximaTrocaKm) return true;
  if (ultima.proximaTrocaData) {
    const hoje = new Date().toISOString().split("T")[0];
    if (hoje >= ultima.proximaTrocaData) return true;
  }
  return false;
}

// ── Rotas Modelo ──────────────────────────────────────────
export async function listarRotasModelo(): Promise<RotaModelo[]> {
  const db = await getDB();
  const lista = await db.getAll("rotasModelo");
  return lista.sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function salvarRotaModelo(m: RotaModelo): Promise<number> {
  const db = await getDB();
  if (m.id) {
    await db.put("rotasModelo", m);
    return m.id;
  }
  return db.add("rotasModelo", { ...m, criadoEm: new Date().toISOString() });
}

export async function deletarRotaModelo(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("rotasModelo", id);
}

// ── Helpers ───────────────────────────────────────────────
export const TIPOS_OCORRENCIA: Record<TipoOcorrencia, string> = {
  recusa_cliente: "Recusa do Cliente",
  duplicidade: "Duplicidade (já entregue)",
  nao_localizado: "Endereço Não Localizado",
  cliente_ausente: "Cliente Ausente",
  produto_danificado: "Produto Danificado",
  produto_fora_sistema: "Produto Fora do Sistema",
  rota_errada: "Produto em Rota Errada",
  outro: "Outro",
};

export const TIPOS_COMBUSTIVEL: Record<TipoCombustivel, string> = {
  gasolina: "Gasolina",
  etanol: "Etanol",
  diesel: "Diesel",
  gnv: "GNV",
};

export const ITENS_SUBSTITUIDOS_LABELS: Record<ItemSubstituido, string> = {
  oleoMotor: "Óleo do Motor",
  oleoCambio: "Óleo do Câmbio",
  oleoDiferencial: "Óleo do Diferencial",
  filtroOleo: "Filtro de Óleo",
  filtroAr: "Filtro de Ar",
  filtroCabine: "Filtro de Cabine",
  filtroCombustivel: "Filtro de Combustível",
};

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function horaAtual(): string {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dataHojeISO(): string {
  return new Date().toISOString().split("T")[0];
}
