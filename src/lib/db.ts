import { openDB, DBSchema, IDBPDatabase } from "idb";

export type TipoOcorrencia =
  | "recusa_cliente"
  | "duplicidade"
  | "nao_localizado"
  | "cliente_ausente"
  | "produto_danificado"
  | "outro";

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
}

let dbInstance: IDBPDatabase<LogisticaDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<LogisticaDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<LogisticaDB>("logistica-shopee", 1, {
    upgrade(db) {
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

// ── Helpers ───────────────────────────────────────────────
export const TIPOS_OCORRENCIA: Record<TipoOcorrencia, string> = {
  recusa_cliente: "Recusa do Cliente",
  duplicidade: "Duplicidade (já entregue)",
  nao_localizado: "Endereço Não Localizado",
  cliente_ausente: "Cliente Ausente",
  produto_danificado: "Produto Danificado",
  outro: "Outro",
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
