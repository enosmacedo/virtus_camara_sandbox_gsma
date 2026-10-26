# CAMARA Sandbox — experimentos com APIs de rede

Experimentos práticos com as **APIs CAMARA** no **GSMA Open Gateway Sandbox**
(`https://open-gateway-sandbox.gsma.com`). Cada pasta é um módulo independente que
mostra uma funcionalidade de rede da operadora, sua chamada à API e um caso de uso real
(banco, seguradora, antifraude).

O material serve de base para a aula *APIs de Rede* (`aula_apis_de_rede*.pptx` / `.pdf`).

## O que é a CAMARA

A CAMARA é um projeto aberto (Linux Foundation + GSMA) que padroniza APIs para que
aplicações consultem a rede da operadora: onde está o aparelho, se o chip foi trocado,
se os dados de cadastro batem com os do titular da linha etc. O **Open Gateway** é a
iniciativa da GSMA que expõe essas APIs, e o **sandbox** é o ambiente de testes com
respostas simuladas.

## Módulos

| Pasta | API CAMARA | Endpoint(s) | Caso real |
|---|---|---|---|
| [localizacao_seguranca/](localizacao_seguranca/) | Device Location Verification | `POST /device-location-verification/v1/verify` | Antifraude de cartão: o celular do titular está perto da loja? |
| [device_location_retrieval_01/](device_location_retrieval_01/) | Device Location Retrieval | `POST /device-location-retrieval/v0.3/retrieve` | Seguradora localiza o cliente para enviar o guincho mais próximo |
| [sim_swap/](sim_swap/) | SIM Swap | `POST /sim-swap/v1/check`<br>`POST /sim-swap/v1/retrieve-date` | Banco bloqueia operações por SMS após troca recente de chip |
| [otp_sms/](otp_sms/) | One Time Password SMS | `POST /one-time-password-sms/v1/send-code`<br>`POST /one-time-password-sms/v1/validate-code` | Confirmação de login e Pix com código enviado pela operadora |
| [know_your_customer/](know_your_customer/) | KYC Match, KYC Tenure, KYC Age Verification | `POST /kyc-match/v0.2/match`<br>`POST /kyc-tenure/v0.1/check-tenure`<br>`POST /kyc-age-verification/v0.1/verify` | Abertura de conta digital sem foto de documento |

### Arquivos de cada módulo

| Arquivo | Para que serve |
|---|---|
| `teste*.js` | Chamada mínima com o exemplo da página do sandbox. Guarda o `TOKEN` do módulo e exporta as funções reutilizadas pelos outros scripts. |
| `varredura_*.js` | Testa os finais `00`–`99` do telefone e agrupa as respostas iguais, para mapear qual final gera cada cenário. |
| `varredura_resultado.txt` | Saída da varredura, com observações. |
| `sondagem_*.js` | Investigações pontuais (o sandbox considera os dados enviados? respeita o `maxAge`?). |
| `caso_real.js` | Cenário de negócio: chama a API e aplica uma regra de decisão (aprovar, bloquear, pedir confirmação...). |
| `cenario_*.svg/png` | Ilustração do cenário de negócio. |
| `diagrama_*.svg/png` | Diagrama do fluxo de chamadas à API. |

## Como rodar

Requisitos: **Node.js 18+** (usa o `fetch` nativo). Não há dependências para instalar.

1. Crie uma conta no [Open Gateway Sandbox](https://open-gateway-sandbox.gsma.com) e um app
   para cada API (ex.: `SIM_SWAP_01`, `OTP_VALIDATION`, `KNOW_YOUR_CUSTOMER_01`).
2. Clique em **Get Access Token** e cole o token na constante `TOKEN` do arquivo de teste
   do módulo:

   | Módulo | Arquivo com o `TOKEN` |
   |---|---|
   | localizacao_seguranca | `teste01.js` |
   | device_location_retrieval_01 | `teste_localizacao.js` |
   | sim_swap | `teste_sim_swap.js` |
   | otp_sms | `teste_otp.js` |
   | know_your_customer | `teste_kyc.js` |

   Os demais scripts da pasta leem o token desse arquivo.
3. Execute:

   ```bash
   cd sim_swap
   node teste_sim_swap.js      # chamada de exemplo
   node varredura_sim_swap.js  # mapeia os cenários pelos finais 00-99
   node caso_real.js           # cenário de negócio
   ```

> O token expira em poucos minutos. Quando aparecer `401 UNAUTHENTICATED` em todos os
> números, gere um novo token.

## Como o sandbox simula as respostas

No sandbox não existe rede real: **os 2 últimos dígitos do telefone definem a resposta**
(no OTP, a validação usa os 2 últimos dígitos do *código*). Os finais `90`–`93` costumam
gerar os erros `400`, `401`, `404` e `503`. O mapa completo de cada API está no
`varredura_resultado.txt` do módulo. Resumo:

**Device Location Retrieval**

| Finais | Resposta |
|---|---|
| 00–49, 94–99 | `200` área em círculo (raio 800 m) |
| 50–89 | `200` área em polígono |
| 90 / 91 / 92 / 93 | `400` / `401` / `404 DEVICE_NOT_FOUND` / `503` |

**SIM Swap**

| Finais | `check` | `retrieve-date` |
|---|---|---|
| 10–19 | `swapped: true` | troca há 5 dias |
| 20–29 | `swapped: true` | troca há 30 dias |
| 00–09, 30–89, 94–99 | `swapped: false` | `latestSimChange: null` |
| 90 / 91 / 92 / 93 | `400` / `401` / `404` / `503` | idem |

**OTP SMS**

| Finais do telefone (`send-code`) | Resposta |
|---|---|
| 00–19, 80–81, 83–89, 94–99 | `200` com `authenticationId` |
| 20–39 | `403 MAX_OTP_CODES_EXCEEDED` |
| 40–59 | `403 PHONE_NUMBER_NOT_ALLOWED` |
| 60–79, 82 | `403 PHONE_NUMBER_BLOCKED` |

| Finais do código (`validate-code`) | Resposta |
|---|---|
| 00–19, 80–89, 97–99 | `204` código aceito |
| 20–79, 90, 94–96 | `400 INVALID_ARGUMENT` |

**KYC** — Match (`00–09` tudo confere, `40–59` nada confere, `60–69` indisponível, `94` exige
documento), Tenure (`00–49` linha antiga, `50–79` linha recente, com tipos de contrato
diferentes) e Age (`00–19` maior de idade, `30–49` menor, `50–59` indisponível). Detalhes em
[know_your_customer/varredura_resultado.txt](know_your_customer/varredura_resultado.txt) e
[know_your_customer/resumo_kyc.html](know_your_customer/resumo_kyc.html).

### Limitações observadas no sandbox

- **SIM Swap:** o `check` ignora a janela `maxAge` (finais 10–29 sempre dão `swapped: true`);
  `maxAge` só aceita 1 a 2400 horas.
- **Location Retrieval:** a posição vem sempre com o horário atual, então o caso
  "localização antiga" não aparece.
- **OTP SMS:** nenhum SMS é enviado, e a validação só distingue aceito (`204`) de recusado
  (`400` genérico); os erros "código expirado" e "tentativas demais" da especificação não
  ocorrem.
- **KYC:** a resposta depende só do final do número, não dos dados enviados (nome, e-mail,
  data).
- Falhas passageiras (`500` ou `400`) aparecem às vezes; repetir a chamada resolve.

## Outros arquivos

- `aula_apis_de_rede.pptx` / `.pdf`, `aula_apis_de_rede_virtus.pptx` — slides da aula.
- `reuniao16102026.pptx` — apresentação da reunião de 16/10.
- `localizacao_seguranca/Open Gateway Sandbox.pdf` — referência do sandbox.
