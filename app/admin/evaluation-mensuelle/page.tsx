const mockEvaluations = [
  {
    id: "1",
    name: "CreatorOne",
    avatar: "/placeholder-eval1.png",
    score: 18,
  },
  {
    id: "2",
    name: "CreatorTwo",
    avatar: "/placeholder-eval2.png",
    score: 15,
  },
  {
    id: "3",
    name: "CreatorThree",
    avatar: "/placeholder-eval3.png",
    score: 12,
  },
];

export default function Page() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-white">Admin - Évaluation Mensuelle</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {mockEvaluations.map((member) => (
          <div
            key={member.id}
            className="card flex items-center gap-3 bg-[#1a1a1d] border border-gray-700 p-4"
          >
            <img
              src={member.avatar}
              alt={member.name}
              className="h-12 w-12 rounded-full object-cover border border-gray-700"
            />
            <div className="flex-1">
              <p className="font-semibold text-white">{member.name}</p>
              <p className="text-sm text-gray-400">Score : {member.score}/20</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
