#!/bin/bash
# scripts/download-fonts.sh
# Lance ce script UNE FOIS pour télécharger les polices Poppins
# Usage : bash scripts/download-fonts.sh

FONTS_DIR="./assets/fonts"
mkdir -p "$FONTS_DIR"

BASE_URL="https://github.com/google/fonts/raw/main/ofl/poppins"

echo "📥 Téléchargement des polices Poppins..."

declare -A FONTS=(
  ["Poppins-Light.ttf"]="Poppins-Light.ttf"
  ["Poppins-Regular.ttf"]="Poppins-Regular.ttf"
  ["Poppins-Medium.ttf"]="Poppins-Medium.ttf"
  ["Poppins-SemiBold.ttf"]="Poppins-SemiBold.ttf"
  ["Poppins-Bold.ttf"]="Poppins-Bold.ttf"
)

for font in "${!FONTS[@]}"; do
  dest="$FONTS_DIR/${FONTS[$font]}"
  if [ -f "$dest" ]; then
    echo "  ✅ $font déjà présent"
  else
    echo "  ⬇️  Téléchargement de $font..."
    curl -L -o "$dest" "$BASE_URL/$font" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "  ✅ $font téléchargé"
    else
      echo "  ❌ Erreur pour $font"
    fi
  fi
done

echo ""
echo "✅ Polices prêtes dans $FONTS_DIR"
echo "👉 Lance maintenant : npx expo start"
