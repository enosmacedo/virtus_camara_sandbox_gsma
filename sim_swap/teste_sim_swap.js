// Cole aqui o token do app SIM_SWAP_01 (botão "Get Access Token")
const TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJEc1hnZXp3d3hnT2JZUjFxQlZ6cWpycXpuOXZTOWJBU3Jub3RxclNjX253In0.eyJleHAiOjE3OTIxMTA2NjIsImlhdCI6MTc5MjExMDM2MiwianRpIjoidHJydGNjOjZlOWUyNWQxLThhMjMtZGY4YS0xZDM3LTUwMzFkOTZkZWU2NyIsImlzcyI6Imh0dHBzOi8vb3Blbi1nYXRld2F5LXNhbmRib3guZ3NtYS5jb20vYXV0aC9yZWFsbXMvY2FtYXJhIiwic3ViIjoiNGFiMzVhNDYtNzYzYy00ODY4LWEyYWItYzE3ZTExOWRhYmZlIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoib2d3LTM2NDBiZGJhLTcwZWYtNGEzMS1iMmZjLTgzMmM2YTJjZTdkMyIsInNjb3BlIjoic2ltLXN3YXA6Y2hlY2sgZGV2aWNlLXJvYW1pbmctc3RhdHVzOnJlYWQgcm9hbWluZy1zdGF0dXM6cmVhZCBkcHY6RnJhdWRQcmV2ZW50aW9uQW5kRGV0ZWN0aW9uIHNpbS1zd2FwOnJldHJpZXZlLWRhdGUiLCJjbGllbnRIb3N0IjoiMTAuMC4xLjEyNSIsImNsaWVudEFkZHJlc3MiOiIxMC4wLjEuMTI1IiwiY2xpZW50X2lkIjoib2d3LTM2NDBiZGJhLTcwZWYtNGEzMS1iMmZjLTgzMmM2YTJjZTdkMyJ9.3MmSEfJ2qyZZYvxHzx3Tj2a8I_3Zw4DZbQXFaFDIY7RSnxoB229Rsu5wZQl0tcj6pcqC8ygcxpl1Dae0l2RqaYijJQPRGvNqv2KBakPXZ1o_UvHFygxYUVcl3YHZTq_36HlXXjkMl7QiSr_pfRihk_LdVzIVZx2CfuVUgjJJae7L-1U4JunEecaUe6Nrz1vu-b95WlHzEwHBc6aesDYLPPhuA44EN1GvPDdSUeapF3ze5PV2fwte-CTIp89WPBeJCAlCUerrHq9lb4GZpcShy2IKBsELNHFDX9_FvGlE-3KsfqV0sGvEj6F4U3r3XgkfUYj8Wyc53FfDFkc4KADtWw";

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

// "O chip foi trocado nas últimas maxAge horas?" -> { swapped: true/false }
const verificarTroca = (phoneNumber, maxAge) =>
  post("/sim-swap/v1/check", maxAge === undefined ? { phoneNumber } : { phoneNumber, maxAge });

// "Quando foi a última troca de chip?" -> { latestSimChange: "data" }
const dataDaTroca = (phoneNumber) => post("/sim-swap/v1/retrieve-date", { phoneNumber });

// Exemplos da página do sandbox
async function executarTeste() {
  console.log("=== check (+447661113308, maxAge 120 h)");
  const c = await verificarTroca("+447661113308", 120);
  console.log(c.status, JSON.stringify(c.data, null, 2));

  console.log("\n=== retrieve-date (+447661113334)");
  const d = await dataDaTroca("+447661113334");
  console.log(d.status, JSON.stringify(d.data, null, 2));
}

if (require.main === module) executarTeste();

module.exports = { TOKEN, BASE, post, verificarTroca, dataDaTroca };
