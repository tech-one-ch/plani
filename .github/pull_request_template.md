<!--
  PR TYPE — choose one and delete the others below:

  FEATURE / FIX  →  feat/*, fix/* → develop
  Fill in Summary, Testing, and Screenshots if applicable.

  PROMOTION  →  develop → staging  or  staging → main
  Summary = paste the output of: git log --oneline origin/<target>..<source>
  Skip Testing and Screenshots — CI already validated this.
-->

## Summary

<!--
  Feature/fix: what does this PR do? (1-3 bullet points)
  Promotion: list of commits/PRs included since last promotion.
-->

-

## Testing

<!-- Feature/fix only — skip for promotion PRs -->

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds (run without cache: `rm -rf apps/web/.next .turbo && pnpm --filter @plani/web build`)
- [ ] Tested manually in the browser (if UI change)

## Screenshots

<!-- Add before/after screenshots for any visible UI change. Skip for promotion PRs. -->

## Notes

<!-- Breaking changes? Migration steps needed? Anything the reviewer should know? -->
