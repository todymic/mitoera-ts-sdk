# @mitoera/sdk

SDK officiel de la plateforme de billetterie **Mitoera**, pour Node.js et le navigateur.

- Deux entrées distinctes : `@mitoera/sdk` (serveur) et `@mitoera/sdk/browser` (widget)
- TypeScript natif, double sortie ESM + CommonJS, types inclus
- Aucune dépendance de production

## Installation

```bash
npm install @mitoera/sdk
```

Node.js **18 ou plus** (le SDK s'appuie sur `fetch` global).

## Côté serveur

L'entrée principale est réservée au back-end : elle construit un en-tête HTTP Basic à partir de vos identifiants, qui ne doivent jamais atteindre le navigateur.

```ts
import { MitoeraClient } from '@mitoera/sdk';

const client = new MitoeraClient({
  keyId:  process.env.MITOERA_KEY_ID!,  // pk_live_xxx  |  pk_test_xxx
  secret: process.env.MITOERA_SECRET!,  // sk_xxx
});

const session = await client.sessions.create(eventId);
await client.holds.hold(eventId, ['A1', 'A2'], session.holdToken);
```

### Options

| Option | Type | Défaut | Rôle |
|---|---|---|---|
| `keyId` | `string` | — | Requis. `pk_live_…` ou `pk_test_…` |
| `secret` | `string` | — | Requis. `sk_…` |
| `baseUrl` | `string` | `https://api.mitoera.com` | URL de l'API |
| `mode` | `'sandbox' \| 'production'` | déduit de la clé | Ne change pas les routes |
| `timeoutMs` | `number` | `30000` | Délai par requête |

### Sous-clients

`client.events`, `client.charts`, `client.categories`, `client.holds`, `client.sessions`, `client.workspaces`, `client.apiKeys`, `client.reporting`.

### Erreurs

Toutes les exceptions dérivent de `MitoeraException`. Une réponse HTTP ≥ 400 lève un `ApiException` qui expose `statusCode` et `body` — consultez-les plutôt que `message`, qui se réduit à `HTTP <code>` quand l'API ne renvoie pas de corps exploitable.

```ts
import { ApiException } from '@mitoera/sdk';

try {
  await client.charts.get(chartId);
} catch (err) {
  if (err instanceof ApiException) {
    console.error(err.statusCode, err.body);
  }
}
```

Un `401` signifie que l'API a bien été jointe et qu'elle a rejeté le couple `keyId`/`secret` — typiquement une clé révoquée ou expirée. Une `baseUrl` erronée produit un `404` ou une erreur réseau, jamais un `401`.

## Côté navigateur

L'entrée `/browser` ne contient aucun code Node et n'embarque jamais votre `secret`. Elle consomme le `sessionToken` émis par votre back-end.

```ts
import { SeatingChart } from '@mitoera/sdk/browser';

new SeatingChart({
  divId:        'chart',
  workspaceKey: 'pk_live_xxx',   // clé publique uniquement
  event:        'concert-2026',
  onSelectionChange: (seats) => console.log(seats),
});
```

`ChartDesigner` est l'équivalent pour l'éditeur de plans.

## Sandbox et production

Les deux environnements partagent le même hôte et le même préfixe `/api`. L'aiguillage se fait au reverse proxy, selon **deux règles** :

1. Si les identifiants voyagent dans l'en-tête `Authorization: Basic`, le préfixe de la clé suffit — `pk_test_` route vers la sandbox, `pk_live_` vers la production. C'est le cas de **tous** les appels serveur du SDK.
2. Si l'appel n'est pas en Basic — l'échange `embed-token` du navigateur, où les identifiants passent dans le corps JSON — le proxy ne voit aucun préfixe et l'en-tête `X-Api-Mode: sandbox` devient le seul aiguillage possible. Le SDK le pose automatiquement dans `ChartDesigner`.

Vous n'avez donc jamais à gérer `X-Api-Mode` vous-même.

## Développement

```bash
npm run lint    # tsc --noEmit
npm test        # jest
npm run build   # ESM (tsc) puis CommonJS (scripts/build-cjs.mjs)
```

## Licence

MIT
