## Problème détecté

L'ajout de l'app mobile a écrasé le design system du dashboard admin :

1. `src/index.css` applique globalement `body { background: #1E3A5F; color: white; }` → tout l'admin se retrouve sur fond navy avec texte blanc.
2. `tailwind.config.ts` a été réécrit : suppression des tokens admin (`brand-bg`, `brand-primary-soft`, `gray-50/100/.../900`, `border`, `shadow-glow-primary`, etc.).
3. Les variables HSL `--brand-primary`, `--brand-primary-soft`, `--gray-500`, `--border`… ne sont plus déclarées (les pages admin font `hsl(var(--brand-primary))`, `hsl(var(--gray-500))`…).
4. Les classes utilitaires admin `dg-stat-icon`, `dg-btn-ghost`, `dg-card`, etc. ont disparu de `index.css`.

Résultat : `Overview`, `Transactions`, `Clients`, `Litiges`, `Revenus`, `Expansion`, `Sidebar`, `Header` s'affichent cassés.

## Plan de restauration

Objectif : remettre l'admin à son état d'origine (fond clair `#F9FAFB`, orange #FF6600, navy #0C1A2B sur la sidebar, cartes blanches premium) **sans toucher** à l'app mobile `/app/*`.

### 1. `src/index.css` — réintroduire le design admin

- Retirer les styles globaux qui forcent `body { background:navy; color:white }`.
- Définir `body` en thème admin clair par défaut : `background: #F9FAFB; color: #111827;`.
- Déclarer dans `:root` toutes les variables HSL attendues par l'admin :
  - `--brand-primary`, `--brand-primary-hover`, `--brand-primary-soft`
  - `--brand-navy`, `--brand-navy-light`
  - `--gray-50 … --gray-900`
  - `--border`, `--background`, `--foreground`, `--card`, `--muted` (shadcn)
- Restaurer les classes utilitaires admin : `.dg-card`, `.dg-stat-icon`, `.dg-btn-ghost`, `.dg-btn-primary`, ombres `shadow-glow-primary`, `animate-fade-in`.
- Conserver les classes mobile (`.glass`, `.glass-card`, `.glass-dark`, `.btn-primary`, `.app-bg`, `.pb-safe`) — utilisées seulement dans `/app/*`.
- Scoper le fond mobile sombre via `.app-bg` (déjà fait) — l'admin n'utilise pas `.app-bg` donc reste clair.

### 2. `tailwind.config.ts` — fusionner les deux palettes

Réintroduire les tokens admin **en plus** des tokens mobile actuels :
- `brand.bg`, `brand.primary-soft`, `brand.primary-hover` (déjà là), `brand.navy` (déjà là)
- échelle `gray.50 → gray.900` mappée sur `hsl(var(--gray-*))`
- `border`, `background`, `foreground`, `card`, `muted` (shadcn)
- `boxShadow.glow-primary`
- `keyframes.fade-in` + `animation.fade-in`
- Garder `glass.*`, `backdropBlur.glass`, `shadow.glass*`, `shadow.glow-orange` pour le mobile.

### 3. Vérification

- Recharger `/` (Overview admin) → fond clair `#F9FAFB`, KPI en cartes blanches, accent orange, sidebar navy.
- Vérifier `/transactions`, `/clients`, `/litiges`, `/revenus`, `/expansion`.
- Recharger `/app/home` → app mobile inchangée (fond navy dégradé orange via `.app-bg`).

### Hors scope

- Aucune modification fonctionnelle (routes, hooks, Supabase, paiements).
- Aucune modif des pages `/app/*` ni `src/app-mobile/**`.
- Pas de retouche du contenu admin, uniquement les tokens / CSS globaux.