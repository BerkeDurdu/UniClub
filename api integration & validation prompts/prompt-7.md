Perform a security remediation pass for repository secret-scanning alerts caused by exposed credential-like patterns.

IMPORTANT
- Do not rebuild architecture.
- Patch existing files in place.
- Preserve working auth and seed behavior.
- Eliminate plaintext email/password pair patterns from repository files.

GOAL
1) Remove hardcoded seed passwords from backend source.
2) Move seed credentials to environment-driven configuration.
3) Remove explicit email/password examples from docs/prompts.
4) Keep backend startup stable and login flow functional.

REQUIRED CHANGES
- Backend:
  - Add seed credential settings fields in `config.py`.
  - In `main.py`, replace hardcoded seed password literals with env-driven or derived values.
  - Keep idempotent seed behavior and role/profile linking intact.
- Documentation:
  - In backend README, do not publish direct email/password combinations.
  - Document required env keys instead.
- Prompt artifacts:
  - Sanitize prompt files that include explicit demo account password examples.

VALIDATION
- Run startup hook in project venv and ensure no runtime errors.
- Verify `/health` endpoint responds OK.
- Verify login works with configured/derived seed credentials.
- Re-run repository text search to confirm no plaintext email/password combos remain in tracked docs/code where avoidable.

ACCEPTANCE
- No hardcoded seed password literals in backend seed function.
- No email/password pair examples in README or prompt docs.
- Backend remains runnable and auth works.
