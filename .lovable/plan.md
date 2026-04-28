## DÉPANN'GO — App Mobile Client (v1 MVP)

Ajout de l'app mobile **Client** au projet existant, sans toucher au dashboard admin actuel.

### Architecture de routing

```text
/                    → Admin Dashboard Overview (inchangé)
/admin/*             → toutes les pages admin actuelles déplacées sous /admin
/app                 → AppShell mobile (BrowserRouter + bottom nav)
  /app/onboarding    → 3 slides
  /app/auth          → téléphone + OTP
  /app/home          → accueil client
  /app/nouvelle-demande → wizard 5 étapes
  /app/diagnostic/:id → résultat IA (DEPA)
  /app/reparateurs   → liste + carte Leaflet
  /app/reparateur/:id → profil détaillé
  /app/reservation/:id → confirmation + acompte
  /app/suivi/:id     → timeline temps réel
```

> **Note importante** : actuellement `/` pointe vers Overview (admin). Pour ne rien casser, on garde l'admin sur `/` mais on ajoute un toggle dans la sidebar admin "Voir l'app client" qui mène à `/app`. L'app mobile vit sur `/app/*` avec son propre AppShell (mobile-first 375px, pas de sidebar admin).

### Périmètre v1 (Tunnel client minimum viable)

Écrans inclus :
1. Onboarding (3 slides animés Framer Motion)
2. Auth téléphone CI + OTP Supabase
3. Accueil client (recherche, catégories, réparateurs proches)
4. Créer une demande (wizard 5 étapes)
5. Diagnostic IA DEPA (appel edge function `diagnostic-ia`)
6. Liste réparateurs (Leaflet + cards triables)
7. Profil réparateur
8. Confirmation + acompte (calcul auto, simulation paiement)
9. Suivi mission temps réel (Supabase realtime)

Reportés en v2 : chat in-app, paiement final, notation, historique, app réparateur complète.

### Design system

- **Couleurs** : on étend les tokens existants — orange `#FF6600` déjà présent, ajout du navy `#0C1A2B` comme `--brand-navy`
- **Glassmorphism** : nouvelle classe utilitaire `.dg-glass` (backdrop-blur + bg/60)
- **Typo** : Inter (déjà chargée), ajout de Plus Jakarta Sans optionnel
- **Mobile-first** : AppShell `max-w-[430px]` centré, safe-area iOS, bottom nav fixe
- **Tokenisation stricte** : toutes les couleurs via HSL tokens (règle mémoire respectée)

### Stack ajoutée

| Lib | Usage |
|---|---|
| `framer-motion` | Animations onboarding, transitions wizard, timeline |
| `leaflet` + `react-leaflet` | Carte gratuite OpenStreetMap |
| `react-hook-form` + `zod` | Validation wizard demande |

Déjà présents : Supabase client externe (`supabaseExternal.ts`), React Query, React Router, Lucide, Shadcn.

### Auth Supabase

- Auth par téléphone (`signInWithOtp({ phone })`) sur le client externe `zlmuzknxabuoeilodpad.supabase.co`
- OTP 6 chiffres SMS
- Persist session (`persistSession: true` — à activer pour ce flux, séparé du client admin actuel qui reste read-only)
- Création/MAJ du profil dans `profiles` après OTP (full_name, role='client', quartier)
- Hook `useAuthClient()` partagé sur `/app/*`

### Edge Functions

- `diagnostic-ia` : déjà câblé via `callDiagnosticIA()` dans `supabaseExternal.ts` — utilisé à l'étape 5

### Règles métier respectées

- Commission 7% : constante `COMMISSION_RATE` déjà définie
- Acompte calculé via `calculateDeposit()` déjà présent (50/40/30%)
- Devise FCFA via `formatFCFA()` déjà présent
- 3 méthodes paiement : Wave / Orange Money / MTN MoMo (UI uniquement v1)

### Composants mobile réutilisables (à créer)

- `MobileShell` — wrapper 430px + safe area
- `BottomNav` — Accueil / Demandes / Missions / Profil
- `CategoryCard`, `RepairerCard`, `MissionTimeline`
- `OtpInput` (réutilise `input-otp` shadcn déjà installé)
- `PaymentMethodSheet` — bottom sheet Wave/OM/MoMo
- `LoadingDots`, `EmptyState`, `Toast` (sonner déjà OK)

### Détails techniques

- **Routing** : déplacer les routes admin sous `/admin/*`, ajouter `<Route path="/app/*" element={<MobileApp />} />` avec routes imbriquées
- **Géoloc** : `navigator.geolocation` avec fallback quartier San Pedro choisi manuellement (les 7 quartiers déjà en mémoire)
- **Realtime suivi** : `supabaseExt.channel('tx-:id').on('postgres_changes')` sur table `transactions`
- **Upload photos** : Supabase Storage bucket `transaction-photos` (à créer si absent — sinon fallback base64 local v1)
- **Filtres tri** : distance (Haversine côté client depuis lat/lng réparateur), note, prix
- **Diagnostic IA** : loader animé Framer Motion 3-5s pendant l'appel edge function, résultat parsé en sections

### Fichiers principaux à créer

```text
src/
  app-mobile/
    MobileApp.tsx              ← router /app/*
    MobileShell.tsx
    BottomNav.tsx
    pages/
      Onboarding.tsx
      Auth.tsx
      Home.tsx
      NouvelleDemande.tsx      ← wizard 5 steps
      DiagnosticIA.tsx
      Reparateurs.tsx          ← Leaflet + liste
      ReparateurProfil.tsx
      Reservation.tsx          ← acompte + paiement simulé
      Suivi.tsx                ← timeline realtime
    components/
      CategoryGrid.tsx
      RepairerCard.tsx
      OtpForm.tsx
      PaymentSheet.tsx
      MissionTimeline.tsx
    hooks/
      useAuthClient.ts
      useGeolocation.ts
      useNearbyRepairers.ts
      useTransactionRealtime.ts
src/lib/
  supabaseExternal.ts          ← activer persistSession pour auth client
  haversine.ts                 ← calcul distance
src/index.css                  ← ajouter --brand-navy + .dg-glass
```

### Hors scope v1 (à confirmer pour v2)

- Chat WhatsApp-like + filter-message
- Paiement final + notation
- Historique missions
- App Réparateur complète (6 écrans)
- Vrai paiement mobile money (CinetPay/Hub2)
- Notifications WhatsApp admin sur events critiques

Une fois cette v1 livrée et validée sur ton téléphone, on enchaîne v2.
