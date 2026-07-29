import { describe, expect, it } from 'vitest';

import { IGNORABLE, parse, shouldStart } from '../src/args';

describe('parse', () => {
  it('defaults to the main template', () => {
    expect(parse(['my-app'])).toEqual({ directory: 'my-app', ref: 'main', help: false, noStart: false });
  });

  it('takes a directory', () => {
    expect(parse(['my-chess']).directory).toBe('my-chess');
  });

  it('has no directory when none is given, so it can prompt', () => {
    expect(parse([]).directory).toBeUndefined();
  });

  it.each([['--template'], ['-t']])('takes a template ref via %s', (flag) => {
    expect(parse([flag, 'lootbox', 'my-app'])).toMatchObject({ ref: 'lootbox', directory: 'my-app' });
  });

  it.each([['--help'], ['-h']])('recognises %s', (flag) => {
    expect(parse([flag]).help).toBe(true);
  });

  // A typo should not be read as a directory name and silently scaffold
  // somewhere unexpected.
  it('refuses an unknown option', () => {
    expect(() => parse(['--tempalte', 'lootbox'])).toThrow('Unknown option --tempalte');
  });

  it('keeps the first directory when given several', () => {
    expect(parse(['first', 'second']).directory).toBe('first');
  });
});

describe('IGNORABLE', () => {
  // These are what an editor or the OS leaves behind — a directory holding only
  // them is still empty enough to scaffold into. Anything else is someone's work.
  it.each(['.DS_Store', '.git', '.idea', '.vscode'])('ignores %s', (entry) => {
    expect(IGNORABLE.has(entry)).toBe(true);
  });

  it.each(['src', 'package.json', 'README.md'])('does not ignore %s', (entry) => {
    expect(IGNORABLE.has(entry)).toBe(false);
  });
});

describe('shouldStart', () => {
  const args = (noStart: boolean) => ({ ref: 'main', help: false, noStart });

  // The QR is the point, so it runs the app by default.
  it('starts when there is a terminal', () => {
    expect(shouldStart(args(false), true)).toBe(true);
  });

  // A CI run should scaffold and exit, not sit on a server nobody is watching.
  it('does not start without one', () => {
    expect(shouldStart(args(false), false)).toBe(false);
  });

  it('does not start when asked not to', () => {
    expect(shouldStart(args(true), true)).toBe(false);
  });
});
