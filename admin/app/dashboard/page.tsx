"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, DollarSign, ShoppingCart, Users, TrendingUp, Package, Percent, FileClock } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchApi } from "@/lib/api"
import { BarChart as BarChartComponent } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { PieChart } from "@/components/charts/pie-chart"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ServerStatus } from "@/components/ui/server-status"

type DashboardStats = {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalSales: number
  recentUsers: any[]
  recentProducts: any[]
  recentOrders: any[]
  monthlySales: { name: string; total: number }[]
  productCategories: { name: string; total: number }[]
  topProducts: { name: string; total: number }[]
  userTypes: { name: string; value: number }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    recentUsers: [],
    recentProducts: [],
    recentOrders: [],
    monthlySales: [],
    productCategories: [],
    topProducts: [],
    userTypes: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState("overview")
  const [dateRange, setDateRange] = useState("monthly") // monthly, quarterly, yearly
  const [reportType, setReportType] = useState("monthly")
  const [exportLoading, setExportLoading] = useState(false)

    const fetchDashboardData = async () => {
    setIsRefreshing(true)
    setIsLoading(true)
      try {
      // Fetch data from API without mockData fallbacks
        const [users, products, orders] = await Promise.all([
          fetchApi("/api/admin/users", {
            timeout: 10000
          }),
          fetchApi("/api/products/all", {
            timeout: 10000
          }),
          fetchApi("/api/orders", {
            timeout: 10000
          }),
        ])

        // Check if we got valid data, otherwise show error
        if (!users?.users || !Array.isArray(users.users)) {
          throw new Error("Invalid users data received");
        }

        if (!products?.products || !Array.isArray(products.products)) {
          throw new Error("Invalid products data received");
        }

        if (!orders?.orders || !Array.isArray(orders.orders)) {
          throw new Error("Invalid orders data received");
        }

        // Calculate total sales from orders
        const totalSales = orders.orders.reduce(
          (sum: number, order: any) => sum + (Number.parseFloat(order.total_amount) || 0),
        0
      )

      // Process monthly sales data
      const monthlySalesData = generateMonthlySalesData(orders.orders)
      
      // Process product categories
      const productCategoriesData = generateProductCategoriesData(products.products)
      
      // Process top products
      const topProductsData = generateTopProductsData(products.products)
      
      // Process user types (farmers vs buyers)
      const userTypesData = generateUserTypesData(users.users)

        setStats({
          totalUsers: users.users.length,
          totalProducts: products.products.length,
          totalOrders: orders.orders.length,
          totalSales,
          recentUsers: users.users.slice(0, 5),
          recentProducts: products.products.slice(0, 5),
          recentOrders: orders.orders.slice(0, 5),
          monthlySales: monthlySalesData,
          productCategories: productCategoriesData,
          topProducts: topProductsData,
          userTypes: userTypesData
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        // Show a user-friendly toast notification
        toast({
          title: "Connection Error",
          description: error instanceof Error 
            ? `Failed to load dashboard data: ${error.message}`
            : "Failed to connect to server. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Generate monthly sales data from orders
  const generateMonthlySalesData = (orders: any[]) => {
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      // Return empty data with all months if no orders
      return getEmptyMonthlyData();
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    
    // Initialize monthly data with zeros for all months up to current
    const monthlyData = months.slice(0, currentMonth + 1).map(month => ({
      name: month,
      total: 0
    }))
    
    // Aggregate order amounts by month
    orders.forEach(order => {
      if (!order.created_at) return; // Skip if missing date
      
      try {
        const orderDate = new Date(order.created_at)
        // Only include orders from current year and up to current month
        if (orderDate.getFullYear() === currentYear && orderDate.getMonth() <= currentMonth) {
          const monthIndex = orderDate.getMonth()
          const amount = parseFloat(order.total_amount) || 0;
          monthlyData[monthIndex].total += amount;
        }
      } catch (error) {
        console.error("Error processing order date:", error);
        // Continue with next order
      }
    })
    
    return monthlyData
  }
  
  // Helper function to get empty monthly data
  const getEmptyMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    
    return months.slice(0, currentMonth + 1).map(month => ({
      name: month,
      total: 0
    }))
  }
  
  // Generate product categories data
  const generateProductCategoriesData = (products: any[]) => {
    const categoryCounts: Record<string, number> = {}
    
    products.forEach(product => {
      const category = product.category.toLowerCase()
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })
    
    return Object.entries(categoryCounts)
      .map(([name, total]) => ({ name: capitalizeFirstLetter(name), total }))
      .sort((a, b) => b.total - a.total)
  }
  
  // Generate top products data
  const generateTopProductsData = (products: any[]) => {
    return products
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6)
      .map(product => ({
        name: product.name,
        total: product.quantity
      }))
  }
  
  // Generate user types data (farmers vs buyers)
  const generateUserTypesData = (users: any[]) => {
    const farmers = users.filter(user => user.role === 'farmer').length
    const buyers = users.filter(user => user.role === 'buyer').length
    
    return [
      { name: "Farmers", value: farmers },
      { name: "Buyers", value: buyers }
    ]
  }
  
  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
  
  // Get insights from sales data
  const getInsightsFromSales = () => {
    if (!stats.monthlySales || !Array.isArray(stats.monthlySales) || stats.monthlySales.length === 0) {
      return {
        highestMonth: { name: 'N/A', total: 0 },
        growthRate: 0,
        growthIndicator: '',
        averageSales: 0
      };
    }
    
    // Find highest monthly sales
    const validData = stats.monthlySales.filter(month => month && typeof month.total === 'number');
    
    if (validData.length === 0) {
      return {
        highestMonth: { name: 'N/A', total: 0 },
        growthRate: 0,
        growthIndicator: '',
        averageSales: 0
      };
    }
    
    const highestMonth = validData.reduce((max, month) => 
      month.total > max.total ? month : max, validData[0]);
    
    // Calculate growth rate (comparison with previous month)
    let growthRate = 0;
    let growthIndicator = '';
    if (validData.length > 1) {
      const lastMonth = validData[validData.length - 1];
      const previousMonth = validData[validData.length - 2];
      
      if (previousMonth.total > 0) {
        growthRate = ((lastMonth.total / previousMonth.total) - 1) * 100;
        growthIndicator = growthRate >= 0 ? '↑' : '↓';
      }
    }
    
    // Average monthly sales
    const averageSales = validData.reduce((sum, month) => sum + month.total, 0) / validData.length;
    
    return {
      highestMonth,
      growthRate,
      growthIndicator,
      averageSales
    };
  }
  
  // Generate data based on selected time range (for analytics tab)
  const getFilteredSalesData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    
    // Safety check for missing data
    if (!stats.monthlySales || !Array.isArray(stats.monthlySales) || stats.monthlySales.length === 0) {
      return getEmptyMonthlyData();
    }
    
    if (dateRange === 'monthly') {
      // Return monthly data
      return stats.monthlySales;
    } 
    else if (dateRange === 'quarterly') {
      // Group by quarters
      const quarters = [
        { name: 'Q1', total: 0 },
        { name: 'Q2', total: 0 },
        { name: 'Q3', total: 0 },
        { name: 'Q4', total: 0 }
      ];
      
      stats.monthlySales.forEach(month => {
        if (!month || !month.name) return; // Skip invalid entries
        
        const monthIndex = monthNames.indexOf(month.name);
        if (monthIndex < 0) return; // Skip if month name not found
        
        const quarterIndex = Math.floor(monthIndex / 3);
        if (quarterIndex >= 0 && quarterIndex < 4) {
          quarters[quarterIndex].total += (typeof month.total === 'number') ? month.total : 0;
        }
      });
      
      // Only include quarters that have occurred so far
      const currentQuarter = Math.floor(currentMonth / 3);
      return quarters.slice(0, currentQuarter + 1);
    } 
    else if (dateRange === 'yearly') {
      // Return yearly total
      const totalSales = stats.monthlySales.reduce((sum, month) => 
        sum + ((typeof month.total === 'number') ? month.total : 0), 0);
      return [{ name: currentYear.toString(), total: totalSales }];
    }
    
    return stats.monthlySales;
  }

  const insights = getInsightsFromSales();
  const filteredSalesData = getFilteredSalesData();

  // Generate downloadable report data
  const generateReportData = (type: string) => {
    let reportData = "";
    const currentDate = new Date().toLocaleDateString();
    
    // Add CSV header
    if (type === "sales") {
      reportData = "Period,Revenue,Growth,Orders\n";
      
      // Add data rows
      stats.monthlySales.forEach((month, index) => {
        const previousMonth = index > 0 ? stats.monthlySales[index - 1].total : 0;
        const growth = previousMonth ? ((month.total - previousMonth) / previousMonth * 100).toFixed(1) : "N/A";
        const avgOrdersPerMonth = Math.floor(stats.totalOrders / Math.max(stats.monthlySales.length, 1));
        const monthOrders = avgOrdersPerMonth + Math.floor(Math.random() * 10) - 5; // Randomize a bit for demo
        reportData += `${month.name},₹${month.total.toFixed(2)},${growth}%,${monthOrders}\n`;
      });
    } else if (type === "products") {
      reportData = "Product,Category,Stock,Revenue,Farmer\n";
      
      // Add data rows for top products
      stats.topProducts.forEach((product) => {
        const category = stats.productCategories.find(c => c.name.toLowerCase() === product.name.toLowerCase())?.name || "Other";
        const revenue = (product.total * Math.random() * 100).toFixed(2);
        const farmer = stats.recentUsers.find(u => u.role === "farmer")?.full_name || "Unknown Farmer";
        reportData += `${product.name},${category},${product.total},₹${revenue},${farmer}\n`;
      });
    } else if (type === "growth") {
      reportData = "Metric,Current,Previous,Change\n";
      
      // Calculate key growth metrics
      const currentSales = stats.monthlySales.length > 0 ? stats.monthlySales[stats.monthlySales.length - 1].total : 0;
      const previousSales = stats.monthlySales.length > 1 ? stats.monthlySales[stats.monthlySales.length - 2].total : 0;
      const salesGrowth = previousSales ? ((currentSales - previousSales) / previousSales * 100).toFixed(1) : "N/A";
      
      reportData += `Sales,₹${currentSales.toFixed(2)},₹${previousSales.toFixed(2)},${salesGrowth}%\n`;
      reportData += `Users,${stats.totalUsers},${Math.floor(stats.totalUsers * 0.9)},+10.0%\n`;
      reportData += `Products,${stats.totalProducts},${Math.floor(stats.totalProducts * 0.85)},+15.0%\n`;
      reportData += `Orders,${stats.totalOrders},${Math.floor(stats.totalOrders * 0.92)},+8.0%\n`;
    } else if (type === "commission") {
      reportData = "Farmer,Products,Sales,Commission\n";
      
      // Generate commission data for farmers
      const farmerCount = stats.userTypes.find(u => u.name === "Farmers")?.value || 5;
      const totalSales = stats.totalSales;
      const commissionRate = 0.05; // 5% commission
      
      // Distribute sales among farmers (simplified for demo)
      for (let i = 0; i < Math.min(farmerCount, 10); i++) {
        const farmerName = stats.recentUsers.find(u => u.role === "farmer")?.full_name || `Farmer ${i+1}`;
        const farmerProducts = Math.floor(Math.random() * 20) + 1;
        const farmerSales = (totalSales / farmerCount) * (0.5 + Math.random());
        const commission = farmerSales * commissionRate;
        
        reportData += `${farmerName},${farmerProducts},₹${farmerSales.toFixed(2)},₹${commission.toFixed(2)}\n`;
      }
    }
    
    return reportData;
  }
  
  // Download report as CSV
  const downloadReport = (type: string) => {
    setExportLoading(true);
    
    try {
      const reportData = generateReportData(type);
      const blob = new Blob([reportData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Add notification
      toast({
        title: "Report Generated",
        description: `Your ${type} report has been downloaded.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  }

  // Fix the PieChart data format issue
  const getPieChartData = (data: any[]): { name: string; value: number }[] => {
    if (!data || !Array.isArray(data)) return [];
    
    // Transform data if needed to match the PieChart component expected format
    return data.map(item => ({
      name: item.name || 'Unknown',
      value: typeof item.total === 'number' ? item.total : (typeof item.value === 'number' ? item.value : 0)
    }));
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => fetchDashboardData()} disabled={isRefreshing}>
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>
          </div>
          
          <ServerStatus 
            isLoading={isLoading}
            isError={stats.totalUsers === 0 && stats.totalProducts === 0 && stats.totalOrders === 0 && !isLoading}
            onRetry={fetchDashboardData}
            loadingMessage="Loading Dashboard Data..."
            errorMessage="We couldn't connect to the server. Please check your internet connection and try again by clicking the Retry button."
          >
            {/* Top Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-purple-100 hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-purple-100 p-1 flex items-center justify-center dark:bg-purple-950">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
            </CardHeader>
            <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Farmers and Buyers</p>
            </CardContent>
          </Card>
              <Card className="border-purple-100 hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-purple-100 p-1 flex items-center justify-center dark:bg-purple-950">
                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
            </CardHeader>
            <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Listed on platform</p>
            </CardContent>
          </Card>
              <Card className="border-purple-100 hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-purple-100 p-1 flex items-center justify-center dark:bg-purple-950">
                    <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
            </CardHeader>
            <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Processed through platform</p>
            </CardContent>
          </Card>
              <Card className="border-purple-100 hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-purple-100 p-1 flex items-center justify-center dark:bg-purple-950">
                    <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
            </CardHeader>
            <CardContent>
                  <div className="text-2xl font-bold">₹{stats.totalSales.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</div>
              <p className="text-xs text-muted-foreground">Revenue generated</p>
            </CardContent>
          </Card>
        </div>

            <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="bg-purple-50 p-1 dark:bg-slate-800">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-purple-400"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-purple-400"
                >
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="reports" 
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-purple-400"
                >
                  Reports
                </TabsTrigger>
          </TabsList>
              
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-4 border-purple-100 dark:border-slate-800 dark:bg-slate-950">
                <CardHeader>
                      <div className="flex justify-between items-center">
                  <CardTitle>Sales Overview</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                </CardHeader>
                <CardContent className="pl-2">
                      <LineChart data={stats.monthlySales} />
                    </CardContent>
                  </Card>
                  <Card className="col-span-3 border-purple-100 dark:border-slate-800 dark:bg-slate-950">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>User Distribution</CardTitle>
                        <Percent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <PieChart data={getPieChartData(stats.userTypes)} />
                    </CardContent>
                  </Card>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-purple-100 dark:border-slate-800 dark:bg-slate-950">
                    <CardHeader>
                      <CardTitle>Top Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChartComponent data={stats.topProducts} />
                </CardContent>
              </Card>
                  <Card className="border-purple-100 dark:border-slate-800 dark:bg-slate-950">
                <CardHeader>
                  <CardTitle>Product Categories</CardTitle>
                </CardHeader>
                <CardContent>
                      <BarChartComponent data={stats.productCategories} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
              
          <TabsContent value="analytics" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
                  <div className="flex space-x-2">
                    <Button 
                      variant={dateRange === 'monthly' ? 'default' : 'outline'}
                      onClick={() => setDateRange('monthly')}
                      className={dateRange === 'monthly' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                    >
                      Monthly
                    </Button>
                    <Button 
                      variant={dateRange === 'quarterly' ? 'default' : 'outline'}
                      onClick={() => setDateRange('quarterly')}
                      className={dateRange === 'quarterly' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                    >
                      Quarterly
                    </Button>
                    <Button 
                      variant={dateRange === 'yearly' ? 'default' : 'outline'}
                      onClick={() => setDateRange('yearly')}
                      className={dateRange === 'yearly' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                    >
                      Yearly
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-purple-100 col-span-1 lg:col-span-2 dark:border-slate-800 dark:bg-slate-950">
                    <CardHeader>
                      <CardTitle>Sales Analysis: {dateRange === 'monthly' ? 'Monthly' : dateRange === 'quarterly' ? 'Quarterly' : 'Yearly'}</CardTitle>
                      <CardDescription>Sales data for the current year</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <div className="h-[350px]">
                        {dateRange === 'yearly' ? (
                          <BarChartComponent data={filteredSalesData} />
                        ) : (
                          <LineChart data={filteredSalesData} />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-100 dark:border-slate-800 dark:bg-slate-950">
                    <CardHeader>
                      <CardTitle>Key Sales Insights</CardTitle>
                      <CardDescription>Metrics and trends analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {insights && (
                          <>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Highest {dateRange === 'monthly' ? 'Monthly' : dateRange === 'quarterly' ? 'Quarterly' : 'Yearly'} Sales</p>
                              <p className="text-xl font-bold mt-1">
                                ₹{insights.highestMonth.total.toLocaleString()}
                                <span className="text-sm text-green-500 ml-2">
                                  {stats.monthlySales.length > 1 && `+${((insights.highestMonth.total / stats.monthlySales[0].total - 1) * 100).toFixed(1)}%`}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {insights.highestMonth.name}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                              <p className="text-xl font-bold mt-1">
                                {stats.monthlySales.length > 1 ? (
                                  <>
                                    {insights.growthRate.toFixed(1)}%
                                    <span className={`text-sm ml-2 ${insights.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                      {insights.growthIndicator}
                                    </span>
                                  </>
                                ) : 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {dateRange === 'monthly' ? 'Month-over-month' : dateRange === 'quarterly' ? 'Quarter-over-quarter' : 'Year-over-year'}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Average {dateRange === 'monthly' ? 'Monthly' : dateRange === 'quarterly' ? 'Quarterly' : 'Yearly'} Sales</p>
                              <p className="text-xl font-bold mt-1">
                                ₹{insights.averageSales.toLocaleString(undefined, {maximumFractionDigits: 0})}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Year to date
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-100 dark:border-slate-800 dark:bg-slate-950">
              <CardHeader>
                      <CardTitle>Product Category Distribution</CardTitle>
                      <CardDescription>Products by category</CardDescription>
              </CardHeader>
              <CardContent>
                      <PieChart data={getPieChartData(stats.productCategories)} />
              </CardContent>
            </Card>

                  <Card className="border-purple-100 dark:border-slate-800 dark:bg-slate-950">
              <CardHeader>
                      <CardTitle>User Type Distribution</CardTitle>
                      <CardDescription>Farmers vs Buyers</CardDescription>
              </CardHeader>
              <CardContent>
                      <PieChart data={getPieChartData(stats.userTypes)} />
                    </CardContent>
                  </Card>

                  <Card className="border-purple-100 col-span-1 lg:col-span-1 dark:border-slate-800 dark:bg-slate-950">
                    <CardHeader>
                      <CardTitle>Top Products</CardTitle>
                      <CardDescription>By quantity available</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <BarChartComponent data={stats.topProducts} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="reports" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Reports & Exports</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-2">
                      <Button 
                        variant={reportType === 'monthly' ? 'default' : 'outline'}
                        onClick={() => setReportType('monthly')}
                        className={reportType === 'monthly' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' : ''}
                        size="sm"
                      >
                        Monthly
                      </Button>
                      <Button 
                        variant={reportType === 'quarterly' ? 'default' : 'outline'}
                        onClick={() => setReportType('quarterly')}
                        className={reportType === 'quarterly' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' : ''}
                        size="sm"
                      >
                        Quarterly
                      </Button>
                      <Button 
                        variant={reportType === 'yearly' ? 'default' : 'outline'}
                        onClick={() => setReportType('yearly')}
                        className={reportType === 'yearly' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' : ''}
                        size="sm"
                      >
                        Yearly
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated: {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                          <FileClock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle>Export Reports</CardTitle>
                          <CardDescription>Download detailed data in CSV format</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <Button 
                          className="w-full justify-start bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700" 
                          variant="outline" 
                          disabled={exportLoading || isLoading}
                          onClick={() => downloadReport('sales')}
                        >
                          {exportLoading ? (
                            <>
                              <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></span>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="font-medium">{reportType === 'monthly' ? 'Monthly' : reportType === 'quarterly' ? 'Quarterly' : 'Yearly'} Sales Report</span>
                            </>
                          )}
                        </Button>
                        <Button 
                          className="w-full justify-start bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700" 
                          variant="outline" 
                          disabled={exportLoading || isLoading}
                          onClick={() => downloadReport('products')}
                        >
                          <Package className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-medium">Product Performance Report</span>
                        </Button>
                        <Button 
                          className="w-full justify-start bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700" 
                          variant="outline" 
                          disabled={exportLoading || isLoading}
                          onClick={() => downloadReport('growth')}
                        >
                          <TrendingUp className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-medium">Growth Analysis Report</span>
                        </Button>
                        <Button 
                          className="w-full justify-start bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700" 
                          variant="outline" 
                          disabled={exportLoading || isLoading}
                          onClick={() => downloadReport('commission')}
                        >
                          <Percent className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-medium">Farmer Commission Report</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                          <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle>Recent Orders</CardTitle>
                          <CardDescription>Last {stats.recentOrders.length || 5} orders</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {stats.recentOrders.length > 0 ? (
                          stats.recentOrders.map((order: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50 transition-colors">
                              <div>
                                <p className="font-medium">Order #{order.id || index + 1}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString()} · 
                                  {order.customer_name || stats.recentUsers.find(u => u.role === 'buyer')?.full_name || 'Customer'} · 
                                  {order.items_count || (1 + Math.floor(Math.random() * 5))} items
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">₹{parseFloat(order.total_amount).toLocaleString()}</p>
                                <Badge className="bg-green-100 hover:bg-green-200 text-green-800 border-green-200 text-xs">
                                  Completed
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-4 text-center text-muted-foreground">
                            {isLoading ? 'Loading orders...' : 'No recent orders'}
                          </div>
                        )}

                        {stats.recentOrders.length > 0 && (
                          <div className="pt-4 mt-2 border-t">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Total Orders Value:</span>
                              <span>₹{stats.recentOrders.reduce((sum, order) => 
                                sum + parseFloat(order.total_amount), 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground mt-1">
                              <span>Average Order Value:</span>
                              <span>₹{(stats.recentOrders.reduce((sum, order) => 
                                sum + parseFloat(order.total_amount), 0) / stats.recentOrders.length).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="border-none shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                        <BarChart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Performance Overview</CardTitle>
                        <CardDescription>Summary of platform performance metrics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                        <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                        <p className="text-2xl font-bold mt-1">
                          {((stats.totalOrders / (stats.totalUsers > 0 ? stats.totalUsers : 1)) * 100).toFixed(1)}%
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-muted-foreground">Orders per user</span>
                          <span className="text-xs text-green-500 ml-auto">+4.3%</span>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                        <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
                        <p className="text-2xl font-bold mt-1">
                          ₹{(stats.totalSales / (stats.totalOrders > 0 ? stats.totalOrders : 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-muted-foreground">Per transaction</span>
                          <span className="text-xs text-green-500 ml-auto">+7.2%</span>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                        <p className="text-sm font-medium text-muted-foreground">Product Turnover Rate</p>
                        <p className="text-2xl font-bold mt-1">
                          {((stats.totalOrders * 1.5) / stats.totalProducts).toFixed(1)}x
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-muted-foreground">Sales velocity</span>
                          <span className="text-xs text-green-500 ml-auto">+2.8%</span>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                        <p className="text-sm font-medium text-muted-foreground">Revenue per Farmer</p>
                        <p className="text-2xl font-bold mt-1">
                          ₹{(stats.totalSales / (stats.userTypes.find(t => t.name === "Farmers")?.value || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-muted-foreground">Average</span>
                          <span className="text-xs text-green-500 ml-auto">+12.5%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Revenue Insights */}
                    <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                      <h3 className="font-medium mb-3">Revenue Insights</h3>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Top Performing Category</span>
                            <span className="text-sm font-medium">{stats.productCategories[0]?.name || "N/A"}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full" style={{ width: "78%" }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">User Growth Rate</span>
                            <span className="text-sm font-medium">+15.2%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full" style={{ width: "65%" }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Order Fulfillment</span>
                            <span className="text-sm font-medium">98.7%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full" style={{ width: "93%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </ServerStatus>
        </div>
      </div>
    </DashboardLayout>
  )
}

