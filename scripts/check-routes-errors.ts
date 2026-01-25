/**
 * Script de vérification des routes API critiques
 * Vérifie les routes principales pour identifier les erreurs
 */

import fs from 'fs';
import path from 'path';

interface RouteCheck {
  path: string;
  issues: string[];
  severity: 'error' | 'warning' | 'info';
}

const criticalRoutes = [
  'app/api/members/public/route.ts',
  'app/api/admin/events/presence/route.ts',
  'app/api/admin/members/route.ts',
  'app/api/user/role/route.ts',
  'app/api/admin/logs/route.ts',
  'app/api/evaluations/discord/points/route.ts',
  'app/api/evaluations/spotlights/points/route.ts',
  'app/api/evaluations/raids/points/route.ts',
  'app/api/evaluations/follow/points/route.ts',
  'app/api/evaluations/bonus/route.ts',
  'app/api/twitch/streams/route.ts',
  'app/api/events/route.ts',
];

function checkRoute(filePath: string): RouteCheck {
  const fullPath = path.join(process.cwd(), filePath);
  const issues: string[] = [];
  let severity: 'error' | 'warning' | 'info' = 'info';
  
  if (!fs.existsSync(fullPath)) {
    return {
      path: filePath,
      issues: ['Fichier introuvable'],
      severity: 'error',
    };
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Vérifier la gestion d'erreur
  if (!content.includes('try {') || !content.includes('catch')) {
    issues.push('Pas de gestion d\'erreur (try/catch)');
    severity = 'error';
  }
  
  // Vérifier les appels async sans await
  const asyncMatches = content.matchAll(/async\s+function\s+\w+/g);
  for (const match of asyncMatches) {
    const funcStart = content.indexOf(match[0]);
    const funcEnd = content.indexOf('}', funcStart);
    const funcContent = content.substring(funcStart, funcEnd);
    
    if (funcContent.includes('await') && !funcContent.includes('try')) {
      issues.push('Appels async sans gestion d\'erreur');
      severity = 'error';
    }
  }
  
  // Vérifier toISOString() sans vérification de type
  if (content.includes('.toISOString()')) {
    const toISOMatches = content.matchAll(/\.toISOString\(\)/g);
    let hasTypeCheck = false;
    for (const match of toISOMatches) {
      const before = content.substring(Math.max(0, match.index! - 200), match.index!);
      if (before.includes('instanceof Date') || before.includes('typeof') || before.includes('Date(')) {
        hasTypeCheck = true;
        break;
      }
    }
    if (!hasTypeCheck && content.includes('.toISOString()')) {
      issues.push('Utilisation de toISOString() sans vérification du type Date');
      severity = 'warning';
    }
  }
  
  // Vérifier les routes admin sans authentification
  if (filePath.includes('/admin/') && !content.includes('requireAdmin') && !content.includes('requirePermission')) {
    issues.push('Route admin sans authentification');
    severity = 'error';
  }
  
  // Vérifier les limites sur findAll
  if (content.includes('findAll(')) {
    const findAllMatches = content.matchAll(/findAll\([^)]*\)/g);
    for (const match of findAllMatches) {
      if (!match[0].includes('limit') && !match[0].includes('1000') && !match[0].includes('500')) {
        issues.push('findAll() sans limite explicite');
        severity = 'warning';
      }
    }
  }
  
  // Vérifier getRegistrations/getPresences avec await
  if (content.includes('getRegistrations') || content.includes('getPresences')) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('getRegistrations') || lines[i].includes('getPresences')) {
        if (!lines[i].includes('await') && !lines[i].trim().startsWith('//')) {
          issues.push('Appel à getRegistrations/getPresences sans await');
          severity = 'error';
        }
      }
    }
  }
  
  // Vérifier les réponses d'erreur
  if (content.includes('NextResponse.json') && !content.includes('status:')) {
    const errorResponses = content.matchAll(/NextResponse\.json\([^)]*error[^)]*\)/g);
    let hasStatus = false;
    for (const match of errorResponses) {
      const after = content.substring(match.index! + match[0].length, match.index! + match[0].length + 50);
      if (after.includes('status:')) {
        hasStatus = true;
        break;
      }
    }
    if (!hasStatus && content.includes('error')) {
      issues.push('Réponses d\'erreur sans code de statut HTTP');
      severity = 'warning';
    }
  }
  
  return {
    path: filePath,
    issues,
    severity,
  };
}

function main() {
  console.log('🔍 Vérification des routes API critiques...\n');
  
  const results: RouteCheck[] = [];
  
  for (const route of criticalRoutes) {
    const check = checkRoute(route);
    results.push(check);
  }
  
  // Afficher les résultats
  const errors = results.filter(r => r.severity === 'error');
  const warnings = results.filter(r => r.severity === 'warning');
  const ok = results.filter(r => r.issues.length === 0);
  
  if (errors.length > 0) {
    console.log('❌ Routes avec erreurs:\n');
    for (const result of errors) {
      console.log(`  ${result.path}`);
      for (const issue of result.issues) {
        console.log(`    - ${issue}`);
      }
      console.log('');
    }
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Routes avec avertissements:\n');
    for (const result of warnings) {
      console.log(`  ${result.path}`);
      for (const issue of result.issues) {
        console.log(`    - ${issue}`);
      }
      console.log('');
    }
  }
  
  if (ok.length > 0) {
    console.log(`✅ ${ok.length} routes OK\n`);
  }
  
  console.log('\n📊 Résumé:');
  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ OK: ${ok.length}`);
  console.log(`   ⚠️  Avertissements: ${warnings.length}`);
  console.log(`   ❌ Erreurs: ${errors.length}`);
}

main();
