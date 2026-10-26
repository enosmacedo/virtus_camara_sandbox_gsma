// Cole aqui o token do app OTP_VALIDATION (botão "Get Access Token")
const TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJEc1hnZXp3d3hnT2JZUjFxQlZ6cWpycXpuOXZTOWJBU3Jub3RxclNjX253In0.eyJleHAiOjE3OTIwOTgwODQsImlhdCI6MTc5MjA5Nzc4NCwianRpIjoidHJydGNjOjkwNWRhNDQ4LTU4YjMtYjhlOS05OGQxLTA5M2IyMzdkOGQyNyIsImlzcyI6Imh0dHBzOi8vb3Blbi1nYXRld2F5LXNhbmRib3guZ3NtYS5jb20vYXV0aC9yZWFsbXMvY2FtYXJhIiwic3ViIjoiOGJhY2JmNzQtNTRiNy00NzliLWIxZGEtYjFiYmY3OTI1ODUyIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoib2d3LTY4NzA4YmQ5LWFiZWQtNGYyMC1iMzYwLTBkYWVkODdiMzMyNCIsInNjb3BlIjoib25lLXRpbWUtcGFzc3dvcmQtc21zOnNlbmQtdmFsaWRhdGUgZGV2aWNlLXJvYW1pbmctc3RhdHVzOnJlYWQgcm9hbWluZy1zdGF0dXM6cmVhZCBkcHY6RnJhdWRQcmV2ZW50aW9uQW5kRGV0ZWN0aW9uIiwiY2xpZW50SG9zdCI6IjEwLjAuMi43OSIsImNsaWVudEFkZHJlc3MiOiIxMC4wLjIuNzkiLCJjbGllbnRfaWQiOiJvZ3ctNjg3MDhiZDktYWJlZC00ZjIwLWIzNjAtMGRhZWQ4N2IzMzI0In0.NmAdh3hn0EsFKK9_j9K9SFfqKXnWKxyC6yw17CKZmChtI0p8OhUKTqlozXQvggTDaJZ5owQXB590DKzTDU0_3SbtJwCUQJTcOqtONzexJ6infw0SUaGnMAapwPf6nQsQd0SSXsv6c6MFMkXAnx1fCXzkKpWruNQjtOP-Aqp4idwXpfYmHB1s0w_uMjg2w8FYshfKnUZW66H_9cbSZFK44EsVxx5Fl_3JQOXRC8tFbyhUbzhV1iBUx895lUsh2ik2rTl55LoqCuqI9zOazpJuSs3xPkhOe_btNNXy2LUor8f40ufti_pQDPvhIlbuTXgPIqJAc-3h6ilzyZLWMFEvLQ";

const BASE = "https://open-gateway-sandbox.gsma.com";

async function post(rota, body) {
  const response = await fetch(BASE + rota, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const texto = await response.text();
  let data = null;
  try { data = texto ? JSON.parse(texto) : null; } catch { data = texto; }
  return { status: response.status, data };
}

// Fluxo completo com os exemplos da página do sandbox
async function executarTeste() {
  console.log("=== 1. Enviar código (send-code)");
  const envio = await post("/one-time-password-sms/v1/send-code", {
    phoneNumber: "+155500010",
    message: "{{code}} is your verification code for Open Gateway Sandbox",
  });
  console.log(envio.status, JSON.stringify(envio.data, null, 2));
  if (envio.status !== 200) return;

  console.log("\n=== 2. Validar código (validate-code)");
  const validacao = await post("/one-time-password-sms/v1/validate-code", {
    authenticationId: envio.data.authenticationId,
    code: "123410",
  });
  // Sucesso é 204: resposta sem corpo
  console.log(validacao.status, validacao.data === null ? "(sem corpo)" : JSON.stringify(validacao.data, null, 2));
}

if (require.main === module) executarTeste();

module.exports = { TOKEN, BASE, post };
