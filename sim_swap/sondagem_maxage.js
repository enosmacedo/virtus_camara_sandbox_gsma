// Confere se o check respeita a janela (maxAge, em horas) e repete o final 04
const { verificarTroca } = require("./teste_sim_swap");
const casos = [
  ["+155500004", 24], ["+155500004", 24], ["+155500004", 240],
  ["+155500015", 1], ["+155500015", undefined], ["+155500015", 0], ["+155500015", 2401],
  ["+155500025", 1], ["+155500025", 719], ["+155500025", 721],
];
(async () => {
  for (const [t, m] of casos) {
    const r = await verificarTroca(t, m);
    console.log(`${t} maxAge=${String(m).padEnd(9)} -> ${r.status} ${JSON.stringify(r.data)}`);
  }
})();
