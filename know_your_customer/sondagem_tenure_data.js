// Verifica se a data enviada (tenureDate) muda a resposta do Tenure
const fs = require("fs");
const TOKEN = fs.readFileSync(__dirname + "/teste_kyc.js", "utf8").match(/const TOKEN = "([^"]+)"/)[1];
const datas = ["2010-01-01", "2020-01-01", "2024-01-01", "2025-06-01", "2026-04-16", "2026-10-14"];
const finais = ["05", "15", "25", "35", "45"];
(async () => {
  console.log("final | " + datas.join(" | "));
  for (const f of finais) {
    const linha = [];
    for (const d of datas) {
      const res = await fetch("https://open-gateway-sandbox.gsma.com/kyc-tenure/v0.1/check-tenure", {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: "+1555000" + f, tenureDate: d }),
      });
      const j = await res.json();
      linha.push(res.status !== 200 ? res.status : `${j.tenureDateCheck ? "✓" : "✗"} ${j.contractType ?? "-"}`.padEnd(10));
    }
    console.log(`  ${f}  | ` + linha.join(" | "));
  }
})();
