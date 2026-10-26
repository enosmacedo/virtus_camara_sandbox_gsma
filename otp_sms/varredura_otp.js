// Testa os finais 00 a 99 no envio (final do telefone) e na validação (final do código)
// e agrupa as respostas iguais, como fizemos no KYC.
const { post } = require("./teste_otp");

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

// O authenticationId muda a cada envio; trocamos por <id> para agrupar respostas iguais
const normalizar = (data) => JSON.stringify(data).replace(/"authenticationId":"[^"]+"/, '"authenticationId":"<id>"');

function imprimir(titulo, grupos) {
  console.log(`\n==================== ${titulo}`);
  for (const [resp, finais] of grupos) console.log(`\nfinais ${faixas(finais)}:\n  ${resp}`);
}

(async () => {
  // 1. Envio: varia o final do telefone
  const envio = new Map();
  let idValido = null;
  for (let i = 0; i < 100; i++) {
    const r = await post("/one-time-password-sms/v1/send-code", {
      phoneNumber: "+1555000" + String(i).padStart(2, "0"),
      message: "{{code}} é seu código de teste",
    });
    if (r.status === 200 && !idValido) idValido = r.data.authenticationId;
    const chave = `${r.status} ${normalizar(r.data)}`;
    if (!envio.has(chave)) envio.set(chave, []);
    envio.get(chave).push(i);
  }
  imprimir("SEND-CODE (final do telefone)", envio);

  // 2. Validação: varia o final do código, usando um authenticationId válido
  if (!idValido) return console.log("\nNenhum envio deu certo; não dá para testar a validação.");
  const validacao = new Map();
  for (let i = 0; i < 100; i++) {
    const r = await post("/one-time-password-sms/v1/validate-code", {
      authenticationId: idValido,
      code: "1234" + String(i).padStart(2, "0"),
    });
    const chave = `${r.status} ${r.data === null ? "(sem corpo)" : normalizar(r.data)}`;
    if (!validacao.has(chave)) validacao.set(chave, []);
    validacao.get(chave).push(i);
  }
  imprimir("VALIDATE-CODE (final do código)", validacao);
})();
