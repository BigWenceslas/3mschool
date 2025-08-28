# 📅 Sprint 2 - Gestion des Cours

## 🎯 Objectif Principal
Créer un système complet de gestion des cours spirituels avec planification, présences et paiements.

## 📋 User Stories

### Pour les Administrateurs
- **En tant qu'admin**, je veux pouvoir planifier des cours avec date, heure, sujet et description
- **En tant qu'admin**, je veux voir la liste de tous les cours (passés et à venir)
- **En tant qu'admin**, je veux gérer les présences lors des cours
- **En tant qu'admin**, je veux saisir un résumé après chaque cours
- **En tant qu'admin**, je veux voir les paiements automatiques générés

### Pour les Membres
- **En tant que membre**, je veux voir les cours à venir
- **En tant qu'membre**, je veux m'inscrire aux cours
- **En tant que membre**, je veux voir mes cours suivis et mes paiements
- **En tant que membre**, je veux consulter les résumés des cours passés

## 🗂️ Fonctionnalités à Développer

### 1. Modèle de Données - Cours
```typescript
interface Course {
  _id: string
  title: string
  description: string
  date: Date
  duration: number // en minutes
  location: string
  maxParticipants: number
  instructor: string // ID de l'admin/instructeur
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  price: number // 1000 XAF par défaut
  summary?: string // Résumé post-cours
  createdAt: Date
  updatedAt: Date
}
```

### 2. Modèle de Données - Inscriptions & Présences
```typescript
interface CourseEnrollment {
  _id: string
  courseId: string
  userId: string
  enrolledAt: Date
  attended: boolean
  paymentStatus: 'pending' | 'paid' | 'exempted'
  paymentDate?: Date
  notes?: string
}
```

### 3. APIs à Créer
- `POST /api/courses` - Créer un cours (admin)
- `GET /api/courses` - Lister les cours (avec filtres)
- `PUT /api/courses/[id]` - Modifier un cours (admin)
- `DELETE /api/courses/[id]` - Supprimer un cours (admin)
- `POST /api/courses/[id]/enroll` - S'inscrire à un cours (membre)
- `POST /api/courses/[id]/attendance` - Marquer présence (admin)
- `PUT /api/courses/[id]/summary` - Ajouter résumé (admin)

### 4. Pages à Créer
- `/dashboard/courses` - Gestion des cours (admin)
- `/dashboard/courses/new` - Créer un cours (admin)
- `/dashboard/courses/[id]` - Détails d'un cours (admin)
- `/courses` - Liste des cours (membre)
- `/courses/[id]` - Détail d'un cours (membre)
- `/dashboard/attendance` - Gestion des présences (admin)

## 🎨 Interface Utilisateur

### Dashboard Admin - Gestion des Cours
- **Calendrier interactif** avec vue mensuelle/hebdomadaire
- **Tableau des cours** avec statuts, participants, revenus
- **Formulaire de création** de cours avec validation
- **Interface de présence** avec liste des inscrits
- **Saisie de résumé** post-cours

### Interface Membre - Cours
- **Grille des cours à venir** avec descriptions
- **Bouton d'inscription** avec confirmation
- **Historique des cours suivis** avec résumés
- **Statut des paiements** personnels

## 💰 Système de Paiement

### Automatisation
- **Prix fixe**: 1.000 XAF par cours
- **Génération automatique** de l'enregistrement de paiement lors de l'inscription
- **Statuts**: En attente → Payé → Exempté
- **Tracking**: Date de paiement, méthode, référence

### Rapports
- Revenus par cours
- Revenus par membre
- Statistiques de participation

## 📊 Base de Données

### Nouvelles Collections
1. **courses** - Informations des cours
2. **enrollments** - Inscriptions et présences
3. **payments** - Suivi des paiements (extension future)

### Relations
- User → Enrollments (1:N)
- Course → Enrollments (1:N)
- User (instructor) → Courses (1:N)

## 🚀 Plan de Développement

### Phase 1: Foundation (2-3 jours)
- [x] Modèles MongoDB (Course, Enrollment)
- [x] APIs de base (CRUD cours)
- [x] Mise à jour de la navigation

### Phase 2: Admin Interface (3-4 jours)
- [x] Interface de gestion des cours
- [x] Calendrier de planification
- [x] Gestion des présences
- [x] Saisie de résumés

### Phase 3: Member Interface (2-3 jours)
- [x] Page de listing des cours
- [x] Inscription aux cours
- [x] Historique personnel

### Phase 4: Payment System (2-3 jours)
- [x] Système de paiement automatique
- [x] Tracking des paiements
- [x] Rapports financiers

### Phase 5: Polish & Testing (1-2 jours)
- [x] Tests d'intégration
- [x] Optimisations UX
- [x] Documentation

## 🎯 Critères de Succès

### Fonctionnels
- ✅ Admin peut planifier et gérer des cours
- ✅ Membres peuvent voir et s'inscrire aux cours
- ✅ Système de présence fonctionnel
- ✅ Paiements automatiques générés
- ✅ Résumés de cours sauvegardés

### Techniques
- ✅ APIs sécurisées avec authentification
- ✅ Interface responsive et intuitive
- ✅ Performance optimale (< 2s de chargement)
- ✅ Validation des données côté client/serveur

### Business
- ✅ Traçabilité complète des cours et participants
- ✅ Automatisation du processus d'inscription
- ✅ Transparence financière pour les membres
- ✅ Outils de reporting pour l'administration

## 📝 Notes Techniques

### Technologies
- **Backend**: Next.js 14 App Router
- **Database**: MongoDB avec Mongoose
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Material-UI
- **Authentication**: JWT avec cookies

### Sécurité
- Validation des rôles pour chaque action
- Protection CSRF avec tokens
- Sanitisation des entrées utilisateur
- Rate limiting sur les APIs

## 🔄 Integration avec Sprint 1
- Utilisation du système d'auth existant
- Extension du dashboard actuel
- Réutilisation des composants UI
- Conservation de la charte graphique

---

## 📅 Timeline Estimée: 10-14 jours

**Début Sprint 2**: Après validation du Sprint 1  
**Livraison Sprint 2**: Calendrier de cours interactif + gestion des présences  
**Sprint 3 Preview**: Intégration avec Google Drive pour documents cours