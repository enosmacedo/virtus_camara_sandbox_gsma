// Caso real: um banco confirma login e Pix com código por SMS enviado pela operadora.
// O app não gera nem guarda o código: só pede o envio, recebe um protocolo
// (authenticationId) e depois pergunta à operadora se o código digitado está certo.
//
// No sandbox não há SMS de verdade. Os 2 últimos dígitos decidem a resposta:
// no envio, os do telefone; na validação, os do código digitado.
// Na validação, o sandbox só distingue "aceito" (204) de "recusado" (400 genérico):
// os cenários "expirado" e "tentativas demais" da documentação não existem nele.

const { post } = require("./teste_otp");

const MAX_TENTATIVAS = 3;

// Situações simuladas. "digitados" são os códigos que a pessoa tenta, em ordem.
const situacoes = [
  { id: "OP-001", cliente: "Ana",   acao: "Pix de R$ 800,00",     telefone: "+5511987650010", digitados: ["482910"] },
  { id: "OP-002", cliente: "Ana",   acao: "Login (golpista com a senha da Ana)", telefone: "+5511987650010", digitados: ["111125", "123430", "000065"] },
  { id: "OP-003", cliente: "Bruno", acao: "Login",                telefone: "+5511987650015", digitados: ["555521", "555511"] },
  { id: "OP-004", cliente: "Carla", acao: "Troca de senha",       telefone: "+5511987650065", digitados: [] },
  { id: "OP-005", cliente: "Diego", acao: "Pix de R$ 150,00",     telefone: "+5511987650025", digitados: [] },
  { id: "OP-006", cliente: "Elisa", acao: "Login",                telefone: "+5511987650045", digitados: [] },
];

// O sandbox devolve códigos de erro como "ONE_TIME_PASSWORD_SMS.INVALID_OTP";
// comparamos pelo final para não depender do prefixo exato.
const erro = (data, nome) => typeof data?.code === "string" && data.code.endsWith(nome);

// Regra de negócio do envio
async function enviarCodigo(sit) {
  const r = await post("/one-time-password-sms/v1/send-code", {
    phoneNumber: sit.telefone,
    message: `{{code}} é seu código do Banco para ${sit.acao.toLowerCase()}. Não compartilhe.`,
  });
  if (r.status === 200) return { ok: true, authenticationId: r.data.authenticationId };
  if (erro(r.data, "MAX_OTP_CODES_EXCEEDED"))
    return { ok: false, decisao: "AGUARDAR", motivo: "Muitos códigos pedidos para este número. Tente em alguns minutos." };
  if (erro(r.data, "PHONE_NUMBER_NOT_ALLOWED"))
    return { ok: false, decisao: "OUTRO MÉTODO", motivo: "A operadora não envia SMS para este número. Usar app autenticador ou e-mail." };
  if (erro(r.data, "PHONE_NUMBER_BLOCKED"))
    return { ok: false, decisao: "OUTRO MÉTODO", motivo: "Número bloqueado para SMS na operadora. Usar app autenticador ou e-mail." };
  return { ok: false, decisao: "OUTRO MÉTODO", motivo: `Falha no envio (${r.status} ${r.data?.code ?? ""})` };
}

// Regra de negócio da validação: tenta cada código digitado até acertar ou ser barrado
async function validarCodigos(sit, authenticationId) {
  const tentativas = sit.digitados.slice(0, MAX_TENTATIVAS);
  for (const [n, code] of tentativas.entries()) {
    const r = await post("/one-time-password-sms/v1/validate-code", { authenticationId, code });
    const rotulo = `tentativa ${n + 1}: ${code}`;
    if (r.status === 204) {
      console.log(`        ${rotulo} -> correto`);
      return { decisao: "LIBERAR", motivo: "Código confirmado pela operadora" };
    }
    // O sandbox não devolve INVALID_OTP: qualquer código recusado vem como 400 INVALID_ARGUMENT.
    // Tratamos os dois como tentativa errada; numa operadora real, o específico deve chegar.
    if (erro(r.data, "INVALID_OTP") || (r.status === 400 && erro(r.data, "INVALID_ARGUMENT"))) {
      console.log(`        ${rotulo} -> código recusado`);
      continue;
    }
    if (erro(r.data, "VERIFICATION_EXPIRED")) {
      console.log(`        ${rotulo} -> código expirado`);
      return { decisao: "REENVIAR", motivo: "O código passou do prazo. Pedir um novo." };
    }
    if (erro(r.data, "VERIFICATION_FAILED")) {
      console.log(`        ${rotulo} -> verificação cancelada pela operadora`);
      return { decisao: "BLOQUEAR E ALERTAR", motivo: "Tentativas demais. Bloquear a operação e avisar o cliente." };
    }
    console.log(`        ${rotulo} -> erro ${r.status} ${r.data?.code ?? ""}`);
    return { decisao: "OUTRO MÉTODO", motivo: "Falha inesperada na validação" };
  }
  return { decisao: "BLOQUEAR E ALERTAR", motivo: `${tentativas.length} códigos errados. Bloquear a operação e avisar o cliente.` };
}

(async () => {
  for (const sit of situacoes) {
    console.log(`${sit.id} | ${sit.cliente.padEnd(6)} | ${sit.acao}`);
    const envio = await enviarCodigo(sit);
    let resultado;
    if (!envio.ok) {
      console.log("        envio do SMS: recusado");
      resultado = envio;
    } else {
      console.log("        envio do SMS: ok");
      resultado = await validarCodigos(sit, envio.authenticationId);
    }
    console.log(`        -> ${resultado.decisao}: ${resultado.motivo}\n`);
  }
})();
