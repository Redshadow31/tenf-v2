/**
 * Script pour vérifier que les propriétés admin sont correctement utilisées
 * 
 * Règles :
 * - getCurrentAdmin() → AdminUser avec admin.id (pas discordId)
 * - requireAdmin() / requirePermission() / requireSectionAccess() → AuthenticatedAdmin avec admin.discordId (pas id)
 */

import * as fs from 'fs';
import * as path from 'path';

const API_DIR = path.join(process.cwd(), 'app', 'api');

interface FileIssue {
  file: string;
  line: number;
  content: string;
  issue: string;
}

const issues: FileIssue[] = [];

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const usesGetCurrentAdmin = content.includes('getCurrentAdmin');
  const usesRequireAdmin = content.includes('requireAdmin') || 
                          content.includes('requirePermission') || 
                          content.includes('requireSectionAccess');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Si utilise getCurrentAdmin, admin.id est correct, admin.discordId est incorrect
    if (usesGetCurrentAdmin && !usesRequireAdmin) {
      if (line.includes('admin.discordId')) {
        issues.push({
          file: filePath,
          line: lineNum,
          content: line.trim(),
          issue: 'getCurrentAdmin() retourne AdminUser avec id, pas discordId. Utiliser admin.id'
        });
      }
    }
    
    // Si utilise requireAdmin/requirePermission/requireSectionAccess, admin.discordId est correct, admin.id est incorrect
    if (usesRequireAdmin && !usesGetCurrentAdmin) {
      if (line.includes('admin.id') && !line.includes('admin.discordId')) {
        // Vérifier que ce n'est pas juste un commentaire ou une string
        if (!line.trim().startsWith('//') && !line.includes("'admin.id'") && !line.includes('"admin.id"')) {
          issues.push({
            file: filePath,
            line: lineNum,
            content: line.trim(),
            issue: 'requireAdmin/requirePermission/requireSectionAccess retourne AuthenticatedAdmin avec discordId, pas id. Utiliser admin.discordId'
          });
        }
      }
    }
    
    // Si utilise les deux, c'est ambigu - signaler
    if (usesGetCurrentAdmin && usesRequireAdmin) {
      if (line.includes('admin.id') || line.includes('admin.discordId')) {
        issues.push({
          file: filePath,
          line: lineNum,
          content: line.trim(),
          issue: 'Fichier utilise à la fois getCurrentAdmin() et requireAdmin - vérifier manuellement'
        });
      }
    }
  });
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      checkFile(filePath);
    }
  });
}

// Exécuter la vérification
console.log('🔍 Vérification des propriétés admin...\n');
walkDir(API_DIR);

if (issues.length === 0) {
  console.log('✅ Aucun problème détecté !');
  process.exit(0);
} else {
  console.log(`❌ ${issues.length} problème(s) détecté(s) :\n`);
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file}:${issue.line}`);
    console.log(`   ${issue.issue}`);
    console.log(`   ${issue.content}\n`);
  });
  
  process.exit(1);
}
