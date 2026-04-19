# 🚀 Guide de démarrage KourseGO — Expo Go

## Problèmes courants & solutions

---

## ✅ Étape 1 — Installer les dépendances

```bash
cd KourseGO-PROJECT/mobile
npm install
```

---

## ✅ Étape 2 — Télécharger les polices Poppins

### Option A — Script automatique (recommandé)
```bash
bash scripts/download-fonts.sh
```

### Option B — Manuel
1. Aller sur https://fonts.google.com/specimen/Poppins
2. Cliquer **"Download family"**
3. Extraire le ZIP
4. Copier ces 5 fichiers dans `assets/fonts/` :
   - `Poppins-Light.ttf`
   - `Poppins-Regular.ttf`
   - `Poppins-Medium.ttf`
   - `Poppins-SemiBold.ttf`
   - `Poppins-Bold.ttf`

> ⚠️ Si tu sautes cette étape, l'app fonctionne quand même avec les polices système (pas d'erreur bloquante grâce au fallback).

---

## ✅ Étape 3 — Configurer Supabase

Créer le fichier `.env` à la racine du dossier `mobile/` :

```
EXPO_PUBLIC_SUPABASE_URL=https://TON_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=ta_cle_anon
```

> Sans cette étape, l'app fonctionne en mode démo avec les données fictives.

---

## ✅ Étape 4 — Lancer

```bash
npx expo start
```

Puis scanner le QR code avec **Expo Go** (version 52+) sur ton téléphone.

---

## ❌ Erreurs fréquentes & solutions

### Erreur : "Unable to resolve module ... from assets/fonts"
**Cause** : Les fichiers `.ttf` sont absents.
**Solution** : Lance `bash scripts/download-fonts.sh` OU l'app démarre quand même avec les polices système.

### Erreur : "SDK 52 is not supported"
**Cause** : Version Expo Go trop ancienne.
**Solution** : Mettre à jour Expo Go sur ton téléphone depuis le Play Store / App Store.

### Erreur : "Metro bundler failed"
**Solution** :
```bash
npx expo start --clear
```

### Erreur : "Module not found: react-native-webview"
**Solution** :
```bash
npx expo install react-native-webview
```

### Erreur avec `@react-native-async-storage`
**Solution** :
```bash
npx expo install @react-native-async-storage/async-storage
```

### L'app est lente au premier lancement
**Normal** — Metro bundle tous les fichiers. Les lancements suivants sont plus rapides.

---

## Structure du projet

```
mobile/
├── app/                  ← Toutes les pages (Expo Router)
│   ├── index.tsx         ← Splash screen
│   ├── auth/             ← Connexion, inscription, OTP, KYC
│   ├── client/           ← Espace client complet
│   └── coursier/         ← Espace coursier complet
├── assets/
│   ├── fonts/            ← Poppins (à télécharger)
│   └── images/           ← Logos KourseGO
├── components/
│   ├── ui/               ← Button, Input
│   └── shared/           ← Header, MapWebView
├── constants/            ← Colors, Typography
├── hooks/                ← useAuth, useLocation
├── lib/                  ← supabase.ts
├── store/                ← Zustand (auth, commande)
├── types/                ← TypeScript types
└── scripts/
    └── download-fonts.sh ← Script téléchargement polices
```

---

## Tester sans Supabase

L'app fonctionne en **mode démo** sans Supabase :
- Toutes les pages sont navigables
- Les données sont fictives (hardcodées)
- Les boutons de connexion redirigent directement vers l'accueil

---

**KourseGO** · Cotonou, Bénin 🇧🇯
