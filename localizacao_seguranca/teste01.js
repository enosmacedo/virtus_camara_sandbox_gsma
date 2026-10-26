// Substitua pela sua credencial real gerada no Sandbox (sem as < >)
const TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJEc1hnZXp3d3hnT2JZUjFxQlZ6cWpycXpuOXZTOWJBU3Jub3RxclNjX253In0.eyJleHAiOjE3OTIwNzk3NjYsImlhdCI6MTc5MjA3OTQ2NiwianRpIjoidHJydGNjOjM5OGRmYmUxLWM2NWUtYjA5ZC1mZTg4LTY2MzI2OGIwZTMxYiIsImlzcyI6Imh0dHBzOi8vb3Blbi1nYXRld2F5LXNhbmRib3guZ3NtYS5jb20vYXV0aC9yZWFsbXMvY2FtYXJhIiwic3ViIjoiMjU2ZTc5NTYtMjMwMC00YzU3LTg3MDAtNTYzMTc2M2FhMWZlIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoib2d3LTQyNGMwYzUwLTI0NDQtNDJiYy1iMzBmLTk1ODRkMzM0NGQ5OSIsInNjb3BlIjoiZGV2aWNlLXJvYW1pbmctc3RhdHVzOnJlYWQgcm9hbWluZy1zdGF0dXM6cmVhZCBkcHY6RnJhdWRQcmV2ZW50aW9uQW5kRGV0ZWN0aW9uIGxvY2F0aW9uLXZlcmlmaWNhdGlvbjp2ZXJpZnkiLCJjbGllbnRIb3N0IjoiMTAuMC4yLjc5IiwiY2xpZW50QWRkcmVzcyI6IjEwLjAuMi43OSIsImNsaWVudF9pZCI6Im9ndy00MjRjMGM1MC0yNDQ0LTQyYmMtYjMwZi05NTg0ZDMzNDRkOTkifQ.MOmK-9h4uB9PtkGhKQJ6k_1adqrCMXCC53r20DTPlWwl-TNYbOu7aqPP0H-vUOmp3c-5CN-1qCL0iWRAvfntZYOEAzgdYmAg4j3Sf7v1DQKqJ_2Zy818n6C-SJ44vjPVsbG6zG1Pz5eMOK-z7RRKxn9sJ3GSsukoB4Z335dwdhDPWz8RbqOzZgYn1eElPUxcvz3lGggqFrnCe0hGFubrRLwQ55CR1HpOHpBjMg3gJccXewVZpxY0ZKy91sj-7AsQQ_n_yUcA1ZBTobV38oRcY6hs6bIlQ_4LMq3HO9zkv25eJlBRvxBddmmMOOJ2fdfpo6lPUpXy9CGRTOP64nu08w"
const url = "https://open-gateway-sandbox.gsma.com/device-location-verification/v1/verify";

const payload = {
  device: {
    phoneNumber: "+155500015" // Número fictício do Sandbox
  },
  area: {
    areaType: "CIRCLE",
    center: {
      latitude: 45.754,
      longitude: 4.86
    },
    radius: 1000
  },
  maxAge: 120
};

const requestOptions = {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${TOKEN}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
};

async function executarTeste() {
  try {
    console.log("Enviando requisição para a API CAMARA...");
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    
    console.log("\nStatus HTTP:", response.status);
    console.log("Resposta JSON:");
    // O JSON.stringify com 'null, 2' formata a saída com quebras de linha e indentação
    console.log(JSON.stringify(data, null, 2)); 
    
  } catch (error) {
    console.error("Erro durante a requisição:", error);
  }
}

executarTeste();