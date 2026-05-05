import { describe, it, expect } from 'vitest';
import { detectLanguage, truncateCode, MAX_CODE_CHARS } from './promptBuilder';

describe('detectLanguage', () => {
  describe('by file marker', () => {
    it.each([
      ['TypeScript', '=== src/index.ts ===\nexport const x = 1;'],
      ['TypeScript', '=== src/App.tsx ===\nexport default function App() {}'],
      ['TypeScript', '=== tsconfig.json ===\n{}'],
      ['JavaScript', '=== src/index.js ===\nmodule.exports = {};'],
      ['JavaScript', '=== src/App.jsx ===\nexport default () => null;'],
      ['JavaScript', '=== package.json ===\n{}'],
      ['Python', '=== app/main.py ===\nprint("hi")'],
      ['Python', '=== pyproject.toml ===\n[project]'],
      ['Python', '=== setup.py ===\nfrom setuptools import setup'],
      ['Go', '=== cmd/server/main.go ===\npackage main'],
      ['Go', '=== go.mod ===\nmodule example.com/x'],
      ['Rust', '=== src/lib.rs ===\npub fn foo() {}'],
      ['Rust', '=== Cargo.toml ===\n[package]'],
      ['Java', '=== src/Foo.java ===\nclass Foo {}'],
      ['Java', '=== pom.xml ===\n<project/>'],
      ['Ruby', '=== app/foo.rb ===\nputs "hi"'],
      ['Ruby', '=== Gemfile ===\nsource "https://rubygems.org"'],
      ['PHP', '=== src/index.php ===\n<?php echo 1;'],
      ['C#', '=== Program.cs ===\nclass Program {}'],
      ['C/C++', '=== main.c ===\nint main() {}'],
      ['C/C++', '=== app.cpp ===\nint main() {}'],
      ['C/C++', '=== header.h ===\n#pragma once'],
    ])('detects %s from a file marker', (expected, source) => {
      expect(detectLanguage(source)).toBe(expected);
    });
  });

  describe('by content fallback (no file markers)', () => {
    it('detects TypeScript from an interface declaration', () => {
      expect(detectLanguage('interface User { id: string }')).toBe('TypeScript');
    });

    it('detects Python from a def statement', () => {
      expect(detectLanguage('def hello():\n    return 42')).toBe('Python');
    });

    it('detects Go from package + func', () => {
      expect(detectLanguage('package main\nfunc main() {}')).toBe('Go');
    });

    it('detects Rust from fn', () => {
      expect(detectLanguage('fn main() { println!("hi"); }')).toBe('Rust');
    });

    it('detects Java from a public class', () => {
      expect(detectLanguage('public class App {}')).toBe('Java');
    });

    it('detects JavaScript from require()', () => {
      expect(detectLanguage('const fs = require("fs");')).toBe('JavaScript');
    });

    it('returns "unknown" when nothing matches', () => {
      expect(detectLanguage('hello world, just some prose')).toBe('unknown');
    });
  });
});

describe('truncateCode', () => {
  it('returns the input unchanged when under the limit', () => {
    const code = 'short snippet';
    const result = truncateCode(code);
    expect(result).toEqual({ code, truncated: false, omittedChars: 0 });
  });

  it('returns the input unchanged when exactly at the limit', () => {
    const code = 'a'.repeat(MAX_CODE_CHARS);
    const result = truncateCode(code);
    expect(result.truncated).toBe(false);
    expect(result.omittedChars).toBe(0);
    expect(result.code).toBe(code);
  });

  it('truncates and reports omittedChars when over the limit', () => {
    const overrun = 1234;
    const code = 'a'.repeat(MAX_CODE_CHARS + overrun);
    const result = truncateCode(code);
    expect(result.truncated).toBe(true);
    expect(result.omittedChars).toBe(overrun);
    expect(result.code.startsWith('a'.repeat(MAX_CODE_CHARS))).toBe(true);
    expect(result.code).toContain(`${overrun} characters omitted`);
  });
});
