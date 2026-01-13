import Link from "next/link";

interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

interface AdminHeaderProps {
  title: string;
  navLinks: NavLink[];
}

export default function AdminHeader({ title, navLinks }: AdminHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-[#9146ff] to-[#5a32b4] hover:opacity-80 transition-opacity" title="Retour au site">
            <span className="text-lg font-bold text-white">T</span>
          </Link>
          <h1 className="text-4xl font-bold text-white">{title}</h1>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1a1a1d] text-gray-300 hover:bg-[#252529] hover:text-white border border-[#2a2a2d] transition-colors flex items-center gap-2"
        >
          <span>←</span>
          <span>Retour au site</span>
        </Link>
      </div>
      <div className="flex flex-wrap gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              link.active
                ? "bg-[#9146ff] text-white"
                : "bg-[#1a1a1d] text-gray-300 hover:bg-[#252529] hover:text-white border border-[#2a2a2d]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}















