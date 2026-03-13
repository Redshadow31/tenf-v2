import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

interface DailyRow {
  date: string;
  visits: number;
  clicks: number;
}

interface Props {
  daily: DailyRow[];
}

export default function PageActivityDailyChart({ daily }: Props) {
  const chartData = daily.map((row) => ({
    ...row,
    day: row.date.slice(8, 10),
  }));

  return (
    <div className="rounded-lg border border-[#2a2a2d] bg-[#1a1a1d] p-4">
      <h3 className="mb-2 text-lg font-semibold">Visites & clics par jour</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#32323a" />
            <XAxis dataKey="day" stroke="#9ca3af" tickLine={false} />
            <YAxis stroke="#9ca3af" tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#121218", border: "1px solid #2a2a2d", borderRadius: 8 }}
              labelFormatter={(value) => `Jour ${value}`}
            />
            <Bar dataKey="visits" name="Visites" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="clicks" name="Clics" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
