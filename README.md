# @joinbankroll/create-app

Scaffold a [Built for Bankroll](https://joinbankroll.com/build) app.

```bash
npm create @joinbankroll/app@latest my-app
cd my-app
npm run bankroll
```

`npm create bankroll-app@latest` works too — it is a published alias that
forwards here, kept because it is what a developer guesses.

`npm run bankroll` raises a public tunnel and prints a QR code. Scan it and your
app opens inside Bankroll on your phone, which is the only place it runs — the
host holds the user's money, identity, and location, and refuses any origin that
is not public HTTPS.

## What it does

Downloads [bankroll-starter](https://github.com/inplayinnovation/bankroll-starter),
writes `.env.local`, installs dependencies, and makes the first commit.

```
-t, --template <ref>   template branch or tag (default: main)
```

## What you get

An app with its own git history and no upstream remote, the same as
`create-next-app`. There is nothing to merge back later: everything that is not
your app comes from `@joinbankroll/sdk` and `bankroll-cli`, and updates with
`npm update`.

`.env.local` holds configuration only — `STORE=fs` and your app's name. The
signing key belongs to `bankroll dev`, which keeps it in
`~/.config/bankroll/keypair.json` and injects it into the dev server's
environment, so no secret is ever written into your project.
