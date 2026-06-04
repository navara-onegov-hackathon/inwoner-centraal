# Inwoner Centraal — Frontend

React frontend for **MijnOverheid**, a Dutch government portal prototype. The app helps citizens navigate personal situations (for example, becoming a *nabestaande*) through information pages, notification preferences, and an interactive step-by-step plan (*stappenplan*).

This is a UI prototype with lightweight client-side interactivity. It does not connect to a real backend yet, except for an optional API proxy during development.

## Prerequisites

- **Node.js** 20 or later
- **pnpm** 10+ (recommended; the project uses `pnpm-lock.yaml`)

Install pnpm if needed:

```bash
npm install -g pnpm
```

## Setup

From the repository root:

```bash
cd frontend
pnpm install
```

### pnpm build scripts

Tailwind CSS v4 requires a native postinstall step. The project allows this in `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  '@tailwindcss/oxide': true
```

If install fails with `ERR_PNPM_IGNORED_BUILDS`, either approve the package:

```bash
pnpm approve-builds @tailwindcss/oxide
```

or set `'@tailwindcss/oxide': true` in `pnpm-workspace.yaml` (already configured in this repo).

## Development

Start the dev server:

```bash
pnpm dev
```

The app runs at [http://localhost:5173](http://localhost:5173) by default.

### Available scripts

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
| `pnpm dev`     | Start Vite dev server with hot reload            |
| `pnpm build`   | Type-check and build for production              |
| `pnpm preview` | Serve the production build locally               |
| `pnpm lint`    | Run ESLint                                       |

### API proxy

During development, requests to `/api` are proxied to `http://127.0.0.1:8000` (see `vite.config.ts`). Start the backend separately if you need live API data.

## Key features

### Home (`Dashboard`)

- Welcome screen for the demo user **Froukje**
- **Berichtenbox** overview with a table-style message list
- Alert banner for new organisations sending digital post
- **Wat kan ik waar vinden?** quick links to main sections
- Clicking the message row navigates to **Mijn situatie**

### Mijn situatie (`MijnSituatie`)

- Breadcrumb navigation: `Home > Mijn situatie > Nabestaande`
- Information sections about condolences, obligations, and government support
- **AAN / UIT toggles** for notification and data-sharing preferences (green when on, red when off)
- **Ik heb hulp nodig** button shows a confirmation message
- Embedded **Stappenplan** with tasks, filters, and progress tracking

### Stappenplan (`StappenplanPanel`)

Embedded in **Mijn situatie**:

- Tabs: *Nog te doen*, *Gedaan*, *Wat doen wij?*, *Hier heeft u mogelijk recht op*
- Organisation and sort filters
- Progress bar (`completed / total`)
- Expandable task rows with actions (*Aanvragen bij gemeente*, *Taak afronden*)
- Locked tasks shown as *Vergrendeld* until prerequisites are met

### Other sections (`SectionTemplate`)

All sidebar sections except **Home** and **Mijn situatie** render a placeholder page with breadcrumb, page title, and an “in development” message. This includes Identiteit, Financiën, Berichtenbox, Lopende zaken, Instellingen, and the other menu items.

### Navigation & layout

- **Header**: centred Rijksoverheid logo, user name, and logout (no divider line)
- **Sidebar**: **MijnOverheid** title and main menu with notification badges (Berichtenbox: 23, Mijn situatie: 1); no border between sidebar and content
- **Logout**: shows a logout screen with option to log in again

## Project structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Root layout and section routing
│   │   ├── sectionConfig.ts     # Sidebar labels and menu config
│   │   └── components/
│   │       ├── Dashboard.tsx    # Home page
│   │       ├── MijnSituatie.tsx # Situation & information page
│   │       ├── SectionTemplate.tsx  # Placeholder for unbuilt sections
│   │       ├── StappenplanPanel.tsx
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── GovernmentLogo.tsx
│   │       ├── GovernmentToggle.tsx
│   │       └── ui/              # shadcn/ui-style components
│   ├── styles/
│   │   ├── index.css            # Tailwind entry point
│   │   ├── theme.css            # Design tokens & base styles
│   │   └── fonts.css            # Source Sans 3
│   └── main.tsx
├── vite.config.ts
├── pnpm-workspace.yaml
└── package.json
```

Navigation is handled in `App.tsx` via React state (`activeSection`), not URL routing. Only `home` and `situatie` have full page content; all other sections use `SectionTemplate`.

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** for dev server and builds
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **Radix UI** primitives and **shadcn/ui**-style components in `src/app/components/ui/`
- **Lucide React** for icons
- **Source Sans 3** as the primary typeface (government-style sans-serif)

## Styling

- Brand colours follow the Rijksoverheid palette (e.g. `#007AC8`, `#154273`, `#DAEAF6`)
- CSS variables and theme tokens live in `src/styles/theme.css`
- Tailwind utilities are used throughout page components

## Production build

```bash
pnpm build
```

Output is written to `dist/`. Preview locally with:

```bash
pnpm preview
```

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| `ERR_PNPM_IGNORED_BUILDS` for `@tailwindcss/oxide` | Set `allowBuilds` in `pnpm-workspace.yaml` or run `pnpm approve-builds` |
| Styles not loading | Ensure `@tailwindcss/vite` is registered in `vite.config.ts` |
| `vite/internal` export error | `@vitejs/plugin-react` v6 requires Vite 8; do not pin Vite to v6 |
| Corrupted `node_modules` | `rm -rf node_modules && pnpm install` |
