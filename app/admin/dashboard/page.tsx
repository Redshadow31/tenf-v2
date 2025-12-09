const mockTopMembers = [
  { id: "1", name: "CreatorOne", avatar: "/placeholder-dash1.png", role: "Staff" },
  { id: "2", name: "CreatorTwo", avatar: "/placeholder-dash2.png", role: "Affilié" },
  { id: "3", name: "CreatorThree", avatar: "/placeholder-dash3.png", role: "Développement" },
];

export default function Page() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-white">Admin - Dashboard</h1>

      <section className="card bg-[#1a1a1d] border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white">Top membres</h2>
        <div className="mt-4 space-y-3">
          {mockTopMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <img
                src={member.avatar}
                alt={member.name}
                className="h-12 w-12 rounded-full object-cover border border-gray-700"
              />
              <div className="flex-1">
                <p className="font-semibold text-white">{member.name}</p>
                <p className="text-sm text-gray-400">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
