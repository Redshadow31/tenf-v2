type AdminHeaderProps = {
  title: string;
};

export default function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="border-b border-white/5 bg-[#0e0e10] px-8 py-6">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
    </header>
  );
}

