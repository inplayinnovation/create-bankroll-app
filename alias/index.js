#!/usr/bin/env node
// `npm create bankroll-app` — the unscoped name, forwarding to the real one.
//
// npm has no registry-level alias, so this is a package whose only job is to
// hand off. It exists because create-bankroll-app is what a developer guesses,
// and it was briefly the documented CTA — so the name is worth holding, pointed
// at something that works rather than left for someone else to claim.
//
// A child process rather than an import: the scaffolder runs on import, and
// depending on that side effect is the same sharp edge that made an earlier
// version of it exit silently. Spawning is explicit about what happens.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const target = require.resolve('@joinbankroll/create-app/dist/index.js');

const { status } = spawnSync(process.execPath, [target, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(status ?? 1);
