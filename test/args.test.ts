import { describe, expect, it } from 'vitest';

import { IGNORABLE, parse } from '../src/args';

describe('parse', () => {
  it('defaults to the main template', () => {
    expect(parse(['my-app'])).toEqual({ directory: 'my-app', ref: 'main', help: false });
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
