// Testa os finais 00 a 99 no check (com 3 janelas de tempo) e no retrieve-date,
// e agrupa as respostas iguais. A janela (maxAge) é em HORAS.
const { verificarTroca, dataDaTroca } = require("./teste_sim_swap");

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

// A data da troca é calculada a partir de hoje; trocamos por "há N dias" para agrupar
function normalizar(data) {
  if (data === null) return "(sem corpo)";
  let s = JSON.stringify(data);
  const m = s.match(/"latestSimChange":"([^"]+)"/);
  if (m) {
    const dias = Math.round((Date.now() - Date.parse(m[1])) / 86400000);
    s = s.replace(m[0], `"latestSimChange":"<há ${dias} dias>"`);
  }
  return s;
}

const testes = [
  { nome: "CHECK maxAge 24 h (1 dia)", chamar: (t) => verificarTroca(t, 24) },
  { nome: "CHECK maxAge 240 h (10 dias)", chamar: (t) => verificarTroca(t, 240) },
  { nome: "CHECK maxAge 2400 h (100 dias)", chamar: (t) => verificarTroca(t, 2400) },
  { nome: "RETRIEVE-DATE", chamar: (t) => dataDaTroca(t) },
];

(async () => {
  for (const teste of testes) {
    const grupos = new Map();
    for (let i = 0; i < 100; i++) {
      const r = await teste.chamar("+1555000" + String(i).padStart(2, "0"));
      const chave = `${r.status} ${normalizar(r.data)}`;
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(i);
    }
    console.log(`\n==================== ${teste.nome}`);
    for (const [resp, finais] of grupos) console.log(`\nfinais ${faixas(finais)}:\n  ${resp}`);
  }
})();
