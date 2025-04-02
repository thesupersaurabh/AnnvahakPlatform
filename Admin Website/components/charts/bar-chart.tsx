"use client"

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useTheme } from "next-themes"

interface BarChartProps {
  data: {
    name: string;
    total: number;
  }[];
}

// Default data used as fallback if no data is provided
const defaultData = [
  {
    name: "Vegetables",
    total: 45,
  },
  {
    name: "Fruits",
    total: 32,
  },
  {
    name: "Grains",
    total: 18,
  },
  {
    name: "Dairy",
    total: 12,
  },
  {
    name: "Meat",
    total: 8,
  },
  {
    name: "Others",
    total: 5,
  },
]

export function BarChart({ data = defaultData }: BarChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  
  // Colors based on theme
  const textColor = isDark ? "#94a3b8" : "#888888"
  const barColor = isDark ? "#a78bfa" : "#8884d8"
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsBarChart data={data}>
        <XAxis 
          dataKey="name" 
          stroke={textColor} 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke={textColor} 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `${value}`} 
        />
        <Tooltip
          cursor={{ fill: isDark ? "rgba(51, 65, 85, 0.3)" : "rgba(226, 232, 240, 0.3)" }}
          contentStyle={{ 
            backgroundColor: isDark ? "#1e293b" : "#fff",
            borderColor: isDark ? "#475569" : "#e2e8f0",
            color: isDark ? "#f8fafc" : "#333" 
          }}
          itemStyle={{ color: isDark ? "#a78bfa" : "#8884d8" }}
        />
        <Bar 
          dataKey="total" 
          fill={barColor} 
          radius={[4, 4, 0, 0]} 
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

