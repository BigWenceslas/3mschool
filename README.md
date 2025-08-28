# 🌀 3 Mages - Plateforme Spirituelle

Plateforme web moderne pour la gestion de l'association spirituelle 3 Mages.

## 🚀 Installation Simple

### Prérequis
- Node.js (version 18+)
- MongoDB (local ou cloud)

### Démarrage Rapide

1. **Cloner et installer** :
```bash
git clone <repo-url>
cd 3_mages
npm install
```

2. **Démarrer** :
```bash
npm run dev
```

3. **Ouvrir** : http://localhost:3000

**C'est tout ! 🎉**

## 📋 Fonctionnalités

- ✅ **Authentification complète** (inscription/connexion)
- ✅ **Gestion des profils spirituels**
- ✅ **Tableau de bord personnalisé**
- ✅ **Système de rôles** (Admin/Membre)
- ✅ **Interface responsive**

## 🔑 Connexion Initiale

Le système crée automatiquement un compte admin :
- **Email** : admin@3mages.org
- **Password** : admin123456

## ⚙️ Configuration

### MongoDB
Par défaut, l'application se connecte à `mongodb://localhost:27017/3mages`.

Pour changer, modifiez le fichier `.env.local` :
```env
MONGODB_URI=mongodb://localhost:27017/3mages
```

### Variables d'Environnement
```env
MONGODB_URI=mongodb://localhost:27017/3mages
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## 🛠 Scripts Disponibles

```bash
npm run dev    # Serveur de développement
npm run build  # Build de production
npm run start  # Serveur de production
```

## 📁 Structure

```
src/
├── app/           # Pages Next.js
├── components/    # Composants React
├── lib/          # Utilitaires (auth, db)
├── models/       # Modèles MongoDB
└── types/        # Types TypeScript
```

## 🔧 Technologies

- **Next.js 15** - Framework React
- **MongoDB** + **Mongoose** - Base de données
- **NextAuth.js** - Authentification
- **TypeScript** - Typage
- **Tailwind CSS** - Styles

---

**Développé pour l'Association 3 Mages** ✨