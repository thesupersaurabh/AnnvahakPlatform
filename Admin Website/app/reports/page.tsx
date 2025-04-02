"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Download, 
  BarChart2, 
  PieChart, 
  Calendar, 
  TrendingUp, 
  RefreshCcw,
  AlertTriangle
} from "lucide-react"
import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchApi } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales")
  const [timeRange, setTimeRange] = useState("week")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for various report data
  const [salesData, setSalesData] = useState<any>({
    total: 0,
    avgOrderValue: 0,
    orderCount: 0,
    conversionRate: 0,
    percentChanges: {
      total: 0,
      avgOrderValue: 0,
      orderCount: 0,
      conversionRate: 0
    },
    trend: []
  })
  
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [productData, setProductData] = useState<any>({
    topProducts: [],
    categories: []
  })
  
  const [userData, setUserData] = useState<any>({
    total: 0,
    farmers: 0,
    buyers: 0,
    growth: []
  })

  // Check if error is a network error
  const isNetworkError = (err: any) => {
    return (
      (err && (err.isNetworkError || 
      (typeof err.message === 'string' && 
       (err.message.toLowerCase().includes('network') || 
        err.message.toLowerCase().includes('internet') ||
        err.message.toLowerCase().includes('connect') ||
        err.message.toLowerCase().includes('fetch'))))
      )
    );
  };
  
  // Function to load data based on the active tab and time range
  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Load data based on active tab
      if (activeTab === "sales" || activeTab === "transactions") {
        try {
          // Fetch sales overview data
          const salesOverview = await fetchApi(`/api/admin/reports/sales?timeRange=${timeRange}`);
          
          // Transform API data for the charts
          const trendData = salesOverview.salesByDate?.map((item: any) => ({
            name: format(new Date(item.date), 'MMM dd'),
            total: item.sales
          })) || [];
          
          setSalesData({
            total: salesOverview.totalSales || 0,
            avgOrderValue: salesOverview.avgOrderValue || 0,
            orderCount: salesOverview.orderCount || 0,
            conversionRate: salesOverview.conversionRate || 0,
            percentChanges: salesOverview.percentChanges || {
              total: 0,
              avgOrderValue: 0,
              orderCount: 0,
              conversionRate: 0
            },
            trend: trendData
          });
        } catch (err) {
          console.error('Error fetching sales data:', err);
          if (isNetworkError(err)) {
            throw err; // Rethrow network errors to be caught by the main try/catch
          }
          setSalesData({
            total: 0,
            avgOrderValue: 0,
            orderCount: 0,
            conversionRate: 0,
            percentChanges: {
              total: 0,
              avgOrderValue: 0,
              orderCount: 0,
              conversionRate: 0
            },
            trend: []
          });
        }
        
        try {
          // Fetch recent orders
          const orders = await fetchApi('/api/orders');
          setRecentOrders((orders?.orders || []).slice(0, 5));
        } catch (err) {
          console.error('Error fetching orders:', err);
          if (isNetworkError(err)) {
            throw err; // Rethrow network errors to be caught by the main try/catch
          }
          setRecentOrders([]);
        }
      }
      
      if (activeTab === "products") {
        try {
          // Fetch product data
          const productStats = await fetchApi(`/api/admin/reports/products?timeRange=${timeRange}`);
          
          // Transform for charts
          const topProductsData = productStats.topProducts?.map((product: any) => ({
            name: product.name,
            total: product.sales
          })) || [];
          
          const categoriesData = productStats.categories?.map((category: any) => ({
            name: category.name,
            total: category.count
          })) || [];
          
          setProductData({
            topProducts: topProductsData,
            categories: categoriesData
          });
        } catch (err) {
          console.error('Error fetching product data:', err);
          if (isNetworkError(err)) {
            throw err; // Rethrow network errors to be caught by the main try/catch
          }
          setProductData({
            topProducts: [],
            categories: []
          });
        }
      }
      
      if (activeTab === "users") {
        try {
          // Fetch user stats
          const userStats = await fetchApi(`/api/admin/reports/users?timeRange=${timeRange}`);
          
          // Transform for charts
          const userGrowthData = userStats.growth?.map((item: any) => ({
            name: item.month,
            total: item.count
          })) || [];
          
          setUserData({
            total: userStats.totalUsers || 0,
            farmers: userStats.farmers || 0,
            buyers: userStats.buyers || 0,
            growth: userGrowthData
          });
        } catch (err) {
          console.error('Error fetching user data:', err);
          if (isNetworkError(err)) {
            throw err; // Rethrow network errors to be caught by the main try/catch
          }
          setUserData({
            total: 0,
            farmers: 0,
            buyers: 0,
            growth: []
          });
        }
      }
    } catch (err: any) {
      console.error('Error loading report data:', err);
      setError(err.message || 'Failed to load report data. The API might be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load and when tab or time range changes
  useEffect(() => {
    loadData();
  }, [activeTab, timeRange]);

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Error display component
  const ErrorDisplay = () => (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error || "There was a problem connecting to the server. Please try again."}
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1">
            <RefreshCcw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );

  // Loading state component
  const LoadingState = () => (
    <div className="flex justify-center items-center py-8">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
        <p className="mt-4 text-sm text-gray-500">Loading report data...</p>
      </div>
    </div>
  );

  // Empty state component for when no data is available
  const EmptyState = ({ message = "No data available" }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium">{message}</h3>
      <p className="text-sm text-gray-500 mt-2">
        Try changing the time range or check back later.
      </p>
      <Button variant="outline" size="sm" onClick={loadData} className="mt-4 gap-1">
        <RefreshCcw className="h-4 w-4" /> Refresh
      </Button>
    </div>
  );
  
  // Network error component with custom emoji
  const NetworkErrorState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-6">😢</div>
      <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        We couldn't connect to the server. Please check your internet connection or try again later.
      </p>
      <Button onClick={loadData} className="bg-purple-600 hover:bg-purple-700 gap-2">
        <RefreshCcw className="h-4 w-4" /> Try Again
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={loadData} title="Refresh data">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && isNetworkError(error) ? <NetworkErrorState /> : (
          <>
            {error && <ErrorDisplay />}

        <Tabs defaultValue="sales" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="sales">
              <TrendingUp className="mr-2 h-4 w-4" /> Sales Reports
            </TabsTrigger>
            <TabsTrigger value="products">
              <BarChart2 className="mr-2 h-4 w-4" /> Product Reports
            </TabsTrigger>
            <TabsTrigger value="users">
              <PieChart className="mr-2 h-4 w-4" /> User Reports
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <FileText className="mr-2 h-4 w-4" /> Transaction Reports
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales" className="space-y-4">
                {loading ? (
                  <LoadingState />
                ) : (
                  <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                </CardHeader>
                <CardContent>
                          <div className="text-2xl font-bold">{formatCurrency(salesData.total)}</div>
                          <p className={`text-xs ${salesData.percentChanges.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {salesData.percentChanges.total >= 0 ? '+' : ''}{salesData.percentChanges.total}% from last {timeRange}
                          </p>
                </CardContent>
              </Card>
                      
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                          <div className="text-2xl font-bold">{formatCurrency(salesData.avgOrderValue)}</div>
                          <p className={`text-xs ${salesData.percentChanges.avgOrderValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {salesData.percentChanges.avgOrderValue >= 0 ? '+' : ''}{salesData.percentChanges.avgOrderValue}% from last {timeRange}
                          </p>
                </CardContent>
              </Card>
                      
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                </CardHeader>
                <CardContent>
                          <div className="text-2xl font-bold">{salesData.orderCount}</div>
                          <p className={`text-xs ${salesData.percentChanges.orderCount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {salesData.percentChanges.orderCount >= 0 ? '+' : ''}{salesData.percentChanges.orderCount}% from last {timeRange}
                          </p>
                </CardContent>
              </Card>
                      
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                          <div className="text-2xl font-bold">{salesData.conversionRate}%</div>
                          <p className={`text-xs ${salesData.percentChanges.conversionRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {salesData.percentChanges.conversionRate >= 0 ? '+' : ''}{salesData.percentChanges.conversionRate}% from last {timeRange}
                          </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Sales performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                        {salesData.trend.length > 0 ? (
                          <LineChart data={salesData.trend} />
                        ) : (
                          <EmptyState message="No sales data available for this time range" />
                        )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                        {recentOrders.length === 0 ? (
                          <EmptyState message="No recent orders found" />
                        ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                              {recentOrders.map((order) => (
                                <TableRow key={order.id}>
                                  <TableCell className="font-medium">{order.order_number}</TableCell>
                                  <TableCell>{format(new Date(order.created_at), "MMM dd, yyyy")}</TableCell>
                                  <TableCell>{order.buyer_name}</TableCell>
                                  <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                  </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                        )}
              </CardContent>
            </Card>
                  </>
                )}
          </TabsContent>
          
          <TabsContent value="products" className="space-y-4">
                {loading ? (
                  <LoadingState />
                ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                  <CardDescription>Best selling products</CardDescription>
                </CardHeader>
                <CardContent>
                        {productData.topProducts.length > 0 ? (
                          <BarChart data={productData.topProducts} />
                        ) : (
                          <EmptyState message="No product sales data available" />
                        )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                        <CardDescription>Products by category</CardDescription>
                </CardHeader>
                <CardContent>
                        {productData.categories.length > 0 ? (
                          <BarChart data={productData.categories} />
                        ) : (
                          <EmptyState message="No category data available" />
                        )}
                </CardContent>
              </Card>
            </div>
                )}
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
                {loading ? (
                  <LoadingState />
                ) : (
                  <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                          <div className="text-2xl font-bold">{userData.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Farmers</CardTitle>
                </CardHeader>
                <CardContent>
                          <div className="text-2xl font-bold">{userData.farmers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Buyers</CardTitle>
                </CardHeader>
                <CardContent>
                          <div className="text-2xl font-bold">{userData.buyers}</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                        {userData.growth.length > 0 ? (
                          <LineChart data={userData.growth} />
                        ) : (
                          <EmptyState message="No user growth data available for this time range" />
                        )}
              </CardContent>
            </Card>
                  </>
                )}
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-4">
                {loading ? (
                  <LoadingState />
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{recentOrders.filter(order => order.status === 'pending').length}</div>
                          <p className="text-xs text-yellow-500">Requires attention</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Completed Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{recentOrders.filter(order => order.status === 'completed').length}</div>
                          <p className="text-xs text-green-500">Successfully processed</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Rejected Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{recentOrders.filter(order => order.status === 'rejected').length}</div>
                          <p className="text-xs text-red-500">Failed or cancelled</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">24h</div>
                          <p className="text-xs text-gray-500">From order to delivery</p>
                        </CardContent>
                      </Card>
                    </div>
                    
            <Card>
              <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>Recent order transactions</CardDescription>
              </CardHeader>
              <CardContent>
                        {recentOrders.length === 0 ? (
                          <EmptyState message="No transaction data available" />
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Buyer</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {recentOrders.map((order) => (
                                <TableRow key={order.id}>
                                  <TableCell className="font-medium">{order.order_number}</TableCell>
                                  <TableCell>{format(new Date(order.created_at), "MMM dd, yyyy")}</TableCell>
                                  <TableCell>{order.buyer_name}</TableCell>
                                  <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
              </CardContent>
            </Card>
                  </>
                )}
          </TabsContent>
        </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  )
} 