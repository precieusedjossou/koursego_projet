# KourseGO — Application de livraison · Bénin 🇧🇯

Plateforme intelligente de mise en relation entre clients et coursiers.

---

## 📁 Structure du projet

```
KourseGO/          → Application mobile (React Native + Expo)
KourseGO-Admin/    → Dashboard web administrateur (React + Vite)
```

---

## 📱 Application Mobile (KourseGO)

### Stack technique
- **React Native** + **Expo** (SDK 51)
- **Expo Router** (navigation par fichiers)
- **TypeScript** strict
- **Supabase** (auth + base de données + storage)
- **Zustand** (état global)
- **react-native-maps** (géolocalisation)

### Installation

```bash
cd KourseGO
npm install
```

### Configuration

1. Copier `.env.example` en `.env`
2. Remplir `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Télécharger les fonts Poppins

Télécharger depuis https://fonts.google.com/specimen/Poppins :
- Poppins-Light.ttf
- Poppins-Regular.ttf
- Poppins-Medium.ttf
- Poppins-SemiBold.ttf
- Poppins-Bold.ttf

Placer dans `assets/fonts/`

### Lancer

```bash
npx expo start
```

---

## 🖥️ Dashboard Admin (KourseGO-Admin)

### Stack technique
- **React 18** + **Vite**
- **TypeScript** strict
- **React Router v6**
- **Recharts** (graphiques)
- **Tailwind CSS**
- **Supabase**

### Installation

```bash
cd KourseGO-Admin
npm install
```

### Configuration

Copier `.env.example` en `.env` et remplir :
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Lancer

```bash
npm run dev
# Ouvre http://localhost:5173
```

---

## 🗂️ Pages de l'application mobile

### 🔐 Authentification (`/auth`)
| Fichier | Description |
|---------|-------------|
| `login.tsx` | Connexion email/téléphone + password |
| `register.tsx` | Inscription nouveau compte |
| `otp.tsx` | Vérification OTP 4 chiffres |
| `role-choice.tsx` | Choix initial : client ou coursier |
| `kyc-coursier.tsx` | Upload document d'identité + selfie |
| `kyc-success.tsx` | Confirmation soumission KYC |

### 👤 Espace Client (`/client`)
| Fichier | Description |
|---------|-------------|
| `home.tsx` | Accueil avec 2 boutons principaux |
| `trouver-coursier.tsx` | Placeholder (à développer) |
| `commandes.tsx` | Historique commandes + filtres |
| `alertes.tsx` | Notifications |
| `profil.tsx` | Profil + basculement vers coursier |
| `commande/nouvelle.tsx` | Formulaire nouvelle course (achat/colis) |
| `commande/recapitulatif.tsx` | Résumé avant confirmation |
| `commande/confirmation.tsx` | Coursier trouvé + contact |
| `commande/paiement.tsx` | Paiement MoMo/Moov/Espèces |
| `course/suivi.tsx` | Carte temps réel |
| `course/chat.tsx` | Messagerie client-coursier |
| `course/fin.tsx` | Fin de course + notation |

### 🛵 Espace Coursier (`/coursier`)
| Fichier | Description |
|---------|-------------|
| `dashboard.tsx` | Accueil + toggle disponibilité + stats |
| `annonces.tsx` | Liste des courses disponibles |
| `gains.tsx` | Historique revenus + graphiques |
| `profil.tsx` | Profil + basculement vers client |
| `course/detail.tsx` | Détail d'une course + acceptation |
| `course/en-cours.tsx` | Navigation GPS + étapes livraison |

### 🖥️ Dashboard Admin (web)
| Page | Description |
|------|-------------|
| `LoginPage` | Connexion admin |
| `DashboardPage` | Stats globales + graphiques + validations |
| `UtilisateursPage` | Gestion comptes + suspension |
| `CoursiersPage` | Validation KYC + dossiers coursiers |
| `CommandesPage` | Suivi toutes les commandes |
| `PaiementsPage` | Flux financiers |
| `ParametresPage` | Config commissions + maintenance |

---

## 🔄 Basculement de rôle

Un utilisateur peut basculer entre **client** et **coursier** :
- **Depuis le profil client** → Switch "Passer en mode Coursier" → `/coursier/dashboard`
- **Depuis le profil coursier** → Switch "Passer en mode Client" → `/client/home`
- Nécessite que le compte soit validé côté coursier

---

## ⚠️ Modifications vs maquette Figma

| Modification | Raison |
|-------------|--------|
| "Abidjan" → "Cotonou" partout | L'app est pour le Bénin |
| Bouton "Trouver un coursier" → page placeholder | Maquette non encore terminée |
| Coursier simplifié (sans historique séparé) | Fusionné dans Gains |
| Rémunération coursier → automatique par plateforme | Selon spec PDF |
| Ajout type "récupération colis" dans formulaire | Demande utilisateur |

---

## 🗄️ Tables Supabase à créer

```sql
-- Copier les tables depuis le PDF de description :
-- UTILISATEUR, LIVREUR, DEMANDE_COURSE, COURSE,
-- CONVERSATION, MESSAGE, PAIEMENT,
-- SUIVI_LOCALISATION, AVIS, ADMIN
```

---

## 📞 Contact & Support
Application développée pour le marché béninois.
Monnaie : **FCFA** · Langue : **Français**
