// Cole aqui o token do app DEVICE_LOCATION_RETRIEVAL_01 (botão "Get Access Token")
const TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJEc1hnZXp3d3hnT2JZUjFxQlZ6cWpycXpuOXZTOWJBU3Jub3RxclNjX253In0.eyJleHAiOjE3OTIwOTkzMDMsImlhdCI6MTc5MjA5OTAwMywianRpIjoidHJydGNjOmRhMWM5OTc5LWU0MzYtNzM0My1jMWVlLTA5NjQwYWU4ZjA4MSIsImlzcyI6Imh0dHBzOi8vb3Blbi1nYXRld2F5LXNhbmRib3guZ3NtYS5jb20vYXV0aC9yZWFsbXMvY2FtYXJhIiwic3ViIjoiMWZmODhhNGYtYzVjNS00YWY2LTgxNmYtZTA0NmI4MjkzMzQwIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoib2d3LTU0ZGY2ZGNhLThiMTUtNDJmNi1hMzUzLWQ0MDNhZDljYzE3MyIsInNjb3BlIjoibG9jYXRpb24tcmV0cmlldmFsOnJlYWQgZGV2aWNlLXJvYW1pbmctc3RhdHVzOnJlYWQgcm9hbWluZy1zdGF0dXM6cmVhZCBkcHY6RnJhdWRQcmV2ZW50aW9uQW5kRGV0ZWN0aW9uIiwiY2xpZW50SG9zdCI6IjEwLjAuMi43OSIsImNsaWVudEFkZHJlc3MiOiIxMC4wLjIuNzkiLCJjbGllbnRfaWQiOiJvZ3ctNTRkZjZkY2EtOGIxNS00MmY2LWEzNTMtZDQwM2FkOWNjMTczIn0.M64vCb7rbflxZn5WX2l2pHEMvBmZSrDsQAwjd4CHC2yLUMDn9aNEmhPrChXTCfF9RN-TvJEi3RtjZb7VM6lb4_30wwmBKDMdW1Uh4F1UFxaa3DiVBAlAzPIQUbRE9kxHJRHvD0RmS51xrZRxnYkzYgDbO_s1DEgT0J1wfp37V868zcYnLLnEnFzST2OMnoUs3eIdU8sSY88iy3MCYGui1U67RSsiJzqweoc48Eoo8I8nIG1h6XZluzokp3oN0x2s8AsLf5HNAgFLHPnlcTkd_UhP7G3Ov_bKvmZyGPl7g_q-s8ZwFR8f9mSpWlBmXcjQIDg4csCQW3kK-FdE_lyTyg";

const BASE = "https://open-gateway-sandbox.gsma.com";
const ROTA = "/device-location-retrieval/v0.3/retrieve";

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

// Pergunta à operadora onde está o celular
const localizar = (phoneNumber, maxAge) =>
  post(ROTA, maxAge === undefined ? { device: { phoneNumber } } : { device: { phoneNumber }, maxAge });

// Exemplo da página do sandbox ("Retrieve Location - Circle")
async function executarTeste() {
  const r = await localizar("+155500025", 120);
  console.log("Status HTTP:", r.status);
  console.log(JSON.stringify(r.data, null, 2));
}

if (require.main === module) executarTeste();

module.exports = { TOKEN, BASE, ROTA, post, localizar };
