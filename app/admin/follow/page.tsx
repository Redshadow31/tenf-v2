const mockFollow = [
  {
    id: "1",
    name: "FollowerOne",
    avatar: "/placeholder-follow1.png",
    note: "Suivi prioritaire",
  },
  {
    id: "2",
    name: "FollowerTwo",
    avatar: "/placeholder-follow2.png",
    note: "À relancer",
  },
  {
    id: "3",
    name: "FollowerThree",
    avatar: "/placeholder-follow3.png",
    note: "OK",
  },
];

export default function Page() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-white">Admin - Suivi Follow</h1>
      <div className="space-y-3">
        {mockFollow.map((user) => (
          <div
            key={user.id}
            className="card flex items-center gap-3 bg-[#1a1a1d] border border-gray-700 p-4"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="h-12 w-12 rounded-full object-cover border border-gray-700"
            />
            <div className="flex-1">
              <p className="font-semibold text-white">{user.name}</p>
              <p className="text-sm text-gray-400">{user.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
