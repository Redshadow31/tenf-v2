import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface CSVRow {
  horodatage: string;
  '21 jours moy': string;
  membres: string;
}

/**
 * GET - Récupère les données de croissance Discord depuis le CSV
 */
export async function GET() {
  try {
    // Lire le fichier CSV
    const csvPath = join(process.cwd(), 'data', 'members_chart.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parser le CSV
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    // Trouver les indices des colonnes
    const horodatageIndex = headers.indexOf('horodatage');
    const moyenneIndex = headers.indexOf('21 jours moy');
    const membresIndex = headers.indexOf('membres');
    
    if (horodatageIndex === -1 || membresIndex === -1) {
      return NextResponse.json(
        { error: 'Format CSV invalide' },
        { status: 500 }
      );
    }
    
    // Parser les lignes de données
    const data: Array<{ date: Date; membres: number; moyenne?: number }> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Parser la ligne CSV (gérer les virgules dans les valeurs si nécessaire)
      const values = line.split(',');
      
      const horodatage = values[horodatageIndex]?.trim();
      const membresStr = values[membresIndex]?.trim();
      const moyenneStr = moyenneIndex !== -1 ? values[moyenneIndex]?.trim() : '';
      
      if (!horodatage || !membresStr || membresStr === '') continue;
      
      const date = new Date(horodatage);
      const membres = parseInt(membresStr, 10);
      const moyenne = moyenneStr && moyenneStr !== '' && moyenneStr !== 'null' 
        ? parseFloat(moyenneStr) 
        : undefined;
      
      if (isNaN(membres) || isNaN(date.getTime())) continue;
      
      data.push({
        date,
        membres,
        moyenne: moyenne && !isNaN(moyenne) ? moyenne : undefined,
      });
    }
    
    // Trier par date
    data.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Grouper par mois et prendre la dernière valeur de chaque mois
    const monthlyData: Record<string, { membres: number; moyenne?: number; date: Date }> = {};
    
    data.forEach((row) => {
      const monthKey = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, '0')}`;
      
      // Prendre la dernière valeur du mois (la plus récente)
      if (!monthlyData[monthKey] || row.date > monthlyData[monthKey].date) {
        monthlyData[monthKey] = { 
          membres: row.membres, 
          moyenne: row.moyenne,
          date: row.date,
        };
      }
    });
    
    // Convertir en format pour le graphique
    const monthNames = [
      'Janv', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
    ];
    
    const chartData = Object.keys(monthlyData)
      .sort()
      .map((monthKey, index, array) => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const monthData = monthlyData[monthKey];
        
        // Afficher l'année seulement si c'est le premier mois de l'année ou si l'année change
        const prevMonthKey = index > 0 ? array[index - 1] : null;
        const prevYear = prevMonthKey ? prevMonthKey.split('-')[0] : null;
        const showYear = !prevYear || prevYear !== year;
        
        return {
          month: showYear ? `${monthNames[monthIndex]} ${year}` : monthNames[monthIndex],
          value: monthData.membres,
          moyenne: monthData.moyenne,
        };
      });
    
    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error('Erreur lors de la lecture du CSV:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la lecture des données' },
      { status: 500 }
    );
  }
}

