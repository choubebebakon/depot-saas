import * as fs from 'fs';
import * as path from 'path';
import { GERANT_DENY_SOUS_MODULES } from './permissions.config';
import {
  PERMISSION_SEED_INDEX,
  PermissionSeedMetier,
} from './seed-permissions.data';

/**
 * §19/§25 — Verrou d'alignement FRONTEND ⇄ BACKEND.
 *
 * Le frontend masque les sous-modules à partir de sa matrice miroir
 * (`frontend-depot/src/shared/permissions/matrix.js`). Si cette matrice dérive
 * du seed backend, l'UI affiche des modules menant à des 403 (exactement le
 * défaut que cette mission corrige). Ce test lit la matrice frontend et exige
 * une égalité stricte avec `seed-permissions.data.ts` (source de vérité).
 *
 * Le test est ignoré proprement si le dépôt frontend n'est pas présent
 * (exécution backend isolée / CI partielle).
 */

const FRONTEND_MATRIX_PATH = path.resolve(
  __dirname,
  '../../../frontend-depot/src/shared/permissions/matrix.js',
);

const hasFrontend = fs.existsSync(FRONTEND_MATRIX_PATH);
const maybeDescribe = hasFrontend ? describe : describe.skip;

interface MatrixRow {
  canRead: boolean;
  canWrite: boolean;
}

const ROW_RE = /^\s+([a-z_]+):\s*\{\s*canRead:\s*(true|false),\s*canWrite:\s*(true|false)\s*\},/;
const METIER_RE = /^ {2}(supermarche|boutique|depot):\s*\{/;
const ROLE_RE = /^ {4}([A-Z_]+):\s*\{/;

function parseFrontendMatrix(source: string): {
  rows: Map<string, MatrixRow>;
  gerantDeny: string[];
} {
  const start = source.indexOf('export const PERMISSION_MATRIX = {');
  expect(start).toBeGreaterThan(-1);

  const slice = source.slice(start);
  const end = slice.indexOf('\n};');
  expect(end).toBeGreaterThan(-1);

  const rows = new Map<string, MatrixRow>();
  let metier: PermissionSeedMetier | null = null;
  let role: string | null = null;

  for (const line of slice.slice(0, end).split(/\r?\n/)) {
    if (line.trim().startsWith('//')) continue;

    const metierMatch = METIER_RE.exec(line);
    if (metierMatch) {
      metier = metierMatch[1] as PermissionSeedMetier;
      role = null;
      continue;
    }

    const roleMatch = ROLE_RE.exec(line);
    if (roleMatch) {
      role = roleMatch[1];
      continue;
    }

    const rowMatch = ROW_RE.exec(line);
    if (rowMatch && metier && role) {
      rows.set(`${role}|${metier}|${rowMatch[1]}`, {
        canRead: rowMatch[2] === 'true',
        canWrite: rowMatch[3] === 'true',
      });
    }
  }

  // Liste de refus Gérant dupliquée en dur dans resolvePermission().
  const gerantDeny = [
    ...slice.matchAll(
      /sousModule !== '([a-z_]+)'\s*(?=&&|;)/g,
    ),
  ].map((m) => m[1]);

  return { rows, gerantDeny };
}

maybeDescribe('Parité matrice frontend ⇄ seed backend (§19/§25)', () => {
  const source = fs.readFileSync(FRONTEND_MATRIX_PATH, 'utf8');
  const { rows, gerantDeny } = parseFrontendMatrix(source);

  it('expose exactement les mêmes sous-modules que le seed', () => {
    expect([...rows.keys()].sort()).toEqual(
      [...PERMISSION_SEED_INDEX.keys()].sort(),
    );
  });

  it('accorde exactement les mêmes canRead / canWrite que le seed', () => {
    const mismatches: string[] = [];
    for (const [key, seedRow] of PERMISSION_SEED_INDEX) {
      const frontRow = rows.get(key);
      if (
        !frontRow ||
        frontRow.canRead !== seedRow.canRead ||
        frontRow.canWrite !== seedRow.canWrite
      ) {
        mismatches.push(
          `${key} → frontend=${JSON.stringify(frontRow)} seed=${JSON.stringify({
            canRead: seedRow.canRead,
            canWrite: seedRow.canWrite,
          })}`,
        );
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('refuse au GERANT exactement les mêmes sous-modules que le backend', () => {
    expect([...gerantDeny].sort()).toEqual([...GERANT_DENY_SOUS_MODULES].sort());
  });
});
