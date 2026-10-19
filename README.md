# 11e Heure Tabernacle — Site Web Vitrine Officiel

Site web vitrine moderne, responsive, élégant et spirituellement inspirant pour l'église chrétienne **11e Heure Tabernacle**, située à Pointe-Noire en République du Congo, sous la conduite pastorale du **Pasteur Odilon Detchibs**.

---

## 🕊️ Identité et Vision

- **Nom de l'église :** 11e Heure Tabernacle
- **Pasteur principal :** Odilon Detchibs
- **Localisation :** Voungou 1, Bank de Vie, arrêt 1er Pont, en face d'Emanuel Photo — Pointe-Noire, République du Congo
- **Ligne téléphonique :** `+242 06 937 69 67`
- **WhatsApp direct :** `+242 06 937 69 67`
- **Slogan officiel :** *« Une foi restaurée, un amour renouvelé, une espérance vivante. »*
- **Déclaration de mission :**
  > « *Restaurer la foi des apôtres, restaurer l’amour divin au moyen du Saint-Esprit, pour la restauration de la foi de l’enlèvement.* »

---

## 🎨 Charte Graphique & Design Émotionnel

- **Blanc pur (`#FFFFFF`) :** Pureté, lumière et paix céleste.
- **Bleu ciel (`#38bdf8`, `#0284c7`, `#e0f2fe`) :** Espérance, sérénité, ciel ouvert et confiance.
- **Bleu profond (`#0c4a6e`, `#082f49`, `#0369a1`) :** Autorité spirituelle, solennité des titres et navigation.
- **Or divin (`#eab308`, `#facc15`) :** Touches discrètes pour la gloire et l'excellence.
- **Typographies :**
  - Titres spirituels & emblème : *Cinzel* & *Playfair Display*
  - Corps de texte et interface utilisateur : *Plus Jakarta Sans*

---

## 🌟 Fonctionnalités Incluses

1. **Section Hero immersive avec animation Ken Burns :**
   - Arrière-plan panoramique de sanctuaire d'église avec zoom lent fluide en CSS pur.
   - Superposition de dégradés bleu ciel et bleu profond assurant un contraste et une lisibilité parfaits.
   - Respect natif de la directive d'accessibilité `prefers-reduced-motion`.
2. **Section À Propos & 6 Piliers Fondamentaux :**
   - La foi apostolique
   - L'amour divin
   - La communion fraternelle
   - La prière
   - L'action du Saint-Esprit
   - L'enlèvement de l'Église
3. **Section Notre Mission :**
   - Bloc solennel avec typographie expressive et cartes pour les 3 axes fondateurs.
4. **Horaires et Programmes des Cultes Officiels :**
   - **Mardi :** 18h00 – 19h30 *(Culte en semaine & enseignement)*
   - **Jeudi :** 18h00 – 19h30 *(Prière & intercession)*
   - **Dimanche (École du dimanche) :** 08h00 – 09h30 *(Jeunesse & Enfants)*
   - **Dimanche (Culte principal) :** 10h00 – 12h30 *(Célébration & Sainte Cène)*
5. **Verset Biblique du Jour (API HelloAO + Fuseau Pointe-Noire) :**
   - Connexion à l'API publique ouverte **HelloAO** (version française *Louis Segond 1910*).
   - Prise en compte du fuseau horaire de **Pointe-Noire (`Africa/Brazzaville` / UTC+1)** pour actualiser le verset chaque nuit à minuit locale.
   - Mise en cache quotidienne dans `localStorage` pour un chargement instantané.
   - Bouton interactif *« Découvrir un autre verset »* pour enrichir la méditation.
   - Base de repli (fallback) intégrée pour garantir 100% de disponibilité même hors-ligne.
6. **Galerie Photos Interactive & Visionneuse (Lightbox) :**
   - Grille responsive avec système de filtres par catégories (*Tous, Cultes, Prière, École du dimanche, Jeunesse*).
   - Visionneuse modale plein écran avec flèches précédent/suivant, légende détaillée, compteur, fermeture au clavier (`Échap`), raccourcis flèches et support du glissement tactile (swipe) sur smartphone.
7. **Section Dédiée au Pasteur Odilon Detchibs :**
   - Portrait noble et respectueux, présentation sobre et vérifiée, exhortation pastorale et contact WhatsApp en un clic.
8. **Contact & Localisation :**
   - Coordonnées complètes, repères géographiques et carte interactive OpenStreetMap intégrée.
   - Liens officiels vers Facebook (*Odilon Tchibounga*) et YouTube (*odilon de tchib*).
   - Formulaire de contact avec validation JavaScript côté client, message explicatif transparent et bouton direct de transmission sur WhatsApp préformaté.
9. **Pied de page complet & Bouton flottant WhatsApp :**
   - Copyright automatique en JavaScript (`new Date().getFullYear()`).
   - Bouton d'accès rapide WhatsApp en bas à droite de l'écran avec pulsation douce.

---

## 📁 Structure du Projet

```
11e Tabernacle/
├── index.html               # Structure sémantique HTML5 complète
├── style.css                # Styles CSS sur mesure, animations Ken Burns, Lightbox
├── script.js                # Logique JavaScript (Menu, API Verset, Galerie, Formulaire)
├── README.md                # Guide complet du projet
└── assets/
    └── images/
        ├── logo.svg         # Emblème vectoriel personnalisé de l'église (XIe Heure, Croix, Colombe)
        ├── favicon.svg      # Favicon haute résolution
        ├── hero-bg.jpg      # Sanctuaire lumineux haute résolution (fond Hero Ken Burns)
        ├── pastor-odilon.jpg # Portrait du Pasteur Odilon Detchibs
        ├── communion.jpg    # Assemblée en célébration et louange
        ├── choir.jpg        # Chœur et groupe de louange
        ├── prayer.jpg       # Fidèles en prière et intercession
        ├── sunday-school.jpg # Enfants à l'école du dimanche
        ├── youth.jpg        # Rencontre fraternelle de jeunesse
        └── bible.jpg        # Sainte Bible ouverte sous la lumière divine
```

---

## 🚀 Lancement en Local

Le projet ne nécessite aucune installation complexe ni base de données. Il fonctionne immédiatement dans n'importe quel navigateur moderne.

### Méthode 1 : Ouverture directe
Double-cliquez simplement sur le fichier `index.html` ou ouvrez-le avec votre navigateur préféré (Chrome, Edge, Firefox, Safari).

### Méthode 2 : Avec un serveur local (Recommandé pour tester les requêtes API)
Dans le dossier du projet, lancez avec Node.js :
```bash
npx serve .
# ou avec Python :
python -m http.server 8000
```
Puis accédez à `http://localhost:8000` dans votre navigateur.

---

## 🌐 Déploiement en Ligne (Production)

Ce site statique haute performance peut être hébergé gratuitement et en quelques secondes sur :
- **Vercel :** Glissez-déposez simplement le dossier dans le dashboard Vercel.
- **Netlify :** Drag & drop du dossier dans [app.netlify.com/drop](https://app.netlify.com/drop).
- **GitHub Pages :** Poussez les fichiers sur une branche `main` et activez GitHub Pages dans les paramètres du dépôt.
- **Hébergement cPanel / Apache / Nginx :** Copiez tous les fichiers du dossier dans `public_html`.

---

## ✏️ Personnalisation Simple

1. **Remplacer les photos par les photos réelles de l'église :**
   Il suffit de déposer vos photos dans `assets/images/` en conservant les mêmes noms de fichiers (`hero-bg.jpg`, `pastor-odilon.jpg`, etc.) ou en modifiant les chemins dans `index.html`.
2. **Mettre à jour les liens des réseaux sociaux :**
   Dans `index.html`, recherchez les balises `<a>` relatives à Facebook et YouTube pour insérer les liens exacts de vos pages/chaînes officielles dès que vous les aurez validés.

---

*Que toute la gloire revienne à Dieu.*  
*11e Heure Tabernacle — Pointe-Noire, République du Congo.*
