'use strict';

/**
 * Codemod GeStock : remplace les emojis par des icônes lucide-react.
 * ================================================================
 *
 * CE QUE CE SCRIPT FAIT AUTOMATIQUEMENT (sûr à 100%, ne casse jamais la syntaxe) :
 *   - Emoji dans du texte JSX affiché : <h1>💊 Tableau de bord</h1>
 *   - Emoji seul ou mélangé à du texte dans une expression JSX enfant :
 *       {'🔍 Rechercher'}  ou  {`📦 ${count} articles`}
 *   - Emoji dans les branches d'un ternaire ou d'un && QUAND ce ternaire est
 *     lui-même un enfant JSX (pas dans un attribut) :
 *       {isValid ? '✅' : '❌'}   (rendu direct dans le JSX)
 *
 * CE QUE CE SCRIPT NE TOUCHE JAMAIS (impossible d'y mettre un composant React) :
 *   - Attributs JSX : title="🔍 Recherche", submitIcon="💊"
 *   - Chaînes dans des objets de config : { icon: '💊', label: '...' }
 *   - Arguments de fonctions : toast.success('✅ Enregistré'), console.log('🚀 ...')
 *   - Tout fichier backend sans JSX (les emojis y sont dans des logs/strings)
 *
 * Ces cas sont recensés (fichier, ligne, emoji, icône suggérée) dans un rapport
 * JSONL (voir --report) pour une correction manuelle ciblée — les injecter en
 * aveugle casserait le rendu ou le build.
 *
 * Usage (voir README.md du dossier) :
 *   npx jscodeshift -t scripts/emoji-codemod/replace-emojis.cjs \
 *     --extensions=jsx,tsx,js,ts --parser=tsx --dry --print \
 *     frontend-depot/src backend-depot/src
 */

const fs = require('fs');
const path = require('path');
const EMOJI_MAP = require('./emoji-icon-map.cjs');

// Modificateurs qui doivent être "avalés" avec le caractère emoji qui les précède
// (variation selector texte/emoji, ZWJ, tons de peau) pour ne jamais couper un
// emoji composite en deux morceaux.
const MODIFIER_RE = /[\uFE0E\uFE0F\u200D\u{1F3FB}-\u{1F3FF}]/u;

function isModifier(ch) {
  return MODIFIER_RE.test(ch);
}

// Découpe une chaîne en segments {type:'text', value} / {type:'icon', name, raw}
// en se basant sur EMOJI_MAP. Les caractères emoji absents du mapping restent
// tels quels dans le texte (ils remonteront dans le scan de "non mappés" en amont,
// pas dans ce codemod qui ne fait qu'exécuter le mapping fourni).
function splitEmojis(str) {
  const segments = [];
  let buffer = '';
  const chars = Array.from(str); // itère par code point, pas par UTF-16 unit
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const iconName = EMOJI_MAP.get(ch);
    if (iconName) {
      if (buffer) {
        segments.push({ type: 'text', value: buffer });
        buffer = '';
      }
      // avale les modificateurs qui suivent (ex: variation selector U+FE0F)
      let j = i + 1;
      while (j < chars.length && isModifier(chars[j])) j++;
      i = j - 1;
      segments.push({ type: 'icon', name: iconName });
    } else {
      buffer += ch;
    }
  }
  if (buffer) segments.push({ type: 'text', value: buffer });
  return segments;
}

function hasIcon(segments) {
  return segments.some((s) => s.type === 'icon');
}

module.exports = function transform(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  const reportPath = options.report || path.join(process.cwd(), 'emoji-report.jsonl');
  const strip = !!options.strip; // option avancée : nettoyer aussi les emojis non-JSX (voir README)

  const usedIcons = new Set();
  const reportLines = [];
  let mutated = false;

  // node : le noeud littéral exact (StringLiteral/Literal) à marquer, pour que
  // la passe de secours (point 3) ne le re-signale jamais en double. Tout
  // noeud effectivement MUTÉ est de toute façon retiré de l'arbre et ne peut
  // plus être retrouvé par un futur root.find() — logSkip n'a donc besoin de
  // marquer que les noeuds volontairement laissés en place (attributs).
  function logSkip(node, category, rawText) {
    const found = Array.from(rawText).filter((c) => EMOJI_MAP.has(c));
    node.__emojiReported = true;
    if (found.length === 0) return;
    const line = (node.loc && node.loc.start && node.loc.start.line) || null;
    reportLines.push(
      JSON.stringify({
        file: fileInfo.path,
        line,
        category, // 'jsx-attribute' | 'config-string' | 'other'
        emojis: found,
        suggested: found.map((c) => EMOJI_MAP.get(c)),
        excerpt: rawText.slice(0, 120),
      })
    );
  }

  function iconElement(name) {
    usedIcons.add(name);
    const opening = j.jsxOpeningElement(
      j.jsxIdentifier(name),
      [
        j.jsxAttribute(j.jsxIdentifier('className'), j.literal('inline-icon')),
        j.jsxAttribute(j.jsxIdentifier('aria-hidden'), j.literal('true')),
      ],
      true
    );
    return j.jsxElement(opening, null, []);
  }

  // {' '} : idiome JSX standard pour un espace significatif qui doit survivre
  // au pretty-printer (un JSXText tout neuf collé à un élément tout neuf peut
  // voir ses espaces de bordure absorbés par recast/babel-generator lors de la
  // réimpression — {' '} est explicite et ne bouge jamais).
  function spaceExpr() {
    return j.jsxExpressionContainer(j.literal(' '));
  }

  // Construit une liste de noeuds JSX enfants (JSXText + éléments icônes) à
  // partir des segments texte/icone, en sécurisant les espaces aux frontières
  // icône<->texte avec {' '} plutôt que de compter sur le JSXText brut.
  function buildChildren(segments) {
    const nodes = [];
    for (let idx = 0; idx < segments.length; idx++) {
      const seg = segments[idx];
      if (seg.type === 'icon') {
        nodes.push(iconElement(seg.name));
        continue;
      }
      let value = seg.value;
      // Vérifié empiriquement : recast ne perd l'espace QUE dans un sens — un
      // JSXText flambant neuf dont l'espace de tête suit un JSXElement flambant
      // neuf. Un espace de FIN de texte juste avant un élément est, lui,
      // toujours correctement préservé nativement (pas besoin d'intervenir, et
      // le faire créerait des espaces en double sur le texte indenté multi-ligne).
      const prevWasIcon = idx > 0 && segments[idx - 1].type === 'icon';
      if (prevWasIcon && /^ /.test(value)) {
        nodes.push(spaceExpr());
        value = value.replace(/^ +/, '');
      }
      if (value.length > 0) nodes.push(j.jsxText(value));
    }
    return nodes;
  }

  // Construit une expression JS valide (utilisable comme branche de ternaire,
  // comme contenu de JSXExpressionContainer, etc.) à partir des segments.
  function buildExpression(segments) {
    if (segments.length === 1 && segments[0].type === 'icon') {
      const children = buildChildren(segments);
      return children[0]; // un seul JSXElement, pas besoin de fragment
    }
    const children = buildChildren(segments);
    return j.jsxFragment(j.jsxOpeningFragment(), j.jsxClosingFragment(), children);
  }

  // --- 1. Texte JSX affiché directement -------------------------------------
  root.find(j.JSXText).forEach((p) => {
    const segments = splitEmojis(p.node.value);
    if (!hasIcon(segments)) return;
    const parent = p.parent.node;
    if (!Array.isArray(parent.children)) return;
    const idx = parent.children.indexOf(p.node);
    if (idx === -1) return;
    const newNodes = buildChildren(segments);
    parent.children.splice(idx, 1, ...newNodes);
    mutated = true;
  });

  // --- 2. Expressions JSX enfants (StringLiteral / TemplateLiteral / ternaire /
  //         && ) — uniquement quand le conteneur est un ENFANT JSX, jamais un
  //         attribut. -------------------------------------------------------
  root.find(j.JSXExpressionContainer).forEach((p) => {
    const parentType = p.parent.node.type;
    const isJsxChild = parentType === 'JSXElement' || parentType === 'JSXFragment';
    const expr = p.node.expression;
    if (!expr) return;

    if (!isJsxChild) {
      // C'est un attribut (title={...}, aria-label={...}, etc.) : on ne modifie
      // jamais, on journalise juste pour le rapport.
      if (expr.type === 'StringLiteral' || expr.type === 'Literal') {
        logSkip(expr, 'jsx-attribute', String(expr.value));
      } else if (expr.type === 'ConditionalExpression') {
        [expr.consequent, expr.alternate].forEach((branch) => {
          if (branch.type === 'StringLiteral' || branch.type === 'Literal') {
            logSkip(branch, 'jsx-attribute', String(branch.value));
          }
        });
      } else if (expr.type === 'TemplateLiteral' && expr.expressions.length === 0) {
        logSkip(expr, 'jsx-attribute', expr.quasis.map((q) => q.value.cooked).join(''));
      }
      return;
    }

    // Cas simple : {'🔍 Rechercher'} ou {`📦 ${x}`} sans interpolation
    if (expr.type === 'StringLiteral' || expr.type === 'Literal') {
      const segments = splitEmojis(String(expr.value));
      if (hasIcon(segments)) {
        p.node.expression = buildExpression(segments);
        mutated = true;
      }
      return;
    }
    if (expr.type === 'TemplateLiteral' && expr.expressions.length === 0) {
      const raw = expr.quasis.map((q) => q.value.cooked).join('');
      const segments = splitEmojis(raw);
      if (hasIcon(segments)) {
        p.node.expression = buildExpression(segments);
        mutated = true;
      }
      return;
    }

    // Ternaire rendu directement dans le JSX : {ok ? '✅' : '❌'}
    if (expr.type === 'ConditionalExpression') {
      ['consequent', 'alternate'].forEach((key) => {
        const branch = expr[key];
        if (branch.type === 'StringLiteral' || branch.type === 'Literal') {
          const segments = splitEmojis(String(branch.value));
          if (hasIcon(segments)) {
            expr[key] = buildExpression(segments);
            mutated = true;
          }
        }
      });
      return;
    }

    // {condition && '✅'}
    if (expr.type === 'LogicalExpression' && expr.operator === '&&') {
      const branch = expr.right;
      if (branch.type === 'StringLiteral' || branch.type === 'Literal') {
        const segments = splitEmojis(String(branch.value));
        if (hasIcon(segments)) {
          expr.right = buildExpression(segments);
          mutated = true;
        }
      }
      return;
    }
  });

  // --- 3. Recensement (sans modification) de tout le reste : propriétés
  //         d'objets (icon: '💊'), arguments d'appel (toast('✅ ...')), et plus
  //         généralement toute StringLiteral/TemplateLiteral non capturée
  //         ci-dessus. Tout ce qui a déjà été muté OU déjà loggué au point 2
  //         porte le flag __emojiReported et n'est jamais re-signalé ici. ----
  function classifyAndLog(p) {
    const node = p.node;
    if (node.__emojiReported) return;
    const val = node.type === 'TemplateLiteral'
      ? (node.expressions.length === 0 ? node.quasis.map((q) => q.value.cooked).join('') : null)
      : node.value;
    if (typeof val !== 'string') return;
    const segments = splitEmojis(val);
    if (!hasIcon(segments)) return;
    const parent = p.parent.node;
    const category =
      parent.type === 'ObjectProperty' || parent.type === 'Property' ? 'config-string' : 'other';
    logSkip(node, category, val);
  }
  root.find(j.StringLiteral).forEach(classifyAndLog);
  root.find(j.Literal).forEach(classifyAndLog);
  root.find(j.TemplateLiteral).forEach(classifyAndLog);

  if (reportLines.length > 0) {
    fs.appendFileSync(reportPath, reportLines.join('\n') + '\n', 'utf-8');
  }

  if (!mutated) return undefined; // fichier inchangé -> jscodeshift ne le compte pas

  // --- Gestion de l'import lucide-react --------------------------------------
  if (usedIcons.size > 0) {
    const existingImport = root
      .find(j.ImportDeclaration, { source: { value: 'lucide-react' } })
      .at(0);

    if (existingImport.size() > 0) {
      const decl = existingImport.get().node;
      const existingNames = new Set(
        decl.specifiers
          .filter((s) => s.type === 'ImportSpecifier')
          .map((s) => s.imported.name)
      );
      usedIcons.forEach((name) => {
        if (!existingNames.has(name)) {
          decl.specifiers.push(j.importSpecifier(j.identifier(name)));
        }
      });
    } else {
      const sortedNames = Array.from(usedIcons).sort();
      const newImport = j.importDeclaration(
        sortedNames.map((name) => j.importSpecifier(j.identifier(name))),
        j.literal('lucide-react')
      );
      const firstImport = root.find(j.ImportDeclaration).at(0);
      if (firstImport.size() > 0) {
        firstImport.insertAfter(newImport);
      } else {
        root.get().node.program.body.unshift(newImport);
      }
    }
  }

  return root.toSource({ quote: 'single', reuseWhitespace: true });
};

module.exports.parser = 'tsx';
