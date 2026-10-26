// Testa os finais 00 a 99 nos 3 endpoints de KYC e agrupa as respostas iguais.
// Assim descobrimos qual final de telefone gera qual cenário no sandbox.
const fs = require("fs");

// Reaproveita o token do teste_kyc.js (renove lá quando expirar)
const TOKEN = fs.readFileSync(__dirname + "/teste_kyc.js", "utf8").match(/const TOKEN = "([^"]+)"/)[1];
const BASE = "https://open-gateway-sandbox.gsma.com";

const endpoints = [
  { nome: "AGE VERIFICATION", rota: "/kyc-age-verification/v0.1/verify", body: (tel) => ({ phoneNumber: tel, ageThreshold: 18 }) },
  { nome: "MATCH", rota: "/kyc-match/v0.2/match", body: (tel) => ({ phoneNumber: tel, name: "John Doe", email: "john@example.com" }) },
  { nome: "TENURE", rota: "/kyc-tenure/v0.1/check-tenure", body: (tel) => ({ phoneNumber: tel, tenureDate: "2020-01-01" }) },
];

// Junta finais consecutivos em faixas: [0,1,2,5] -> "00-02, 05"
function faixas(finais) {
  const fmt = (n) => String(n).padStart(2, "0");
  const partes = [];
  let ini = finais[0], ant = finais[0];
  for (const f of [...finais.slice(1), null]) {
    if (f !== ant + 1) {
      partes.push(ini === ant ? fmt(ini) : `${fmt(ini)}-${fmt(ant)}`);
      ini = f;
    }
    ant = f;
  }
  return partes.join(", ");
}

(async () => {
  for (const ep of endpoints) {
    const grupos = new Map(); // resposta -> lista de finais
    for (let i = 0; i < 100; i++) {
      const tel = "+1555000" + String(i).padStart(2, "0");
      const res = await fetch(BASE + ep.rota, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(ep.body(tel)),
      });
      const chave = `${res.status} ${await res.text()}`;
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(i);
    }
    console.log(`\n==================== ${ep.nome}  ${ep.rota}`);
    for (const [resp, finais] of grupos) {
      console.log(`\nfinais ${faixas(finais)}:\n  ${resp}`);
    }
  }
})();
