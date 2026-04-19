# KourseGO — Plateforme de livraison · Bénin 🇧🇯

> Mise en relation entre clients et coursiers à Cotonou et environs.

---

## 📁 Structure du projet

```
KourseGO-PROJECT/
│
├── package.json          ← Scripts globaux (racine)
├── README.md             ← Ce fichier
│
├── mobile/               ← 📱 Application mobile (React Native + Expo)
│   ├── app/
│   │   ├── index.tsx               ← Splash screen
│   │   ├── _layout.tsx             ← Layout racine
│   │   ├── auth/                   ← Authentification
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   ├── otp.tsx
│   │   │   ├── role-choice.tsx
│   │   │   ├── kyc-coursier.tsx
│   │   │   └── kyc-success.tsx
│   │   ├── client/                 ← Espace client
│   │   │   ├── home.tsx
│   │   │   ├── commandes.tsx
│   │   │   ├── alertes.tsx
│   │   │   ├── profil.tsx
│   │   │   ├── trouver-coursier.tsx
│   │   │   ├── commande/
│   │   │   │   ├── nouvelle.tsx
│   │   │   │   ├── recapitulatif.tsx
│   │   │   │   ├── confirmation.tsx
│   │   │   │   └── paiement.tsx
│   │   │   └── course/
│   │   │       ├── suivi.tsx       ← Carte GPS temps réel
│   │   │       ├── chat.tsx        ← Messagerie
│   │   │       └── fin.tsx         ← Notation
│   │   └── coursier/               ← Espace coursier
│   │       ├── dashboard.tsx
│   │       ├── annonces.tsx
│   │       ├── gains.tsx
│   │       ├── profil.tsx
│   │       └── course/
│   │           ├── detail.tsx
│   │           └── en-cours.tsx    ← Navigation GPS étapes
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   └── Input.tsx
│   │   └── shared/
│   │       └── Header.tsx
│   ├── constants/
│   │   ├── Colors.ts               ← Palette orange KourseGO
│   │   └── Typography.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useLocation.ts
│   ├── lib/
│   │   └── supabase.ts
│   ├── store/
│   │   ├── authStore.ts            ← Zustand auth
│   │   └── commandeStore.ts        ← Zustand commande
│   ├── types/
│   │   └── index.ts                ← Tous les types TypeScript
│   ├── assets/
│   │   ├── fonts/                  ← Poppins (à télécharger)
│   │   └── images/                 ← Logos KourseGO
│   ├── app.json
│   ├── babel.config.js
│   ├── tsconfig.json
│   └── package.json
│
└── admin/                ← 🖥️ Dashboard web admin (React + Vite)
    ├── src/
    │   ├── App.tsx                 ← Router principal
    │   ├── main.tsx
    │   ├── index.css
    │   ├── components/
    │   │   └── AdminLayout.tsx     ← Sidebar + header
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── DashboardPage.tsx   ← Stats + graphiques
    │   │   ├── UtilisateursPage.tsx
    │   │   ├── CoursiersPage.tsx   ← Validation KYC
    │   │   ├── CommandesPage.tsx
    │   │   ├── PaiementsPage.tsx
    │   │   └── ParametresPage.tsx
    │   ├── lib/
    │   │   └── supabase.ts
    │   └── types/
    │       └── index.ts
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## 🚀 Installation & Lancement

### Prérequis
- Node.js >= 18
- npm >= 9
- Expo Go installé sur votre téléphone

### 1. Installer toutes les dépendances

```bash
cd KourseGO-PROJECT

# Option A — tout installer en une fois
npm run install:all

# Option B — manuellement
cd mobile && npm install
cd ../admin && npm install
```

### 2. Configurer Supabase

**Dans `mobile/`** — créer `.env` :
```
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

**Dans `admin/`** — créer `.env` :
```
VITE_SUPABASE_URL=https://VOTRE_ID.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

### 3. Télécharger les fonts Poppins

Aller sur https://fonts.google.com/specimen/Poppins et télécharger :
`Light · Regular · Medium · SemiBold · Bold`

Placer les `.ttf` dans `mobile/assets/fonts/`

### 4. Lancer

```bash
# Application mobile
npm run mobile
# → Scanner le QR code avec Expo Go

# Dashboard admin
npm run admin
# → Ouvrir http://localhost:5173
```

---

## 📱 Acteurs de l'application

| Acteur | Accès | Description |
|--------|-------|-------------|
| **Client** | App mobile | Passe des commandes de courses |
| **Coursier** | App mobile | Accepte et effectue les courses |
| **Admin** | Web (PC) | Valide les KYC, supervise la plateforme |

> Un même utilisateur peut être **client ET coursier** en basculant depuis son profil.

---

## 🔄 Flux d'une course

```
Client crée commande
    → Coursiers voient l'annonce
    → Coursier accepte
    → Client paie (MoMo / Moov / Espèces)
    → Course démarre (suivi GPS temps réel)
    → Chat client ↔ coursier
    → Coursier confirme livraison
    → Plateforme rémunère le coursier automatiquement
    → Client note le coursier (1-5 étoiles)
```

---

## 🗄️ Base de données Supabase

Tables à créer (voir `mobile/types/index.ts` pour les structures) :

```
UTILISATEUR · LIVREUR · DEMANDE_COURSE · COURSE
CONVERSATION · MESSAGE · PAIEMENT
SUIVI_LOCALISATION · AVIS · ADMIN
```

---

## ⚠️ Modifications vs maquette Figma

| Élément | Modification | Raison |
|---------|-------------|--------|
| "Abidjan" | → "Cotonou" | App pour le Bénin 🇧🇯 |
| "Trouver un coursier" | Page placeholder | Maquette non finalisée |
| Rémunération coursier | Automatique par plateforme | Spec PDF |
| Type course | Achat + Récupération colis | Demande client |
| Admin | Dashboard web séparé | Utilisé sur PC uniquement |

---

**KourseGO** · Cotonou, Bénin · 2025
