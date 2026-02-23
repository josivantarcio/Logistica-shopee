import { Rota, ItemRota } from "./db";

function formatarDataHora(data: string, hora: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano} às ${hora}`;
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

export function mensagemEncerramentoRota(rota: Rota): string {
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

export function abrirWhatsApp(mensagem: string, telefone?: string): void {
  const texto = encodeURIComponent(mensagem);
  const url = telefone
    ? `https://wa.me/${telefone}?text=${texto}`
    : `https://wa.me/?text=${texto}`;
  window.open(url, "_blank");
}
