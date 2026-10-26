// Investiga por que a validação devolve 400 genérico nos finais 20-79
const { post } = require("./teste_otp");
const ID = "ea0840f3-3663-4149-bd10-c7c6b8912105";
const casos = [
  ["código 6 díg. final 25", { authenticationId: ID, code: "123425" }],
  ["código 6 díg. final 45", { authenticationId: ID, code: "123445" }],
  ["código 6 díg. final 65", { authenticationId: ID, code: "123465" }],
  ["código 4 díg. final 25", { authenticationId: ID, code: "1225" }],
  ["código 2 díg. 25", { authenticationId: ID, code: "25" }],
  ["código numérico 123425", { authenticationId: ID, code: 123425 }],
  ["outro authenticationId final 25", { authenticationId: "11111111-2222-3333-4444-555555555525", code: "123425" }],
  ["sem code", { authenticationId: ID }],
];
(async () => {
  for (const [nome, body] of casos) {
    const r = await post("/one-time-password-sms/v1/validate-code", body);
    console.log(`${nome.padEnd(32)} -> ${r.status} ${r.data === null ? "(sem corpo)" : JSON.stringify(r.data)}`);
  }
})();
