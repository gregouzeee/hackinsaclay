#!/bin/bash
# Script de compilation de la présentation DermaCube

echo "Compilation de la présentation DermaCube..."

# Créer une image placeholder si elle n'existe pas
if [ ! -f "poc_screenshot.png" ]; then
    echo "Note: poc_screenshot.png manquant. Créez une capture d'écran du PoC."
    echo "En attendant, création d'un placeholder..."
    # Si ImageMagick est installé, créer un placeholder
    if command -v convert &> /dev/null; then
        convert -size 400x300 xc:white \
            -fill '#3db4b4' -draw "rectangle 10,10 390,290" \
            -fill white -pointsize 24 -gravity center \
            -annotate 0 "Capture PoC\nDermaCube Dashboard" \
            poc_screenshot.png
    fi
fi

# Compiler avec pdflatex (2 passes pour les références)
pdflatex -interaction=nonstopmode presentation.tex
pdflatex -interaction=nonstopmode presentation.tex

# Nettoyer les fichiers temporaires
rm -f *.aux *.log *.nav *.out *.snm *.toc *.vrb

echo ""
echo "Compilation terminée !"
echo "Fichier généré : presentation.pdf"
