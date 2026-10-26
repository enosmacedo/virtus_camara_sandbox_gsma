// Verifica se o sandbox considera os dados enviados ou só o final do número
const fs = require("fs");
const TOKEN = fs.readFileSync(__dirname + "/teste_kyc.js", "utf8").match(/const TOKEN = "([^"]+)"/)[1];
const B = "https://open-gateway-sandbox.gsma.com";
const casos = [
  ["MATCH +..05 nome do exemplo", "/kyc-match/v0.2/match", { phoneNumber: "+155500005", name: "John Doe", email: "john@example.com" }],
  ["MATCH +..05 nome totalmente diferente", "/kyc-match/v0.2/match", { phoneNumber: "+155500005", name: "Maria Souza", email: "x@y.com" }],
  ["MATCH +..05 com idDocument", "/kyc-match/v0.2/match", { phoneNumber: "+155500005", idDocument: "12345678900", name: "John Doe" }],
  ["MATCH +..94 com idDocument", "/kyc-match/v0.2/match", { phoneNumber: "+155500094", idDocument: "12345678900", name: "John Doe" }],
  ["AGE +..30 idade mínima 18", "/kyc-age-verification/v0.1/verify", { phoneNumber: "+155500030", ageThreshold: 18 }],
  ["AGE +..30 idade mínima 12", "/kyc-age-verification/v0.1/verify", { phoneNumber: "+155500030", ageThreshold: 12 }],
  ["AGE +..05 idade mínima 99", "/kyc-age-verification/v0.1/verify", { phoneNumber: "+155500005", ageThreshold: 99 }],
  ["TENURE +..05 desde 2020", "/kyc-tenure/v0.1/check-tenure", { phoneNumber: "+155500005", tenureDate: "2020-01-01" }],
  ["TENURE +..05 desde ontem", "/kyc-tenure/v0.1/check-tenure", { phoneNumber: "+155500005", tenureDate: "2026-10-14" }],
  ["TENURE +..55 desde 1990", "/kyc-tenure/v0.1/check-tenure", { phoneNumber: "+155500055", tenureDate: "1990-01-01" }],
];
(async () => {
  for (const [nome, rota, body] of casos) {
    const res = await fetch(B + rota, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    console.log(`${nome.padEnd(40)} -> ${res.status} ${(await res.text()).slice(0, 160)}`);
  }
})();
