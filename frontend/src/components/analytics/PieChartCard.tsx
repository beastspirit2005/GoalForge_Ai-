const riskMix = [
  { label: "Low", value: 58, color: "bg-emerald-500" },
  { label: "Medium", value: 29, color: "bg-amber-500" },
  { label: "High", value: 13, color: "bg-rose-500" },
]

export default function PieChartCard() {
  return (
    <div className="space-y-4">
      <div
        className="mx-auto h-36 w-36 rounded-full"
        style={{
          background:
            "conic-gradient(#10b981 0 58%, #f59e0b 58% 87%, #f43f5e 87% 100%)",
        }}
      />
      <div className="grid gap-2">
        {riskMix.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-sm text-slate-600"
          >
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              {item.label} risk
            </span>
            <span className="font-medium text-slate-950">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
