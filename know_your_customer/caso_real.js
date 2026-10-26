// Caso real: abertura de conta digital sem foto de documento.
// Para cada pedido, o banco pergunta à operadora:
//   Match  -> os dados digitados são do dono desta linha?
//   Tenure -> a linha existe desde pelo menos 6 meses atrás?
//   Age    -> o titular tem 18 anos ou mais?
// e decide: aprovar, aprovar com limite, análise manual, método tradicional ou bloquear.
//
// No sandbox, os 2 últimos dígitos do telefone definem as 3 respostas.

const fs = require("fs");

// Reaproveita o token do teste_kyc.js (renove lá quando expirar)
const TOKEN = fs.readFileSync(__dirname + "/teste_kyc.js", "utf8").match(/const TOKEN = "([^"]+)"/)[1];
const BASE = "https://open-gateway-sandbox.gsma.com";

// Linha "antiga" = ativa há pelo menos 6 meses
const seisMesesAtras = new Date(Date.now() - 182 * 24 * 3600 * 1000).toISOString().slice(0, 10);

// Pedidos de abertura de conta chegando pelo app
const pedidos = [
  { id: "AC-001", nome: "Carla Lima",     cpf: "123.456.789-00", telefone: "+5511987650005", email: "carla@email.com" },
  { id: "AC-002", nome: "Rafael Souza",   cpf: "234.567.890-11", telefone: "+5511987650015", email: "rafael@email.com" },
  { id: "AC-003", nome: "Marcos Pereira", cpf: "345.678.901-22", telefone: "+5511987650025", email: "marcos@email.com" },
  { id: "AC-004", nome: "Lucas Andrade",  cpf: "456.789.012-33", telefone: "+5511987650035", email: "lucas@email.com" },
  { id: "AC-005", nome: "Paula Reis",     cpf: "987.654.321-00", telefone: "+5511987650055", email: "paula.reis@email.com" }, // golpista com dados vazados
  { id: "AC-006", nome: "Diego Martins",  cpf: "567.890.123-44", telefone: "+5511987650065", email: "diego@email.com" },
  { id: "AC-007", nome: "Fábio Lima",     cpf: "789.012.345-66", telefone: "+5511987650075", email: "fabio@email.com" },
  { id: "AC-008", nome: "Elisa Rocha",    cpf: "678.901.234-55", telefone: "+5511987650092", email: "elisa@email.com" },
];

async function post(rota, body) {
  const res = await fetch(BASE + rota, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

// As 3 consultas à operadora, em paralelo
async function consultarOperadora(p) {
  const [match, tenure, idade] = await Promise.all([
    post("/kyc-match/v0.2/match", { phoneNumber: p.telefone, idDocument: p.cpf.replace(/\D/g, ""), name: p.nome, email: p.email }),
    post("/kyc-tenure/v0.1/check-tenure", { phoneNumber: p.telefone, tenureDate: seisMesesAtras }),
    post("/kyc-age-verification/v0.1/verify", { phoneNumber: p.telefone, ageThreshold: 18 }),
  ]);
  return { match, tenure, idade };
}

// Resume o Match em um nível. Os valores vêm como texto: "true", "false" ou "not_available".
function nivelMatch(m) {
  const doc = m.idDocumentMatch, nome = m.nameMatch;
  if (doc === "not_available" && nome === "not_available") return "SEM DADOS";
  if (doc === "false") return "BAIXO";
  if (nome === "true") return "ALTO";
  return "MISTO";
}

// Régua de decisão
function decidir({ match, tenure, idade }) {
  if (match.status !== 200 || tenure.status !== 200 || idade.status !== 200) {
    const falha = [match, tenure, idade].find((r) => r.status !== 200);
    return { decisao: "MÉTODO TRADICIONAL", motivo: `Operadora não respondeu (${falha.status} ${falha.data?.code ?? ""}). Pedir documento e selfie.` };
  }
  if (idade.data.ageCheck === "false")
    return { decisao: "RECUSAR", motivo: "Titular da linha é menor de idade. Oferecer conta jovem com responsável." };

  const nivel = nivelMatch(match.data);
  const linhaAntiga = tenure.data.tenureDateCheck === true;
  const linhaPrePagaNova = !linhaAntiga && tenure.data.contractType === "PAYG";

  if (nivel === "SEM DADOS")
    return { decisao: "MÉTODO TRADICIONAL", motivo: "Operadora não tem dados desta linha. Pedir documento e selfie." };
  if (nivel === "BAIXO")
    return { decisao: "BLOQUEAR", motivo: "Dados não são do dono da linha" + (linhaAntiga ? "." : " e a linha é nova: perfil de golpe com dados vazados.") };
  if (nivel === "MISTO")
    return linhaPrePagaNova
      ? { decisao: "BLOQUEAR", motivo: "Dados divergentes em linha pré-paga recente." }
      : { decisao: "ANÁLISE MANUAL", motivo: "Documento confere, mas nome ou endereço divergem." };
  if (!linhaAntiga)
    return { decisao: "APROVAR COM LIMITE", motivo: "Dados conferem, mas a linha tem menos de 6 meses." };
  if (idade.data.verifiedStatus === false)
    return { decisao: "APROVAR", motivo: "Dados conferem e linha antiga (cadastro da operadora não verificado)." };
  return { decisao: "APROVAR", motivo: "Dados conferem, linha antiga e maior de idade confirmado." };
}

const resumo = ({ match, tenure, idade }) => {
  const m = match.status === 200 ? `match ${nivelMatch(match.data)}` : `match ${match.status}`;
  const t = tenure.status === 200
    ? `linha ${tenure.data.tenureDateCheck ? "antiga" : "nova"}${tenure.data.contractType ? " " + tenure.data.contractType : ""}`
    : `tenure ${tenure.status}`;
  const a = idade.status === 200 ? `18+: ${idade.data.ageCheck}` : `idade ${idade.status}`;
  return `${m} | ${t} | ${a}`;
};

(async () => {
  console.log(`Linha antiga = ativa desde ${seisMesesAtras}\n`);
  for (const p of pedidos) {
    const respostas = await consultarOperadora(p);
    const { decisao, motivo } = decidir(respostas);
    console.log(`${p.id} | ${p.nome.padEnd(15)} | ${p.telefone}`);
    console.log(`        operadora: ${resumo(respostas)}`);
    console.log(`        -> ${decisao}: ${motivo}\n`);
  }
})();
