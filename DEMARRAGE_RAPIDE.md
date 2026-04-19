# 🚀 Démarrage rapide KourseGO

## ✅ Commandes dans l'ordre EXACT

```bash
# 1. Aller dans le dossier mobile
cd KourseGO-V6/mobile

# 2. Installer les dépendances
npm install --legacy-peer-deps

# 3. Lancer (si connexion internet OK)
npx expo start --clear

# OU si pas de connexion (fetch failed)
npx expo start --clear --offline
```

## 📱 Scanner le QR code avec Expo Go (version 54)

---

## ❌ Erreurs corrigées dans cette version

| Erreur | Correction |
|--------|-----------|
| `react-native-worklets` manquant | Reanimated **v3.17.4** au lieu de v4 |
| `splash-icon.png` introuvable | Remplacé par `logo_orange.png` qui existe |
| `newArchEnabled: true` | Mis à **false** |
| Conflits versions | `--legacy-peer-deps` |
| `fetch failed` | Utiliser `--offline` si pas internet |
| `PlatformConstants` | `newArchEnabled: false` |

---

## 📂 Si les polices manquent

Télécharger Poppins sur https://fonts.google.com/specimen/Poppins
→ Copier les 5 fichiers `.ttf` dans `mobile/assets/fonts/`

Sans ça, l'app fonctionne quand même avec les polices système.
