"use client"

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useTheme } from "next-themes"

interface PieChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

// Default data used as fallback if no data is provided
const defaultData = [
  { name: "Farmers", value: 35 },
  { name: "Buyers", value: 65 },
]

// Light mode colors
const LIGHT_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"]

// Dark mode colors
const DARK_COLORS = ["#a78bfa", "#6ee7b7", "#fcd34d", "#fb923c", "#38bdf8"]

export function PieChart({ data = defaultData }: PieChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  
  // Select color palette based on theme
  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isDark ? "#1e293b" : "#fff",
            borderColor: isDark ? "#475569" : "#e2e8f0",
            color: isDark ? "#f8fafc" : "#333" 
          }}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

