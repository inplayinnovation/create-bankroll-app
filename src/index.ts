// @joinbankroll/create-app — scaffold a Built for Bankroll app.
//
//   npm create @joinbankroll/app@latest my-app
//
// Downloads the template rather than bundling a copy of it. bankroll-starter is
// a real app that gets built and run, so shipping a second copy inside this
// package would fork it — one of them would quietly fall behind.
//
// The resulting repo has its own history and no upstream remote, the same as
// create-next-app. Nothing here needs to be merged later: everything that is not
// your app lives in @joinbankroll/sdk and bankroll-cli, and updates with
// `npm update`.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

const TEMPLATE_REPO = 'inplayinnovation/bankroll-starter';
const DEFAULT_REF = 'main';
const DOWNLOAD_TIMEOUT_MS = 60_000;

const ENV_FILE = '.env.local';
// A directory holding only these is still empty enough to scaffold into — they
// are what an editor or the OS leaves behind, not someone's work.
export const IGNORABLE = new Set(['.DS_Store', '.git', '.gitkeep', '.idea', '.vscode', 'Thumbs.db']);

export interface Args {
  directory?: string;
  ref: string;
  help: boolean;
}

export function parse(argv: string[]): Args {
  const args: Args = { ref: DEFAULT_REF, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--template' || arg === '-t') args.ref = argv[++i] ?? DEFAULT_REF;
    else if (arg?.startsWith('-')) throw new Error(`Unknown option ${arg}`);
    else if (arg && !args.directory) args.directory = arg;
  }
  return args;
}

function usage(): void {
  console.log(`
  Create a Built for Bankroll app.

    npm create @joinbankroll/app@latest my-app

  Options
    -t, --template <ref>   template branch or tag (default: ${DEFAULT_REF})
    -h, --help             show this
`);
}

async function ask(question: string, fallback: string): Promise<string> {
  // No terminal means nothing to ask — take the default rather than hang a CI run.
  if (!process.stdin.isTTY) return fallback;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(`  ${question} (${fallback}): `)).trim() || fallback;
  } finally {
    rl.close();
  }
}

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`);
}

/** Quietly — a failure here is not worth stopping a scaffold over. */
function tryRun(command: string, args: string[], cwd: string): boolean {
  const result = spawnSync(command, args, { cwd, stdio: 'ignore' });
  return !result.error && result.status === 0;
}

async function download(ref: string, into: string): Promise<void> {
  const url = `https://codeload.github.com/${TEMPLATE_REPO}/tar.gz/${ref}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? `No template named "${ref}" — check --template.`
        : `Could not download the template (${response.status}).`,
    );
  }

  const archive = resolve(into, '.template.tar.gz');
  writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  try {
    // --strip-components=1 drops the "<repo>-<ref>/" wrapper the tarball adds.
    run('tar', ['-xzf', archive, '--strip-components=1'], into);
  } finally {
    rmSync(archive, { force: true });
  }
}

async function main(): Promise<void> {
  const args = parse(process.argv.slice(2));
  if (args.help) return usage();

  const directory = args.directory ?? (await ask('Directory', 'my-bankroll-app'));
  const target = resolve(process.cwd(), directory);

  let created = false;
  if (existsSync(target)) {
    const existing = readdirSync(target).filter((entry) => !IGNORABLE.has(entry));
    if (existing.length > 0) throw new Error(`${directory} is not empty.`);
  } else {
    mkdirSync(target, { recursive: true });
    created = true;
  }

  const name = await ask('App name', basename(target));

  console.log(`\n  Downloading the template…`);
  try {
    await download(args.ref, target);
  } catch (error) {
    // Leave nothing behind for a scaffold that never started — but only a
    // directory this run made, and only while it is still empty.
    if (created && readdirSync(target).length === 0) rmSync(target, { recursive: true, force: true });
    throw error;
  }

  // Written before install so the app can run the moment it finishes. Config
  // only — the signing key belongs to `bankroll dev` and is never written into
  // a project, so there is nothing secret in here to leak.
  writeFileSync(
    resolve(target, ENV_FILE),
    [
      '# Written by create-bankroll-app. Gitignored, so none of it reaches a',
      '# deployment.',
      '',
      '# Store state in local files rather than Vercel Blob, so this app runs',
      '# without a Vercel account. A deployment has no STORE and uses Blob.',
      'STORE=fs',
      '',
      '# Shown when someone connects the app.',
      `BANKROLL_APP_NAME=${name}`,
      '',
    ].join('\n'),
  );

  console.log(`  Installing dependencies…\n`);
  run('npm', ['install'], target);

  // Its own history, and no upstream remote: there is nothing to merge back.
  if (tryRun('git', ['init', '-q'], target)) {
    tryRun('git', ['add', '-A'], target);
    tryRun('git', ['commit', '-qm', 'Initial commit from create-bankroll-app'], target);
  }

  console.log(`
  ${name} is ready.

    cd ${directory}
    npm run bankroll     tunnel + QR — scan it to open the app inside Bankroll

  Your app runs inside Bankroll, so a phone is how you see it. Everything that
  is not your app comes from @joinbankroll/sdk and updates with npm update.
`);
}

// Only when executed, so importing this module in a test does not scaffold.
if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  try {
    await main();
  } catch (error) {
    console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
