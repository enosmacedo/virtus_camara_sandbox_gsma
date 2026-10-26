// Testa os finais 00 a 99 do telefone, com e sem maxAge, e agrupa as respostas iguais.
// Assim descobrimos qual final gera círculo, polígono e cada erro no sandbox.
const { localizar } = require("./teste_localizacao");

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

const cenarios = [
  { nome: "COM maxAge 120", maxAge: 120 },
  { nome: "SEM maxAge", maxAge: undefined },
];

(async () => {
  for (const c of cenarios) {
    const grupos = new Map(); // resposta -> lista de finais
    for (let i = 0; i < 100; i++) {
      const r = await localizar("+1555000" + String(i).padStart(2, "0"), c.maxAge);
      // lastLocationTime vem sempre com o horário atual; trocamos por <agora> para agrupar
      const corpo = r.data === null ? "(sem corpo)" : JSON.stringify(r.data).replace(/"lastLocationTime":"[^"]+"/, '"lastLocationTime":"<agora>"');
      const chave = `${r.status} ${corpo}`;
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(i);
    }
    console.log(`\n==================== ${c.nome}`);
    for (const [resp, finais] of grupos) console.log(`\nfinais ${faixas(finais)}:\n  ${resp}`);
  }
})();
