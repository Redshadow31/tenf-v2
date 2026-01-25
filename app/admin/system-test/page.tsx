"use client";

import React, { useState, useEffect } from "react";
import { requireAdmin } from "@/lib/requireAdmin";

interface SystemTestResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

interface TestResults {
  [key: string]: SystemTestResult | Record<string, SystemTestResult>;
}

interface ConnectionTestResult {
  service: string;
  status: 'success' | 'error' | 'warning' | 'not-testable';
  message: string;
  details?: any;
}

interface ConnectionTestResponse {
  timestamp: string;
  environment: Record<string, string>;
  summary: {
    total: number;
    success: number;
    errors: number;
    warnings: number;
    notTestable: number;
  };
  results: ConnectionTestResult[];
}

export default function SystemTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<ConnectionTestResponse | null>(null);
  const [testingConnections, setTestingConnections] = useState(false);

  const runTests = async (system?: string) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const url = system 
        ? `/api/admin/system-test?system=${system}`
        : '/api/admin/system-test';
      
      const response = await fetch(url, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const testConnections = async () => {
    setTestingConnections(true);
    setError(null);
    setConnectionResults(null);

    try {
      const response = await fetch('/api/admin/system-test/connections', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setConnectionResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setTestingConnections(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const renderResult = (key: string, result: SystemTestResult | Record<string, SystemTestResult>) => {
    if (result && typeof result === 'object' && 'status' in result) {
      // C'est un résultat simple
      const testResult = result as SystemTestResult;
      return (
        <div
          key={key}
          className={`p-4 rounded-lg border ${getStatusBg(testResult.status)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {key}
              </h3>
              <p className={`text-sm mt-1 ${getStatusColor(testResult.status)}`}>
                {testResult.message}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium ${getStatusColor(testResult.status)}`}>
                {testResult.status.toUpperCase()}
              </span>
              {testResult.duration && (
                <p className="text-xs text-gray-500 mt-1">
                  {testResult.duration}ms
                </p>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      // C'est un objet de résultats (ex: repositories)
      const repoResults = result as Record<string, SystemTestResult>;
      return (
        <div key={key} className="space-y-3">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
            {key}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(repoResults).map(([repoKey, repoResult]) => (
              <div
                key={repoKey}
                className={`p-3 rounded-lg border ${getStatusBg(repoResult.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                      {repoKey}
                    </h4>
                    <p className={`text-xs mt-1 ${getStatusColor(repoResult.status)}`}>
                      {repoResult.message}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${getStatusColor(repoResult.status)}`}>
                      {repoResult.status.toUpperCase()}
                    </span>
                    {repoResult.duration && (
                      <p className="text-xs text-gray-500 mt-1">
                        {repoResult.duration}ms
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Tests Système
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Testez tous les systèmes du site (Supabase, Redis, Repositories, APIs)
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedSystem || ''}
            onChange={(e) => setSelectedSystem(e.target.value || null)}
            className="rounded-lg border px-4 py-2 text-sm"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <option value="">Tous les systèmes</option>
            <option value="supabase">Supabase</option>
            <option value="redis">Redis</option>
            <option value="repositories">Repositories</option>
            <option value="twitch">Twitch API</option>
            <option value="discord">Discord API</option>
          </select>
          <button
            onClick={() => runTests(selectedSystem || undefined)}
            disabled={loading}
            className="rounded-lg px-6 py-2 text-white font-semibold transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? 'Test en cours...' : 'Lancer les tests'}
          </button>
          <button
            onClick={testConnections}
            disabled={testingConnections}
            className="rounded-lg px-6 py-2 text-white font-semibold transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            {testingConnections ? 'Test en cours...' : 'Tester les connexions'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {Object.entries(results).map(([key, result]) => renderResult(key, result))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Tests en cours...
          </div>
        </div>
      )}

      {!loading && !results && !error && (
        <div className="text-center py-12">
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Cliquez sur "Lancer les tests" pour commencer
          </p>
        </div>
      )}

      {/* Section Test des Connexions */}
      {connectionResults && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              Test des Connexions
            </h2>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {new Date(connectionResults.timestamp).toLocaleString('fr-FR')}
            </div>
          </div>

          {/* Résumé */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/20">
              <div className="text-2xl font-bold text-blue-500">{connectionResults.summary.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
              <div className="text-2xl font-bold text-green-500">{connectionResults.summary.success}</div>
              <div className="text-sm text-gray-500">Succès</div>
            </div>
            <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/20">
              <div className="text-2xl font-bold text-red-500">{connectionResults.summary.errors}</div>
              <div className="text-sm text-gray-500">Erreurs</div>
            </div>
            <div className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/20">
              <div className="text-2xl font-bold text-yellow-500">{connectionResults.summary.warnings}</div>
              <div className="text-sm text-gray-500">Avertissements</div>
            </div>
            <div className="p-4 rounded-lg border bg-gray-500/10 border-gray-500/20">
              <div className="text-2xl font-bold text-gray-500">{connectionResults.summary.notTestable}</div>
              <div className="text-sm text-gray-500">Non testable</div>
            </div>
          </div>

          {/* Environnement */}
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Environnement</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(connectionResults.environment).map(([key, value]) => (
                <div key={key}>
                  <span className="text-gray-500">{key}:</span>{' '}
                  <span style={{ color: 'var(--color-text)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Résultats détaillés */}
          <div className="space-y-3">
            {connectionResults.results.map((result) => (
              <div
                key={result.service}
                className={`p-4 rounded-lg border ${
                  result.status === 'success' ? 'bg-green-500/10 border-green-500/20' :
                  result.status === 'error' ? 'bg-red-500/10 border-red-500/20' :
                  result.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-gray-500/10 border-gray-500/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {result.service}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      result.status === 'success' ? 'text-green-500' :
                      result.status === 'error' ? 'text-red-500' :
                      result.status === 'warning' ? 'text-yellow-500' :
                      'text-gray-500'
                    }`}>
                      {result.message}
                    </p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-gray-500 hover:text-gray-400">
                          Détails
                        </summary>
                        <pre className="mt-2 text-xs p-2 rounded bg-black/20 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      result.status === 'success' ? 'bg-green-500/20 text-green-500' :
                      result.status === 'error' ? 'bg-red-500/20 text-red-500' :
                      result.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {testingConnections && (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Test des connexions en cours...
          </div>
        </div>
      )}
    </div>
  );
}
