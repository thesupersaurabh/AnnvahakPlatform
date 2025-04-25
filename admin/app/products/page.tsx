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
import { API_URL } from "@/lib/env"
import { useEffect, useState } from "react"
import { Check, Eye, MoreHorizontal, Plus, X, PencilIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

type Product = {
  id: number
  name: string
  description: string
  category: string
  price: string
  quantity: number
  unit: string
  image_url: string
  is_approved: boolean
  is_available: boolean
  farmer_id: number
  farmer_name: string
  created_at: string
  updated_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [farmers, setFarmers] = useState<{id: number, full_name: string}[]>([])
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "vegetables",
    customCategory: "",
    price: "",
    quantity: "" as string | number,
    unit: "kg",
    image_url: "",
    farmer_id: ""
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [userRole, setUserRole] = useState("admin")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await fetchApi("/api/products/all")
        setProducts(data.products)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchFarmers = async () => {
      try {
        const data = await fetchApi("/api/admin/users")
        // Filter only farmers from users
        const farmersList = data.users
          .filter((user: any) => user.role === "farmer")
          .map((farmer: any) => ({
            id: farmer.id,
            full_name: farmer.full_name || farmer.username
          }));
        setFarmers(farmersList)
      } catch (error) {
        console.error("Error fetching farmers:", error)
      }
    }

    // Check user role from localStorage
    try {
      const userInfo = localStorage.getItem("user")
      if (userInfo) {
        const parsedUser = JSON.parse(userInfo)
        setUserRole(parsedUser.role || "")
      }
    } catch (error) {
      console.error("Error getting user role:", error)
    }

    fetchProducts()
    fetchFarmers()
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Admin can always add products
  const canAddProducts = true

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsActionLoading(true)
    
    try {
      // Get auth token
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add products.",
          variant: "destructive"
        })
        setIsActionLoading(false)
        return
      }
      
      // Determine category - use custom if provided
      const category = newProduct.customCategory.trim() 
        ? newProduct.customCategory.toLowerCase() 
        : newProduct.category.toLowerCase()
      
      // Format product data according to API requirements
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        category,
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity.toString()),
        unit: newProduct.unit,
        farmer_id: newProduct.farmer_id ? parseInt(newProduct.farmer_id) : undefined,
        image_url: newProduct.image_url && newProduct.image_url.trim() ? newProduct.image_url.trim() : undefined,
        is_available: true
      }
      
      // Use admin-specific endpoint for product creation when farmer is selected
      const endpoint = newProduct.farmer_id 
        ? "/api/admin/products" 
        : "/api/products"
      
      await fetchApi(endpoint, {
        method: "POST",
        body: productData
      })
      
      toast({
        title: "Success",
        description: "Product created successfully!"
      })
      
      // Refresh products list
      const productsData = await fetchApi("/api/products/all")
      setProducts(productsData.products)
      
      // Reset form and close dialog
      setNewProduct({
        name: "",
        description: "",
        category: "vegetables",
        customCategory: "",
        price: "",
        quantity: "",
        unit: "kg",
        image_url: "",
        farmer_id: ""
      })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUpdateProductStatus = async (
    productId: number,
    updates: { is_approved?: boolean; is_available?: boolean },
  ) => {
    setIsActionLoading(true)
    
    try {
      // Simple product update since we're already admin
      await fetchApi(`/api/products/${productId}`, {
        method: "PUT",
        body: updates,
      })

      // Update local state
      setProducts((prevProducts) =>
        prevProducts.map((product) => (product.id === productId ? { ...product, ...updates } : product)),
      )

      toast({
        title: "Success",
        description: "Product status updated successfully",
      })
    } catch (error) {
      console.error("Error updating product status:", error)
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    setIsActionLoading(true)
    
    try {
      // Simple product deletion since we're already admin
      await fetchApi(`/api/products/${productId}`, {
        method: "DELETE",
      })

      // Update local state
      setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId))

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleViewProduct = (product: Product) => {
    setIsActionLoading(true)
    setTimeout(() => {
      setSelectedProduct(product)
      setIsDialogOpen(true)
      setIsActionLoading(false)
    }, 500);
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingProduct || !editingProduct.id) return
    
    setIsActionLoading(true)
    
    try {
      // For editing, use the category directly as it could already be a custom category
      await fetchApi(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        body: {
          name: editingProduct.name,
          description: editingProduct.description,
          category: editingProduct.category.toLowerCase(),
          price: editingProduct.price,
          quantity: editingProduct.quantity,
          unit: editingProduct.unit,
          image_url: editingProduct.image_url,
          is_available: editingProduct.is_available
        }
      })
      
      toast({
        title: "Success",
        description: "Product updated successfully"
      })
      
      // Refresh products
      const data = await fetchApi("/api/products/all")
      setProducts(data.products)
      
      // Close dialog
      setIsEditDialogOpen(false)
      setEditingProduct(null)
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const openEditDialog = (product: Product) => {
    setIsActionLoading(true)
    setTimeout(() => {
      setEditingProduct(product)
      setIsEditDialogOpen(true)
      setIsActionLoading(false)
    }, 500);
  }

  let filteredProducts = products

  // First filter by search query if present
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredProducts = filteredProducts.filter(
      (product) => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) || 
        product.category.toLowerCase().includes(query) ||
        product.farmer_name.toLowerCase().includes(query)
    )
  }

  // Then apply tab filters
  if (activeTab === "pending") {
    filteredProducts = filteredProducts.filter((product) => !product.is_approved)
  } else if (activeTab === "approved") {
    filteredProducts = filteredProducts.filter((product) => product.is_approved)
  } else if (activeTab === "available") {
    filteredProducts = filteredProducts.filter((product) => product.is_available)
  } else if (activeTab === "unavailable") {
    filteredProducts = filteredProducts.filter((product) => !product.is_available)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Product Management</h1>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={(e) => {
                  if (!canAddProducts) {
                    e.preventDefault()
                    toast({
                      title: "Permission Error",
                      description: "Only farmers and administrators can add products.",
                      variant: "destructive"
                    })
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product listing. {userRole === "admin" ? "Select a farmer to assign this product to them." : "Products require admin approval before being visible to customers."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProduct}>
                <div className="grid gap-4 py-4">
                  {userRole === "admin" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="farmer" className="text-right font-medium">
                        Farmer
                      </Label>
                      <Select
                        value={newProduct.farmer_id}
                        onValueChange={(value) => setNewProduct({ ...newProduct, farmer_id: value })}
                        required
                      >
                        <SelectTrigger id="farmer" className="col-span-3">
                          <SelectValue placeholder="Select a farmer" />
                        </SelectTrigger>
                        <SelectContent>
                          {farmers.length > 0 ? (
                            farmers.map((farmer) => (
                              <SelectItem key={farmer.id} value={farmer.id.toString()}>
                                {farmer.full_name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No farmers available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) => {
                        setNewProduct({ 
                          ...newProduct, 
                          category: value,
                          // Clear custom category if a predefined one is selected
                          customCategory: value === "custom" ? newProduct.customCategory : ""
                        })
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetables">Vegetables</SelectItem>
                        <SelectItem value="fruits">Fruits</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="grains">Grains</SelectItem>
                        <SelectItem value="custom">Custom Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newProduct.category === "custom" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="customCategory" className="text-right">
                        Custom Category
                      </Label>
                      <Input
                        id="customCategory"
                        value={newProduct.customCategory}
                        onChange={(e) => setNewProduct({ ...newProduct, customCategory: e.target.value })}
                        placeholder="Enter custom category"
                        className="col-span-3"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Price
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="unit" className="text-right">
                      Unit
                    </Label>
                    <Select
                      value={newProduct.unit}
                      onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="g">Gram (g)</SelectItem>
                        <SelectItem value="dozen">Dozen</SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="liter">Liter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {userRole !== "admin" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="farmer" className="text-right">
                        Farmer
                      </Label>
                      <Select
                        value={newProduct.farmer_id}
                        onValueChange={(value) => setNewProduct({ ...newProduct, farmer_id: value })}
                      >
                        <SelectTrigger id="farmer" className="col-span-3">
                          <SelectValue placeholder="Select farmer" />
                        </SelectTrigger>
                        <SelectContent>
                          {farmers.length > 0 ? (
                            farmers.map((farmer) => (
                              <SelectItem key={farmer.id} value={farmer.id.toString()}>
                                {farmer.full_name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No farmers available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image_url" className="text-right">
                      Image URL
                    </Label>
                    <Input
                      id="image_url"
                      value={newProduct.image_url}
                      onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                      className="col-span-3"
                      placeholder="https://example.com/image.jpg (optional)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isActionLoading}>
                    {isActionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Product"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage products listed on the platform</CardDescription>
            <div className="mt-4">
              <div className="relative">
                <Input
                  placeholder="Search products by name, category, or farmer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Products</TabsTrigger>
                <TabsTrigger value="pending">Pending Approval</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="unavailable">Unavailable</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="w-full">
                {renderProductsTable(
                  filteredProducts,
                  isLoading,
                  handleUpdateProductStatus,
                  handleDeleteProduct,
                  handleViewProduct,
                  openEditDialog,
                  isActionLoading
                )}
              </TabsContent>
              <TabsContent value="pending" className="w-full">
                {renderProductsTable(
                  filteredProducts,
                  isLoading,
                  handleUpdateProductStatus,
                  handleDeleteProduct,
                  handleViewProduct,
                  openEditDialog,
                  isActionLoading
                )}
              </TabsContent>
              <TabsContent value="approved" className="w-full">
                {renderProductsTable(
                  filteredProducts,
                  isLoading,
                  handleUpdateProductStatus,
                  handleDeleteProduct,
                  handleViewProduct,
                  openEditDialog,
                  isActionLoading
                )}
              </TabsContent>
              <TabsContent value="available" className="w-full">
                {renderProductsTable(
                  filteredProducts,
                  isLoading,
                  handleUpdateProductStatus,
                  handleDeleteProduct,
                  handleViewProduct,
                  openEditDialog,
                  isActionLoading
                )}
              </TabsContent>
              <TabsContent value="unavailable" className="w-full">
                {renderProductsTable(
                  filteredProducts,
                  isLoading,
                  handleUpdateProductStatus,
                  handleDeleteProduct,
                  handleViewProduct,
                  openEditDialog,
                  isActionLoading
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>View detailed information about this product</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative h-64 rounded-md overflow-hidden">
                {selectedProduct.image_url ? (
                  <Image
                    src={selectedProduct.image_url || "/placeholder.svg"}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">No Image</div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.category}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Price:</span>
                    <span>
                      ₹{Number.parseFloat(selectedProduct.price).toFixed(2)} / {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Quantity:</span>
                    <span>
                      {selectedProduct.quantity} {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Farmer:</span>
                    <span>{selectedProduct.farmer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <div className="space-x-2">
                      <Badge variant={selectedProduct.is_approved ? "default" : "destructive"}>
                        {selectedProduct.is_approved ? "Approved" : "Pending"}
                      </Badge>
                      <Badge variant={selectedProduct.is_available ? "default" : "destructive"}>
                        {selectedProduct.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Description:</h4>
                  <p className="text-sm">{selectedProduct.description}</p>
                </div>
                <div className="flex justify-end space-x-2">
                  {!selectedProduct.is_approved && (
                    <Button
                      size="sm"
                      onClick={() => {
                        handleUpdateProductStatus(selectedProduct.id, { is_approved: true })
                        setSelectedProduct({ ...selectedProduct, is_approved: true })
                      }}
                    >
                      Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleUpdateProductStatus(selectedProduct.id, { is_available: !selectedProduct.is_available })
                      setSelectedProduct({ ...selectedProduct, is_available: !selectedProduct.is_available })
                    }}
                  >
                    {selectedProduct.is_available ? "Mark Unavailable" : "Mark Available"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Make changes to the product information here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProduct}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editingProduct?.name || ""}
                  onChange={(e) => setEditingProduct(editingProduct ? {...editingProduct, name: e.target.value} : null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct?.description || ""}
                  onChange={(e) => setEditingProduct(editingProduct ? {...editingProduct, description: e.target.value} : null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Category
                </Label>
                <Select
                  value={editingProduct?.category || ""}
                  onValueChange={(value) => setEditingProduct(editingProduct ? {...editingProduct, category: value} : null)}
                >
                  <SelectTrigger id="edit-category" className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="grains">Grains</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  Price (₹)
                </Label>
                <Input
                  id="edit-price"
                  value={editingProduct?.price || ""}
                  onChange={(e) => setEditingProduct(editingProduct ? {...editingProduct, price: e.target.value} : null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-unit" className="text-right">
                  Unit
                </Label>
                <Select
                  value={editingProduct?.unit || ""}
                  onValueChange={(value) => setEditingProduct(editingProduct ? {...editingProduct, unit: value} : null)}
                >
                  <SelectTrigger id="edit-unit" className="col-span-3">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="l">Liter (l)</SelectItem>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-image_url" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="edit-image_url"
                  value={editingProduct?.image_url || ""}
                  onChange={(e) => setEditingProduct(editingProduct ? {...editingProduct, image_url: e.target.value} : null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-availability" className="text-right">
                  Availability
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Checkbox 
                    id="edit-availability" 
                    checked={editingProduct?.is_available || false}
                    onCheckedChange={(checked) => 
                      setEditingProduct(editingProduct ? 
                        {...editingProduct, is_available: checked === true} : null)
                    }
                  />
                  <label
                    htmlFor="edit-availability"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Available for purchase
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isActionLoading}>
                {isActionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

function renderProductsTable(
  products: Product[],
  isLoading: boolean,
  handleUpdateProductStatus: (
    productId: number,
    updates: { is_approved?: boolean; is_available?: boolean },
  ) => Promise<void>,
  handleDeleteProduct: (productId: number) => Promise<void>,
  handleViewProduct: (product: Product) => void,
  openEditDialog: (product: Product) => void,
  isActionLoading: boolean
) {
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  if (products.length === 0) {
    return <p className="text-center py-4">No products found.</p>
  }

  return (
    <div className="rounded-md border relative">
      {isActionLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 rounded-md">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-md shadow flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin text-purple-600" />
            <span className="text-sm">Processing...</span>
          </div>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Farmer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.id}</TableCell>
              <TableCell>
                <div className="relative h-10 w-10 overflow-hidden rounded-md">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-200" />
                  )}
                </div>
              </TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>₹{Number.parseFloat(product.price).toFixed(2)}</TableCell>
              <TableCell>
                {product.quantity} {product.unit}
              </TableCell>
              <TableCell>{product.farmer_name}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge className={product.is_approved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {product.is_approved ? "Approved" : "Pending"}
                  </Badge>
                  <Badge className={product.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {product.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </TableCell>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(product)}>
                      <PencilIcon className="mr-2 h-4 w-4" /> Edit Product
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={() => handleUpdateProductStatus(product.id, { is_approved: !product.is_approved })}
                    >
                      {product.is_approved ? (
                        <>
                          <X className="mr-2 h-4 w-4" /> Reject
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Approve
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={() => handleUpdateProductStatus(product.id, { is_available: !product.is_available })}
                    >
                      {product.is_available ? (
                        <>
                          <X className="mr-2 h-4 w-4" /> Mark Unavailable
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Mark Available
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProduct(product.id)}>
                      <X className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
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

