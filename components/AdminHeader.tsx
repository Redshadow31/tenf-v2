"use client";

import ThemeToggle from "./ThemeToggle";

type AdminHeaderProps = {
  title: string;
};

export default function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="border-b px-8 py-6 flex items-center justify-between" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h1>
      <ThemeToggle />
    </header>
  );
}

