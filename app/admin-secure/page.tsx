"use client";

import { useState } from "react";

export default function AdminSecure() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function login() {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, pin }),
    });

    if (res.ok) {
      window.location.href = "/admin";
    } else {
      setError("Identifiants incorrects");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-[#1a1a1d] p-8 rounded-xl w-[350px]">
        <h1 className="text-xl font-semibold mb-6">Connexion Admin TENF</h1>

        <input
          type="text"
          placeholder="Identifiant"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-[#2a2a2d] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9146ff]"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-[#2a2a2d] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9146ff]"
        />

        <input
          type="text"
          placeholder="PIN (4 chiffres)"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
          className="w-full p-3 mb-3 rounded bg-[#2a2a2d] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9146ff]"
        />

        {error && <p className="text-red-400 mb-3">{error}</p>}

        <button
          onClick={login}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded font-semibold transition-colors"
        >
          Connexion
        </button>
      </div>
    </div>
  );
}










