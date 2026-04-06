# Plateforme de résumés de cours

Application Next.js full-stack pour générer des résumés de notes vocales et écrites avec rôles `admin` / `student`.

## Fonctionnalités

- Authentification avec `next-auth`
- Dashboard étudiant pour créer des résumés à partir de notes audio ou texte
- Administration protégée pour gérer les accès étudiants
- API backend pour la transcription, la génération de résumé et l'historique
- Prêt pour l'ajout d'export PDF / Word
- Structure optimisée pour un déploiement sur Vercel

## Routes principales

- `/` → redirection vers `/login`
- `/login` → page de connexion
- `/dashboard` → interface étudiant protégée
- `/dashboard/history` → historique des résumés
- `/dashboard/resume/[id]` → détail d'un résumé
- `/admin` → administration des étudiants
- `/api/auth/[...nextauth]` → authentification
- `/api/summarize` → génération de résumé
- `/api/summaries` → historique utilisateur
- `/api/summaries/[id]` → détail d'un résumé
- `/api/admin/students` → liste des étudiants (admin)
- `/api/admin/activate` → activation d'accès (admin)

## Installation

```bash
npm install
```

## Variables d'environnement

Copiez `.env.local` et remplacez les valeurs avec vos clés :

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key
OPENAI_API_KEY=your-openai-api-key
```

## Démarrage

```bash
npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

## Déploiement

Déployez sur Vercel et ajoutez les mêmes variables d'environnement dans le projet.

## Notes importantes

- La base de données Supabase doit inclure les tables `profiles` et `summaries`.
- La gestion des statuts d'accès et des rôles est prévue côté backend.
- Les endpoints d'export PDF / Word peuvent être ajoutés dans `app/api/export/pdf` et `app/api/export/docx`.
