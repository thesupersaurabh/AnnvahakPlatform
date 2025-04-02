"use client"

import {
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { useTheme } from "next-themes"

interface LineChartProps {
  data: {
    name: string;
    total: number;
  }[];
}

// Default data used as fallback if no data is provided
const defaultData = [
  {
    name: "Jan",
    total: 5000,
  },
  {
    name: "Feb",
    total: 7800,
  },
  {
    name: "Mar",
    total: 8900,
  },
  {
    name: "Apr",
    total: 10200,
  },
  {
    name: "May",
    total: 9100,
  },
  {
    name: "Jun",
    total: 12000,
  },
  {
    name: "Jul",
    total: 14500,
  },
  {
    name: "Aug",
    total: 16000,
  },
  {
    name: "Sep",
    total: 15200,
  },
  {
    name: "Oct",
    total: 17800,
  },
  {
    name: "Nov",
    total: 19500,
  },
  {
    name: "Dec",
    total: 21000,
  },
]

export function LineChart({ data = defaultData }: LineChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  
  // Colors based on theme
  const textColor = isDark ? "#94a3b8" : "#888888"
  const gridColor = isDark ? "#334155" : "#e2e8f0"
  const lineColor = isDark ? "#a78bfa" : "#8884d8"
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
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
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip 
          formatter={(value) => [`₹${value}`, "Revenue"]}
          contentStyle={{ 
            backgroundColor: isDark ? "#1e293b" : "#fff",
            borderColor: isDark ? "#475569" : "#e2e8f0",
            color: isDark ? "#f8fafc" : "#333" 
          }}
          itemStyle={{ color: isDark ? "#a78bfa" : "#8884d8" }}
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke={lineColor}
          strokeWidth={2} 
          dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
          activeDot={{ 
            fill: lineColor, 
            strokeWidth: 4, 
            r: 6,
            stroke: isDark ? "#1e293b" : "#fff"
          }} 
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

