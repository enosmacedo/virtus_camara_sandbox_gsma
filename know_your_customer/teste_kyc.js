// Cole aqui o token do app KNOW_YOUR_CUSTOMER_01 (botão "Get Access Token")
const TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJEc1hnZXp3d3hnT2JZUjFxQlZ6cWpycXpuOXZTOWJBU3Jub3RxclNjX253In0.eyJleHAiOjE3OTIwOTk3ODksImlhdCI6MTc5MjA5OTQ4OSwianRpIjoidHJydGNjOjg1MDM3MDM0LTM3ZTMtYmNkOS01NzA0LWJjYmQ5NTI2MDY0MCIsImlzcyI6Imh0dHBzOi8vb3Blbi1nYXRld2F5LXNhbmRib3guZ3NtYS5jb20vYXV0aC9yZWFsbXMvY2FtYXJhIiwic3ViIjoiOTY2MDc1ODItNTkzNy00ZmYzLTgzMGQtODYwNTRhNzA3NjE2IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoib2d3LTliNTBhMWJmLWY0YzMtNDYzNi1hMmE2LWQ0ODNhODE5MzYwZiIsInNjb3BlIjoia3ljLW1hdGNoOm1hdGNoIGt5Yy10ZW51cmU6Y2hlY2stdGVudXJlIGt5Yy1maWxsLWluOmZpbGwtaW4gZGV2aWNlLXJvYW1pbmctc3RhdHVzOnJlYWQgcm9hbWluZy1zdGF0dXM6cmVhZCBkcHY6RnJhdWRQcmV2ZW50aW9uQW5kRGV0ZWN0aW9uIGt5Yy1hZ2UtdmVyaWZpY2F0aW9uOnZlcmlmeSIsImNsaWVudEhvc3QiOiIxMC4wLjIuNzkiLCJjbGllbnRBZGRyZXNzIjoiMTAuMC4yLjc5IiwiY2xpZW50X2lkIjoib2d3LTliNTBhMWJmLWY0YzMtNDYzNi1hMmE2LWQ0ODNhODE5MzYwZiJ9.WhujOLvauc85x4SFCugB4iuKEaAj5ZCRZbHbQ5eVMdrEsykj37F2qJjxKinOJGMDht-jIAfKi4eAVBkH5UWeYIoO9YGmro1kMNbs6Vr84pGoWBg3SPfnOZlRvO9xVF-Z7LTue_XcCN4STgOySOkdaMBgqqOhrkBDIm_fkRS3g1sSoa9fjlZhXrLQkoHX6Nrfp7VH8nvAkQ1kKqc8cdcQzVkpngtFIiYVzdr5ZzZmOn4XFxgpmzj77BUzMRkL5OpDUvDL_-XMBp2mnc1axZf-R8JnBm2K3R1OK_3l8kcMQrBkA8_BpmG32oi08gh5_H8Voi4et4_eF0cF_ngwyp51kQ"

const BASE = "https://open-gateway-sandbox.gsma.com";

// As 3 funcionalidades do PDF, com os exemplos da própria página do sandbox
const chamadas = [
  {
    nome: "Verificação de idade (o titular tem 18+?)",
    rota: "/kyc-age-verification/v0.1/verify",
    body: { phoneNumber: "+155500030", ageThreshold: 18 },
  },
  {
    nome: "Conferência de cadastro (nome e e-mail batem com a operadora?)",
    rota: "/kyc-match/v0.2/match",
    body: { phoneNumber: "+155500005", name: "John Doe", email: "john@example.com" },
  },
  {
    nome: "Tempo de linha (o número existe desde 2020?)",
    rota: "/kyc-tenure/v0.1/check-tenure",
    body: { phoneNumber: "+155500005", tenureDate: "2020-01-01" },
  },
];

async function executarTeste() {
  for (const c of chamadas) {
    try {
      const response = await fetch(BASE + c.rota, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(c.body),
      });
      const data = await response.json().catch(() => null);
      console.log(`\n=== ${c.nome}`);
      console.log(`POST ${c.rota} -> ${response.status}`);
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Erro em ${c.rota}:`, error);
    }
  }
}

executarTeste();
