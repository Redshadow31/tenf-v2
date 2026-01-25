/**
 * Script de vérification des routes API
 * Identifie les routes qui peuvent avoir des problèmes
 */

import fs from 'fs';
import path from 'path';

interface RouteInfo {
  path: string;
  methods: string[];
  hasErrorHandling: boolean;
  hasAuth: boolean;
  potentialIssues: string[];
}

const routesDir = path.join(process.cwd(), 'app/api');

function findRouteFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.name === 'route.ts') {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function analyzeRoute(filePath: string): RouteInfo {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(path.join(process.cwd(), 'app/api'), '').replace(/\\/g, '/').replace(/^\//, '');
  
  const info: RouteInfo = {
    path: relativePath,
    methods: [],
    hasErrorHandling: false,
    hasAuth: false,
    potentialIssues: [],
  };
  
  // Détecter les méthodes HTTP
  if (content.includes('export async function GET')) info.methods.push('GET');
  if (content.includes('export async function POST')) info.methods.push('POST');
  if (content.includes('export async function PUT')) info.methods.push('PUT');
  if (content.includes('export async function DELETE')) info.methods.push('DELETE');
  if (content.includes('export async function PATCH')) info.methods.push('PATCH');
  
  // Vérifier la gestion d'erreur
  if (content.includes('try {') && content.includes('catch')) {
    info.hasErrorHandling = true;
  } else {
    info.potentialIssues.push('Pas de gestion d\'erreur (try/catch)');
  }
  
  // Vérifier l'authentification
  if (content.includes('requireAdmin') || content.includes('requirePermission') || content.includes('requireAuth')) {
    info.hasAuth = true;
  } else if (relativePath.includes('/admin/') || relativePath.includes('/academy/')) {
    info.potentialIssues.push('Route admin sans authentification');
  }
  
  // Vérifier les problèmes courants
  if (content.includes('.toISOString()') && !content.includes('instanceof Date')) {
    info.potentialIssues.push('Utilisation de toISOString() sans vérification du type Date');
  }
  
  if (content.includes('await') && !content.includes('try')) {
    info.potentialIssues.push('Appels async sans gestion d\'erreur');
  }
  
  if (content.includes('findAll(') && !content.includes('limit')) {
    info.potentialIssues.push('findAll() sans limite explicite');
  }
  
  if (content.includes('getRegistrations') || content.includes('getPresences')) {
    // Vérifier si ces méthodes sont appelées correctement
    if (!content.includes('await')) {
      info.potentialIssues.push('Appel à getRegistrations/getPresences sans await');
    }
  }
  
  return info;
}

function main() {
  console.log('🔍 Vérification des routes API...\n');
  
  const routeFiles = findRouteFiles(routesDir);
  console.log(`📁 ${routeFiles.length} routes trouvées\n`);
  
  const routes: RouteInfo[] = [];
  const routesWithIssues: RouteInfo[] = [];
  
  for (const file of routeFiles) {
    const info = analyzeRoute(file);
    routes.push(info);
    
    if (info.potentialIssues.length > 0) {
      routesWithIssues.push(info);
    }
  }
  
  // Afficher les routes avec problèmes
  if (routesWithIssues.length > 0) {
    console.log('⚠️  Routes avec problèmes potentiels:\n');
    for (const route of routesWithIssues) {
      console.log(`📌 ${route.path}`);
      console.log(`   Méthodes: ${route.methods.join(', ') || 'Aucune'}`);
      console.log(`   Problèmes:`);
      for (const issue of route.potentialIssues) {
        console.log(`     - ${issue}`);
      }
      console.log('');
    }
  } else {
    console.log('✅ Aucun problème détecté dans les routes');
  }
  
  // Résumé
  console.log('\n📊 Résumé:');
  console.log(`   Total routes: ${routes.length}`);
  console.log(`   Routes avec problèmes: ${routesWithIssues.length}`);
  console.log(`   Routes sans gestion d'erreur: ${routes.filter(r => !r.hasErrorHandling).length}`);
  console.log(`   Routes admin sans auth: ${routes.filter(r => r.path.includes('/admin/') && !r.hasAuth).length}`);
}

main();
