// Caso real: banco protegendo operações sensíveis contra o golpe da troca de chip.
// O golpista transfere o número da vítima para um chip novo e passa a receber os SMS
// do banco. Antes de uma operação sensível, o banco pergunta à operadora quando o
// chip foi trocado pela última vez e decide se pode confiar no SMS.
//
// No sandbox, os 2 últimos dígitos do telefone definem a resposta:
//   10-19 -> troca há 5 dias | 20-29 -> troca há 30 dias | demais -> nunca trocado
//   92 -> 404 | 93 -> 503

const { dataDaTroca } = require("./teste_sim_swap");

const RISCO_ALTO_DIAS = 7;    // troca nos últimos 7 dias: não confiar no SMS
const ATENCAO_DIAS = 60;      // troca nos últimos 60 dias: operação com limite

const operacoes = [
  { id: "OP-01", cliente: "Ana",   acao: "Pix de R$ 5.000",                telefone: "+5511987650005" },
  { id: "OP-02", cliente: "Bruno", acao: "Troca de senha por SMS",         telefone: "+5511987650015" },
  { id: "OP-03", cliente: "Carla", acao: "Pix de R$ 2.000",                telefone: "+5511987650025" },
  { id: "OP-04", cliente: "Diego", acao: "Cadastro de novo celular no app", telefone: "+5511987650045" },
  { id: "OP-05", cliente: "Elisa", acao: "Pix de R$ 800",                  telefone: "+5511987650092" },
  { id: "OP-06", cliente: "Fábio", acao: "Troca de senha por SMS",         telefone: "+5511987650093" },
];

function decidir(r) {
  if (r.status !== 200) {
    // Sem resposta da operadora, numa operação sensível, o banco não confia só no SMS
    return { decisao: "VERIFICAÇÃO EXTRA", motivo: `Operadora não respondeu (${r.status} ${r.data?.code ?? ""}). Pedir biometria no app.` };
  }
  const quando = r.data?.latestSimChange;
  if (!quando) return { decisao: "LIBERAR", motivo: "O chip nunca foi trocado." };

  const dias = Math.round((Date.now() - Date.parse(quando)) / 86400000);
  if (dias < RISCO_ALTO_DIAS)
    return { decisao: "BLOQUEAR E VERIFICAR", motivo: `Chip trocado há ${dias} dias: não enviar SMS. Confirmar identidade na agência ou por biometria.` };
  if (dias < ATENCAO_DIAS)
    return { decisao: "LIBERAR COM LIMITE", motivo: `Chip trocado há ${dias} dias: operação liberada com valor reduzido.` };
  return { decisao: "LIBERAR", motivo: `Última troca de chip há ${dias} dias.` };
}

(async () => {
  for (const op of operacoes) {
    const r = await dataDaTroca(op.telefone);
    const { decisao, motivo } = decidir(r);
    const resp = r.status === 200 ? `última troca: ${r.data?.latestSimChange ?? "nunca"}` : `${r.status}`;
    console.log(`${op.id} | ${op.cliente.padEnd(6)} | ${op.acao}`);
    console.log(`        operadora: ${resp}`);
    console.log(`        -> ${decisao}: ${motivo}\n`);
  }
})();
