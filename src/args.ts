// Argument parsing and the empty-directory rule.
//
// Their own module so src/index.ts can run on import — a test that needs these
// must never be able to trigger a scaffold, and a guard in the entry to prevent
// that is fragile: npm invokes the bin under its own name, not the file's.

export const TEMPLATE_REPO = 'inplayinnovation/bankroll-starter';
export const DEFAULT_REF = 'main';
export const DOWNLOAD_TIMEOUT_MS = 60_000;

export const ENV_FILE = '.env.local';

/**
 * Solana's public endpoint. Enough to develop against and the only one that
 * needs no account — but it rate-limits, and confirming a payout against it
 * takes tens of seconds rather than one. Offered as a default so a scaffold
 * never stops for it, and asked about so the choice is made rather than
 * discovered later.
 */
export const PUBLIC_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
// A directory holding only these is still empty enough to scaffold into — they
// are what an editor or the OS leaves behind, not someone's work.
export const IGNORABLE = new Set([
  '.DS_Store',
  '.git',
  '.gitkeep',
  '.idea',
  '.vscode',
  'Thumbs.db',
]);

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
