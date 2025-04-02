"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { fetchApi } from "@/lib/api"
import { useEffect, useState } from "react"
import { Eye, MoreHorizontal } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

type OrderItem = {
  id: number
  product_id: number
  product_name: string
  image_url: string
  quantity: number
  price_per_unit: string
  total_price: string
  status: string
  created_at: string
  farmer_name: string
}

type Order = {
  id: number
  order_number: string
  total_amount: string
  status: string
  delivery_address: string
  contact_number: string
  created_at: string
  updated_at: string
  buyer_name: string
  items: OrderItem[]
  calculatedStatus?: string
}

// Helper function to determine the overall order status based on item statuses
function calculateOrderStatus(items: OrderItem[]): string {
  if (!items || items.length === 0) return "pending";
  
  const statusCounts = {
    pending: 0,
    accepted: 0,
    completed: 0,
    rejected: 0
  };
  
  // Count each status
  items.forEach(item => {
    if (statusCounts.hasOwnProperty(item.status)) {
      statusCounts[item.status as keyof typeof statusCounts]++;
    }
  });
  
  // If all items have the same status, return that status
  if (statusCounts.pending === items.length) return "pending";
  if (statusCounts.accepted === items.length) return "accepted";
  if (statusCounts.completed === items.length) return "completed";
  if (statusCounts.rejected === items.length) return "rejected";
  
  // Priority rules:
  // 1. If any item is pending, overall status is "pending"
  if (statusCounts.pending > 0) return "mixed-pending";
  
  // 2. If any item is accepted (and none are pending), overall status is "mixed-accepted"
  if (statusCounts.accepted > 0) return "mixed-accepted";
  
  // 3. If items are a mix of completed and rejected, status is "mixed"
  return "mixed";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const data = await fetchApi("/api/orders")
      
      // Update status of each order based on its item statuses
      const updatedOrders = data.orders.map((order: Order) => {
        const calculatedStatus = calculateOrderStatus(order.items);
        return {
          ...order,
          calculatedStatus
        };
      });
      
      setOrders(updatedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    setIsActionLoading(true)
    
    try {
      // Update all order items to the new status
      const order = orders.find(o => o.id === orderId)
      if (!order) {
        throw new Error("Order not found")
      }
      
      // Update each order item status
      const updatePromises = order.items.map(item => 
        fetchApi(`/api/orders/item/${item.id}/status`, {
          method: "PUT",
          body: { status },
        })
      )
      
      await Promise.all(updatePromises)
      
      // Refresh orders from the server to ensure we have the latest data
      await fetchOrders()
      
      toast({
        title: "Success",
        description: `Order status updated to ${status} successfully`
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }
  
  const handleUpdateOrderItemStatus = async (itemId: number, status: string) => {
    setIsActionLoading(true)
    try {
      await fetchApi(`/api/orders/item/${itemId}/status`, {
        method: "PUT",
        body: { status },
      })

      // Refresh orders from the server to ensure we have the latest data
      await fetchOrders()
      
      // If the dialog is open, we need to update the selected order
      if (selectedOrder) {
        const updatedOrder = orders.find(order => order.id === selectedOrder.id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }

      toast({
        title: "Success",
        description: "Order item status updated successfully",
      })
    } catch (error) {
      console.error("Error updating order item status:", error)
      toast({
        title: "Error",
        description: "Failed to update order item status",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleViewOrder = (order: Order) => {
    // Find the latest version of this order in case it's been updated
    const latestOrder = orders.find(o => o.id === order.id) || order;
    setSelectedOrder(latestOrder)
    setIsDialogOpen(true)
  }

  let filteredOrders = orders

  if (activeTab === "pending") {
    filteredOrders = orders.filter((order) => 
      order.calculatedStatus === "pending" || order.calculatedStatus === "mixed-pending"
    );
  } else if (activeTab === "accepted") {
    filteredOrders = orders.filter((order) => 
      order.calculatedStatus === "accepted" || order.calculatedStatus === "mixed-accepted"
    );
  } else if (activeTab === "completed") {
    filteredOrders = orders.filter((order) => order.calculatedStatus === "completed");
  } else if (activeTab === "rejected") {
    filteredOrders = orders.filter((order) => order.calculatedStatus === "rejected");
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold">Order Management</h1>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Manage orders placed on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="accepted">Accepted</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="w-full">
                {renderOrdersTable(filteredOrders, isLoading, handleViewOrder, handleUpdateOrderStatus)}
              </TabsContent>
              <TabsContent value="pending" className="w-full">
                {renderOrdersTable(filteredOrders, isLoading, handleViewOrder, handleUpdateOrderStatus)}
              </TabsContent>
              <TabsContent value="accepted" className="w-full">
                {renderOrdersTable(filteredOrders, isLoading, handleViewOrder, handleUpdateOrderStatus)}
              </TabsContent>
              <TabsContent value="completed" className="w-full">
                {renderOrdersTable(filteredOrders, isLoading, handleViewOrder, handleUpdateOrderStatus)}
              </TabsContent>
              <TabsContent value="rejected" className="w-full">
                {renderOrdersTable(filteredOrders, isLoading, handleViewOrder, handleUpdateOrderStatus)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>View detailed information about this order</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Order Number:</span>
                    <span>{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Date:</span>
                    <span>{format(new Date(selectedOrder.created_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={getOrderStatusVariant(selectedOrder.calculatedStatus || selectedOrder.status)}>
                      {getOrderStatusLabel(selectedOrder.calculatedStatus || selectedOrder.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span>₹{Number.parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Buyer:</span>
                    <span>{selectedOrder.buyer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Contact:</span>
                    <span>{selectedOrder.contact_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Delivery Address:</span>
                    <span className="text-right">{selectedOrder.delivery_address}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Order Items</h3>
                <Accordion type="single" collapsible className="w-full">
                  {selectedOrder.items.map((item, index) => (
                    <AccordionItem key={item.id} value={`item-${item.id}`}>
                      <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4">
                          <span>{item.product_name}</span>
                          <Badge variant={getOrderStatusVariant(item.status)}>{getOrderStatusLabel(item.status)}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Quantity:</span>
                                <span>{item.quantity}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Price Per Unit:</span>
                                <span>₹{Number.parseFloat(item.price_per_unit).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Total Price:</span>
                                <span>₹{Number.parseFloat(item.total_price).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Farmer:</span>
                                <span>{item.farmer_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Status:</span>
                                <Select
                                  value={item.status}
                                  onValueChange={(value) => handleUpdateOrderItemStatus(item.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isActionLoading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function getOrderStatusVariant(status: string) {
  switch (status) {
    case "pending":
      return "outline"
    case "accepted":
      return "secondary"
    case "completed":
      return "default"
    case "rejected":
      return "destructive"
    case "mixed-pending":
      return "outline"
    case "mixed-accepted":
      return "secondary"
    case "mixed":
      return "outline"
    default:
      return "outline"
  }
}

function getOrderStatusLabel(status: string) {
  switch (status) {
    case "mixed-pending":
      return "Mixed (Pending)"
    case "mixed-accepted":
      return "Mixed (In Progress)"
    case "mixed":
      return "Mixed"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

function renderOrdersTable(
  orders: Order[], 
  isLoading: boolean, 
  handleViewOrder: (order: Order) => void,
  handleUpdateOrderStatus?: (orderId: number, status: string) => Promise<void>
) {
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (orders.length === 0) {
    return <p className="text-center py-4">No orders found.</p>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Buyer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>{order.buyer_name}</TableCell>
              <TableCell>{format(new Date(order.created_at), "MMM d, yyyy")}</TableCell>
              <TableCell>
                <Badge variant={getOrderStatusVariant(order.calculatedStatus || order.status)}>
                  {getOrderStatusLabel(order.calculatedStatus || order.status)}
                </Badge>
              </TableCell>
              <TableCell>{order.items.length}</TableCell>
              <TableCell>₹{Number.parseFloat(order.total_amount).toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    
                    {(order.calculatedStatus !== "pending" && order.calculatedStatus !== "mixed-pending") && (
                      <DropdownMenuItem 
                        onClick={() => handleUpdateOrderStatus && handleUpdateOrderStatus(order.id, "pending")}
                      >
                        Mark as Pending
                      </DropdownMenuItem>
                    )}
                    
                    {(order.calculatedStatus !== "accepted" && order.calculatedStatus !== "mixed-accepted") && (
                      <DropdownMenuItem 
                        onClick={() => handleUpdateOrderStatus && handleUpdateOrderStatus(order.id, "accepted")}
                      >
                        Mark as Accepted
                      </DropdownMenuItem>
                    )}
                    
                    {order.calculatedStatus !== "completed" && (
                      <DropdownMenuItem 
                        onClick={() => handleUpdateOrderStatus && handleUpdateOrderStatus(order.id, "completed")}
                      >
                        Mark as Completed
                      </DropdownMenuItem>
                    )}
                    
                    {order.calculatedStatus !== "rejected" && (
                      <DropdownMenuItem 
                        onClick={() => handleUpdateOrderStatus && handleUpdateOrderStatus(order.id, "rejected")}
                        className="text-red-600"
                      >
                        Mark as Rejected
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

