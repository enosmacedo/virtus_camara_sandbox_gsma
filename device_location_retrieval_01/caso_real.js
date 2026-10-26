// Caso real: assistência 24h de uma seguradora.
// O carro do cliente quebra na estrada e ele aperta "Pedir guincho" no app
// (autorizando a consulta). A seguradora pergunta à operadora onde está o celular,
// recebe uma área aproximada (círculo ou polígono) e envia o guincho mais próximo.
//
// No sandbox, os 2 últimos dígitos do telefone definem a resposta (ver varredura_resultado.txt):
//   00-49 e 94-99 -> círculo de 800 m | 50-89 -> polígono | 90 -> 400 | 91 -> 401 | 92 -> 404 | 93 -> 503
// A posição vem sempre com o horário atual, então o caso "posição antiga" não aparece no sandbox.

const { localizar } = require("./teste_localizacao");

const MAX_AGE = 600;          // aceita localização de até 10 minutos atrás
const RAIO_PRECISO = 2000;    // até 2 km: dá para mandar o guincho direto

// Bases de guincho da seguradora
const guinchos = [
  { nome: "Guincho Lyon Centro",  lat: 45.7640, lon: 4.8357 },
  { nome: "Guincho Villeurbanne", lat: 45.7719, lon: 4.8902 },
  { nome: "Guincho Vénissieux",   lat: 45.6975, lon: 4.8867 },
];

const chamados = [
  { id: "SOS-01", cliente: "Carla",  telefone: "+5511987650025" }, // círculo
  { id: "SOS-02", cliente: "Marcos", telefone: "+5511987650055" }, // polígono
  { id: "SOS-03", cliente: "Rafael", telefone: "+5511987650092" }, // aparelho não localizado (sem sinal)
  { id: "SOS-04", cliente: "Diego",  telefone: "+5511987650093" }, // serviço indisponível
  { id: "SOS-05", cliente: "Lucas",  telefone: "+5511987650091" }, // credencial inválida
  { id: "SOS-06", cliente: "Elisa",  telefone: "+5511987650090" }, // requisição inválida
];

// Distância em km entre dois pontos (fórmula de Haversine)
function distanciaKm(a, b) {
  const R = 6371, rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Converte a área devolvida (círculo ou polígono) em centro + raio aproximado
function centroERaio(area) {
  if (area.areaType === "CIRCLE")
    return { lat: area.center.latitude, lon: area.center.longitude, raio: area.radius };
  if (area.areaType === "POLYGON") {
    const pts = area.boundary.map((p) => ({ lat: p.latitude, lon: p.longitude }));
    const c = { lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length, lon: pts.reduce((s, p) => s + p.lon, 0) / pts.length };
    const raio = Math.round(Math.max(...pts.map((p) => distanciaKm(c, p))) * 1000);
    return { ...c, raio };
  }
  return null;
}

// Regra de negócio
function decidir(r) {
  if (r.status !== 200) {
    const codigo = r.data?.code ?? "";
    if (r.status === 404) return { decisao: "LIGAR PARA O CLIENTE", motivo: `Operadora não localizou o aparelho (${codigo}).` };
    if (r.status === 403) return { decisao: "PEDIR GPS PELO APP", motivo: `Sem permissão para localizar pela operadora (${codigo}).` };
    if (r.status === 503) return { decisao: "LIGAR PARA O CLIENTE", motivo: "Serviço da operadora indisponível no momento." };
    if (r.status === 401) return { decisao: "LIGAR PARA O CLIENTE", motivo: "Credencial da seguradora recusada. Avisar a equipe técnica." };
    return { decisao: "LIGAR PARA O CLIENTE", motivo: `Consulta recusada (${r.status} ${codigo}).` };
  }

  // Posição antiga demais não serve para mandar guincho
  const idadeSeg = (Date.now() - Date.parse(r.data.lastLocationTime.replace(/\+0000$/, "Z"))) / 1000;
  if (idadeSeg > MAX_AGE)
    return { decisao: "LIGAR PARA O CLIENTE", motivo: `Última posição é de ${Math.round(idadeSeg / 60)} min atrás.` };

  const area = centroERaio(r.data.area);
  if (!area) return { decisao: "LIGAR PARA O CLIENTE", motivo: "Formato de área desconhecido." };

  const maisProximo = guinchos
    .map((g) => ({ ...g, km: distanciaKm(area, g) }))
    .sort((a, b) => a.km - b.km)[0];
  const minutos = Math.round((maisProximo.km / 40) * 60) + 10; // 40 km/h médio + 10 min de saída
  const forma = r.data.area.areaType === "CIRCLE" ? "círculo" : "polígono";
  const onde = `${forma} de ~${area.raio} m em (${area.lat.toFixed(4)}, ${area.lon.toFixed(4)})`;

  if (area.raio <= RAIO_PRECISO)
    return { decisao: "ENVIAR GUINCHO", motivo: `${maisProximo.nome}, ${maisProximo.km.toFixed(1)} km, chega em ~${minutos} min. Área: ${onde}.` };
  return { decisao: "ENVIAR E CONFIRMAR", motivo: `Área grande (${onde}). Enviar ${maisProximo.nome} e ligar para pegar um ponto de referência.` };
}

(async () => {
  for (const c of chamados) {
    const r = await localizar(c.telefone, MAX_AGE);
    const { decisao, motivo } = decidir(r);
    console.log(`${c.id} | ${c.cliente.padEnd(6)} | ${c.telefone}`);
    console.log(`        operadora: ${r.status}${r.data?.lastLocationTime ? " · posição de " + r.data.lastLocationTime : ""}`);
    console.log(`        -> ${decisao}: ${motivo}\n`);
  }
})();
