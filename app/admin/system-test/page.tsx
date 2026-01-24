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

export default function SystemTestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
}
