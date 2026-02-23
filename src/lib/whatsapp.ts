import { Rota, ItemRota, Abastecimento, Manutencao, Veiculo, TIPOS_COMBUSTIVEL, ITENS_SUBSTITUIDOS_LABELS } from "./db";

function formatarDataHora(data: string, hora: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano} às ${hora}`;
}

function formatarDataBR(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarKmL(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function mensagemSaidaRota(rota: Rota): string {
  const totalVolumes = rota.itens.reduce((s, i) => s + i.volumesSaida, 0);

  const linhasCidades = rota.itens
    .map(
      (item) =>
        `   📍 ${item.cidadeNome} — ${item.volumesSaida} vol. (${item.entregadorNome})`
    )
    .join("\n");

  return (
    `🚚 *SAÍDA PARA ROTA* — ${formatarDataHora(rota.data, rota.horaSaida)}\n` +
    `\n` +
    `🚗 Veículo: *${rota.veiculoPlaca}*\n` +
    `👤 Motorista: *${rota.motorista}*\n` +
    `📦 Total de volumes: *${totalVolumes}*\n` +
    `🛣️ KM saída: *${rota.kmSaida}*\n` +
    `\n` +
    `*Cidades da rota:*\n` +
    `${linhasCidades}\n` +
    `\n` +
    `_Sistema Logística Shopee_`
  );
}

export function mensagemCidadeConcluida(rota: Rota, item: ItemRota): string {
  const devolvidos = item.volumesDevolvidos ?? 0;
  const entregues = item.volumesEntregues ?? item.volumesSaida - devolvidos;
  const ocorrencias = item.ocorrencias ?? [];

  let linhasOcorrencias = "";
  if (ocorrencias.length > 0) {
    const resumo = ocorrencias
      .map((o) => `   ⚠️ ${o.tipo.replace(/_/g, " ")} (${o.quantidade}x)`)
      .join("\n");
    linhasOcorrencias = `\n*Ocorrências:*\n${resumo}\n`;
  }

  const totalEntregues = rota.itens.filter((i) => i.concluido).length;
  const totalCidades = rota.itens.length;

  return (
    `✅ *ENTREGA CONCLUÍDA* — ${item.cidadeNome}\n` +
    `🕐 ${item.horaConclusao} · ${formatarDataHora(rota.data, rota.horaSaida).split(" às")[0]}\n` +
    `\n` +
    `👤 Entregador: *${item.entregadorNome}*\n` +
    `📦 Saíram: *${item.volumesSaida}* | Entregues: *${entregues}* | Devolvidos: *${devolvidos}*\n` +
    `${linhasOcorrencias}` +
    `\n` +
    `📊 Progresso: *${totalEntregues}/${totalCidades}* cidades concluídas\n` +
    `_Sistema Logística Shopee_`
  );
}

export function mensagemEncerramentoRota(rota: Rota, consumoMedioVeiculo?: number, alertaManutencao?: boolean): string {
  const totalVolumes = rota.itens.reduce((s, i) => s + i.volumesSaida, 0);
  const totalEntregues = rota.itens.reduce(
    (s, i) =>
      s +
      (i.volumesEntregues ??
        i.volumesSaida - (i.volumesDevolvidos ?? 0)),
    0
  );
  const totalDevolvidos = rota.itens.reduce(
    (s, i) => s + (i.volumesDevolvidos ?? 0),
    0
  );
  const totalOcorrencias = rota.itens.reduce(
    (s, i) => s + (i.ocorrencias?.length ?? 0),
    0
  );
  const kmRodados =
    rota.kmChegada && rota.kmSaida
      ? rota.kmChegada - rota.kmSaida
      : null;

  const linhasCidades = rota.itens
    .map((item) => {
      const dev = item.volumesDevolvidos ?? 0;
      const ent = item.volumesEntregues ?? item.volumesSaida - dev;
      const ocos = item.ocorrencias?.length ?? 0;
      return (
        `   ${item.concluido ? "✅" : "⏳"} *${item.cidadeNome}* (${item.entregadorNome})\n` +
        `      📦 ${item.volumesSaida} vol → Entregues: ${ent} | Dev: ${dev}` +
        (ocos > 0 ? ` | ⚠️ ${ocos} ocorr.` : "") +
        (item.horaConclusao ? ` | 🕐 ${item.horaConclusao}` : "")
      );
    })
    .join("\n");

  return (
    `🏁 *ROTA ENCERRADA* — ${formatarDataHora(rota.data, rota.horaChegada ?? "")}\n` +
    `\n` +
    `🚗 Veículo: *${rota.veiculoPlaca}*\n` +
    `👤 Motorista: *${rota.motorista}*\n` +
    `⏱️ Saída: *${rota.horaSaida}* | Chegada: *${rota.horaChegada ?? "--"}*\n` +
    (kmRodados !== null
      ? `🛣️ KM saída: *${rota.kmSaida}* | Chegada: *${rota.kmChegada}* | Rodados: *${kmRodados} km*\n`
      : `🛣️ KM saída: *${rota.kmSaida}*\n`) +
    (consumoMedioVeiculo !== undefined
      ? `⛽ Consumo médio do veículo: *${formatarKmL(consumoMedioVeiculo)} km/L*\n`
      : "") +
    (alertaManutencao
      ? `🔴 *ATENÇÃO: Manutenção do veículo está vencida!*\n`
      : "") +
    `\n` +
    `📊 *Resumo geral:*\n` +
    `   📦 Total: *${totalVolumes}* | Entregues: *${totalEntregues}* | Devolvidos: *${totalDevolvidos}*\n` +
    (totalOcorrencias > 0
      ? `   ⚠️ Ocorrências registradas: *${totalOcorrencias}*\n`
      : "") +
    `\n` +
    `*Detalhes por cidade:*\n` +
    `${linhasCidades}\n` +
    `\n` +
    `_Sistema Logística Shopee_`
  );
}

export function mensagemAbastecimento(a: Abastecimento, veiculo: Veiculo): string {
  const combustivel = TIPOS_COMBUSTIVEL[a.tipoCombustivel];
  return (
    `⛽ *ABASTECIMENTO REGISTRADO*\n` +
    `\n` +
    `🚗 Veículo: *${veiculo.placa}* — ${veiculo.modelo}\n` +
    `📅 Data: *${formatarDataBR(a.data)}*\n` +
    `🛣️ KM atual: *${a.kmAtual}*\n` +
    `\n` +
    `🔧 Combustível: *${combustivel}*\n` +
    `💧 Litros: *${a.litros.toFixed(2).replace(".", ",")} L*\n` +
    `💰 Valor total: *${formatarReais(a.valorTotal)}*\n` +
    (a.posto ? `📍 Posto: *${a.posto}*\n` : "") +
    (a.consumoKmL !== undefined
      ? `\n📊 *Consumo calculado:*\n` +
        `   ⚡ ${formatarKmL(a.consumoKmL)} km/L\n` +
        (a.custoKm !== undefined
          ? `   💵 ${formatarReais(a.custoKm)}/km\n`
          : "")
      : "") +
    (a.observacao ? `\n📝 ${a.observacao}\n` : "") +
    `\n_Sistema Logística Shopee_`
  );
}

export function mensagemManutencao(m: Manutencao, veiculo: Veiculo): string {
  const itens = m.itensSubstituidos
    .map((i) => `   ✅ ${ITENS_SUBSTITUIDOS_LABELS[i]}`)
    .join("\n");

  return (
    `🔧 *MANUTENÇÃO REGISTRADA*\n` +
    `\n` +
    `🚗 Veículo: *${veiculo.placa}* — ${veiculo.modelo}\n` +
    `📅 Data: *${formatarDataBR(m.data)}*\n` +
    `🛣️ KM atual: *${m.kmAtual}*\n` +
    `\n` +
    `🛢️ Óleo: *${m.tipoOleo}*\n` +
    `\n` +
    `*Itens substituídos:*\n` +
    `${itens}\n` +
    (m.proximaTrocaKm || m.proximaTrocaData
      ? `\n⏰ *Próxima troca:*\n` +
        (m.proximaTrocaKm ? `   🛣️ KM: *${m.proximaTrocaKm}*\n` : "") +
        (m.proximaTrocaData ? `   📅 Data: *${formatarDataBR(m.proximaTrocaData)}*\n` : "")
      : "") +
    (m.observacao ? `\n📝 ${m.observacao}\n` : "") +
    `\n_Sistema Logística Shopee_`
  );
}

export function mensagemRelatorioAbastecimentos(
  veiculo: Veiculo | null,
  dataInicio: string,
  dataFim: string,
  lista: Abastecimento[]
): string {
  const totalGasto = lista.reduce((s, a) => s + a.valorTotal, 0);
  const totalLitros = lista.reduce((s, a) => s + a.litros, 0);
  const comConsumo = lista.filter((a) => a.consumoKmL !== undefined);
  const consumoMedio =
    comConsumo.length > 0
      ? comConsumo.reduce((s, a) => s + a.consumoKmL!, 0) / comConsumo.length
      : null;

  const cabecalho = veiculo
    ? `🚗 Veículo: *${veiculo.placa}* — ${veiculo.modelo}\n`
    : `🚗 Veículo: *Todos os veículos*\n`;

  const historico = lista
    .map(
      (a) =>
        `   📅 ${formatarDataBR(a.data)} · KM ${a.kmAtual} · ${a.litros.toFixed(1).replace(".", ",")}L · ${formatarReais(a.valorTotal)}` +
        (a.consumoKmL !== undefined ? ` · ${formatarKmL(a.consumoKmL)} km/L` : "")
    )
    .join("\n");

  return (
    `⛽ *RELATÓRIO DE ABASTECIMENTOS*\n` +
    `📆 Período: *${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)}*\n` +
    `\n` +
    cabecalho +
    `\n` +
    `📊 *Resumo:*\n` +
    `   💰 Total gasto: *${formatarReais(totalGasto)}*\n` +
    `   💧 Total litros: *${totalLitros.toFixed(2).replace(".", ",")} L*\n` +
    (consumoMedio !== null
      ? `   ⚡ Consumo médio: *${formatarKmL(consumoMedio)} km/L*\n`
      : "") +
    `   📋 Registros: *${lista.length}*\n` +
    (lista.length > 0
      ? `\n*Histórico:*\n${historico}\n`
      : "") +
    `\n_Sistema Logística Shopee_`
  );
}

export function mensagemRelatorioManutencoes(
  veiculo: Veiculo,
  lista: Manutencao[]
): string {
  const historico = lista
    .map(
      (m) =>
        `   📅 ${formatarDataBR(m.data)} · KM ${m.kmAtual} · ${m.tipoOleo}\n` +
        `      ${m.itensSubstituidos.map((i) => ITENS_SUBSTITUIDOS_LABELS[i]).join(", ")}`
    )
    .join("\n");

  return (
    `🔧 *HISTÓRICO DE MANUTENÇÕES*\n` +
    `\n` +
    `🚗 Veículo: *${veiculo.placa}* — ${veiculo.modelo}\n` +
    `📋 Total de registros: *${lista.length}*\n` +
    (lista.length > 0
      ? `\n*Registros:*\n${historico}\n`
      : "") +
    `\n_Sistema Logística Shopee_`
  );
}

export function abrirWhatsApp(mensagem: string, telefone?: string): void {
  const texto = encodeURIComponent(mensagem);
  const url = telefone
    ? `https://wa.me/${telefone}?text=${texto}`
    : `https://wa.me/?text=${texto}`;
  window.open(url, "_blank");
}
