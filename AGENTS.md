# Repository Instructions

- When the user says `update` in this repository, follow `.agents/skills/update/SKILL.md` to process the newest open `[Recipe Preset: Update]` GitHub issue.
- For `[Recipe Preset: Update]` issues, update the existing file in `recipes/` that matches the supplied preset ID, preserve that recipe ID, bump `BUILT_IN_RECIPE_VERSION`, update relevant tests, and verify with `npm test` and `npm run build`.
