# Blackjack 21 (@nixlabs-games/blackjack-21)

Independent game repository for **Nixlabs Arcade**.

## Developing Locally

```bash
npm install
npm run dev
```

## Publishing to GitHub & Plugging into Main Product

1. Create and push repository using GitHub CLI:
   ```bash
   git init -b main
   git add .
   git commit -m "feat: initial scaffold for blackjack-21"
   gh repo create <your-org>/game-blackjack-21 --public --source=. --push
   ```

2. In the main `minigames` repository, add HTTPS dependency to `package.json`:
   ```json
   "@nixlabs-games/blackjack-21": "git+https://github.com/<your-org>/game-blackjack-21.git"
   ```

3. Sync `package-lock.json` for Cloudflare Pages CI:
   ```bash
   npm install --package-lock-only
   ```

4. Add entry to `shared/game-registry.json`:
   ```json
   {
     "slug": "blackjack-21",
     "title": "Blackjack 21",
     "enabled": true,
     "source": { "type": "package", "name": "@nixlabs-games/blackjack-21" }
   }
   ```

5. Register plugin in `src/games/registry.ts`, then verify:
   ```bash
   npm run validate:games
   npm run typecheck
   ```
