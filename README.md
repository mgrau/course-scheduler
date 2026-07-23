# Course Scheduler

A browser-only tool for building a course schedule on a semester calendar.

- **Calendar view** — one week per row across the whole term, with holidays and
  cancellations grayed out and class-meeting days highlighted.
- **Activities** — lectures, labs, exams, … with categories and colors. Drag
  them between class days, or leave them **unscheduled** in the side tray until
  you know where they go.
- **Assignments** — have an assign date and a due date (with optional time);
  both ends are draggable independently.
- **YAML** — the whole schedule imports/exports as a hand-editable YAML file,
  so you can keep it in git.
- **Markdown / LaTeX export** — syllabus-ready tables, one row per class day or
  per week.
- **Print to PDF** — one month per page, plus an optional sheet of cut-out
  cards for unscheduled activities.

Everything runs client-side (Svelte 5 + Tailwind 4 + Vite); work-in-progress is
autosaved to the browser's localStorage.

## Development

```sh
npm install
npm run dev      # dev server
npm run check    # type-check
npm run build    # production build in dist/
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
site and publishes it to GitHub Pages. In the repository settings, set
**Pages → Source** to **GitHub Actions** once.
