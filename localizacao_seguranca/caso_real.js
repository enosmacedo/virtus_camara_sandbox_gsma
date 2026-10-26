// Caso real: antifraude de cartão em compra presencial.
// Quando uma compra chega, o banco pergunta à operadora se o celular do
// titular está perto da loja. Se não estiver, a compra pode ser de um cartão clonado.

const fs = require("fs");

// Reaproveita o token do teste01.js (renove lá quando expirar)
const TOKEN = fs.readFileSync(__dirname + "/teste01.js", "utf8").match(/const TOKEN = "([^"]+)"/)[1];
const URL = "https://open-gateway-sandbox.gsma.com/device-location-verification/v1/verify";

// Transações chegando no autorizador do banco.
// No sandbox, os 2 últimos dígitos do telefone definem a resposta.
const transacoes = [
  { id: "TX-001", cliente: "Ana",    telefone: "+5511987650015", valor: 89.9,   loja: { nome: "Padaria Centro - SP",   lat: -23.5505, lon: -46.6333 } },
  { id: "TX-002", cliente: "Bruno",  telefone: "+5511987650035", valor: 4999.0, loja: { nome: "Eletrônicos Av. Paulista", lat: -23.5614, lon: -46.6559 } },
  { id: "TX-003", cliente: "Carla",  telefone: "+5511987650055", valor: 320.0,  loja: { nome: "Farmácia Pinheiros",    lat: -23.5670, lon: -46.6920 } },
  { id: "TX-004", cliente: "Diego",  telefone: "+5511987650080", valor: 150.0,  loja: { nome: "Posto Marginal",        lat: -23.5200, lon: -46.7000 } },
  { id: "TX-005", cliente: "Elisa",  telefone: "+5511987650093", valor: 60.0,   loja: { nome: "Mercado Mooca",         lat: -23.5500, lon: -46.6000 } },
];

async function verificarLocalizacao(telefone, lat, lon) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      device: { phoneNumber: telefone },
      area: { areaType: "CIRCLE", center: { latitude: lat, longitude: lon }, radius: 2000 },
      maxAge: 600, // aceita uma localização de até 10 min atrás
    }),
  });
  const corpo = await res.json().catch(() => ({}));
  return { status: res.status, ...corpo };
}

// Regra de negócio: transforma a resposta da operadora em uma decisão
function decidir(tx, resp) {
  if (resp.status !== 200) {
    // A API falhou ou o número não existe: não bloqueia o cliente por causa disso.
    // A transação segue para o motor antifraude normal.
    return { decisao: "SEGUE FLUXO PADRÃO", motivo: `API indisponível (${resp.status} ${resp.code})` };
  }
  switch (resp.verificationResult) {
    case "TRUE":
      return { decisao: "APROVAR", motivo: "Celular do titular está na loja" };
    case "PARTIAL":
      return resp.matchRate >= 70
        ? { decisao: "APROVAR", motivo: `Celular provavelmente na loja (matchRate ${resp.matchRate}%)` }
        : { decisao: "PEDIR CONFIRMAÇÃO", motivo: `Localização incerta (matchRate ${resp.matchRate}%)` };
    case "FALSE":
      return tx.valor > 1000
        ? { decisao: "BLOQUEAR", motivo: "Celular longe da loja e valor alto: possível cartão clonado" }
        : { decisao: "PEDIR CONFIRMAÇÃO", motivo: "Celular longe da loja: envia push para o app do banco" };
    case "UNKNOWN":
    default:
      return { decisao: "SEGUE FLUXO PADRÃO", motivo: "Operadora não sabe onde o celular está" };
  }
}

(async () => {
  for (const tx of transacoes) {
    const resp = await verificarLocalizacao(tx.telefone, tx.loja.lat, tx.loja.lon);
    const { decisao, motivo } = decidir(tx, resp);
    console.log(`${tx.id} | ${tx.cliente.padEnd(6)} | R$ ${tx.valor.toFixed(2).padStart(8)} | ${tx.loja.nome}`);
    console.log(`        operadora: ${resp.verificationResult ?? resp.code}`);
    console.log(`        -> ${decisao}: ${motivo}\n`);
  }
})();
