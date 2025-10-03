# Copilot Instructions for AI Agents

## Project Overview
- This is a Next.js app (TypeScript, App Router) for managing running events and attendance.
- Main app code is in `src/app/`, with subfolders for pages (`admin`, `login`), API routes (`api/ical/[token]/route.ts`, `api/notify/route.ts`, etc.), and global styles.
- UI components are in `src/components/` (e.g., `AttendanceSwitch.tsx`, `EventList.tsx`, `MessageComposer.tsx`).
- Supabase is used for backend data access (`src/lib/supabaseClient.ts`).

## Key Patterns & Conventions
- **Pages**: Each subfolder in `src/app/` with a `page.tsx` is a route. Use Next.js conventions for server/client components.
- **API Routes**: Files in `src/app/api/` are Next.js API endpoints. Use `route.ts` for handler logic.
- **Components**: All reusable React components are in `src/components/`. Prefer function components and hooks.
- **Styling**: Use global styles from `src/app/globals.css` and `src/styles/globals.css`. Tailwind/PostCSS config is present (`postcss.config.mjs`).
- **TypeScript**: Strict typing is expected. See `tsconfig.json` for config.

## Developer Workflows
- **Start Dev Server**: `npm run dev` (or `yarn dev`, `pnpm dev`, `bun dev`).
- **Edit Main Page**: `src/app/page.tsx` is the main entry point.
- **API Development**: Add/modify endpoints in `src/app/api/`. Use Next.js API handler patterns.
- **Supabase Integration**: Use `src/lib/supabaseClient.ts` for DB access. Do not hardcode credentials.
- **Static Assets**: Place images/icons in `public/`.

## Integration Points
- **Supabase**: All DB access via `src/lib/supabaseClient.ts`.
- **External APIs**: API routes may interact with external services (e.g., calendar via `ical`).

## Examples
- To add a new attendance feature, create a component in `src/components/`, update relevant API route in `src/app/api/`, and wire up in a page under `src/app/`.
- For custom admin logic, use `src/app/admin/page.tsx` and supporting components/APIs.

## Additional Notes
- Follow Next.js file-based routing and conventions.
- Use environment variables for secrets (see Supabase usage).
- Keep code modular and prefer hooks for state/data logic.

---

If any conventions or workflows are unclear, ask the user for clarification or examples from the codebase.