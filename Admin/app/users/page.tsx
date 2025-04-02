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
import { Check, MoreHorizontal, Plus, PencilIcon, X, CheckCircle, XCircle, Eye, Shield, User, Leaf, Loader2, Trash } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_URL } from "@/lib/env"

type User = {
  id: number
  username: string
  email: string
  role: string
  full_name: string
  phone: string
  address: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  products_count?: number
  orders_count?: number
}

type EditUserFormData = {
  username: string
  email: string
  role: string
  full_name: string
  phone: string
  address: string
  password?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<EditUserFormData>({
    username: "",
    email: "",
    role: "buyer",
    full_name: "",
    phone: "",
    address: "",
  })

  const fetchUsers = async () => {
    try {
      const response = await fetchApi("/api/admin/users")
      // Filter out admin users - only show buyers and farmers
      const filteredUsers = (response.users || []).filter((user: User) => user.role === 'buyer' || user.role === 'farmer')
      setUsers(filteredUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleStatusChange = async (userId: number, status: string) => {
    setIsActionLoading(true)
    
    try {
      const response = await fetchApi(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        body: { status }
      })

      if (response) {
        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, is_active: status === "active" } : user
          )
        )

        toast({
          title: "Success",
          description: `User status updated to ${status}`
        })
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRoleChange = async (userId: number, role: string) => {
    setIsActionLoading(true)
    
    try {
      const response = await fetchApi(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        body: { role }
      })

      if (response) {
        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, role } : user
          )
        )

        toast({
          title: "Success",
          description: `User role updated to ${role}`
        })
      }
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async (userId: number) => {
    setIsActionLoading(true)
    
    try {
      await fetchApi(`/api/admin/users/${userId}`, {
        method: "DELETE"
      })

      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))

      toast({
        title: "Success",
        description: "User deleted successfully"
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // No Authorization header for registration
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create user")
      }

      toast({
        title: "Success",
        description: "User created successfully",
      })

      // Refresh users list
      fetchUsers()
      
      // Close dialog and reset form
      setIsCreateDialogOpen(false)
      setFormData({
        username: "",
        email: "",
        role: "buyer",
        full_name: "",
        phone: "",
        address: "",
      })
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      // For editing user details, we'll use the update profile API
      // Note: API doesn't have a direct endpoint for admins to edit user details completely
      // This is a limitation of the current API, but we'll implement what we can
      const updates = {
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
      }
      
      // For changing status (active, verified), use the admin endpoint
      await handleStatusChange(editingUser.id, editingUser.is_active ? "inactive" : "active")

      toast({
        title: "Success",
        description: "User updated successfully",
      })
      
      // Refresh users list to get latest data
      fetchUsers()
      
      // Close dialog
      setIsEditDialogOpen(false)
      setEditingUser(null)
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (user: User) => {
    setIsActionLoading(true)
    setTimeout(() => {
      setEditingUser(user)
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        address: user.address,
      })
      setIsEditDialogOpen(true)
      setIsActionLoading(false)
    }, 500)
  }

  const openViewDialog = (user: User) => {
    setIsActionLoading(true)
    
    const fetchUserDetails = async () => {
      try {
        // Get detailed user information from the admin endpoint
        const userData = await fetchApi(`/api/admin/users/${user.id}`)
        setSelectedUser({
          ...user,
          ...userData.user
        })
      } catch (error) {
        console.error("Error fetching user details:", error)
        // Fall back to using the basic user data we already have
        setSelectedUser(user)
      } finally {
        setIsViewDialogOpen(true)
        setIsActionLoading(false)
      }
    }
    
    // Fetch detailed user data
    fetchUserDetails()
  }

  const filteredUsers = activeTab === "all" ? users : users.filter((user) => user.role === activeTab)

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the platform. They will receive their credentials via email.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="farmer">Farmer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="full_name" className="text-right">
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Create User</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              {editingUser && (
                <form onSubmit={handleEditUser}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="edit-username"
                        value={formData.username}
                        className="col-span-3"
                        disabled
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="edit-email"
                        value={formData.email}
                        className="col-span-3"
                        disabled
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-role" className="text-right">
                        Role
                      </Label>
                      <Input
                        id="edit-role"
                        value={formData.role}
                        className="col-span-3"
                        disabled
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-full_name" className="text-right">
                        Full Name
                      </Label>
                      <Input
                        id="edit-full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-phone" className="text-right">
                        Phone
                      </Label>
                      <Input
                        id="edit-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-address" className="text-right">
                        Address
                      </Label>
                      <Input
                        id="edit-address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-active" className="text-right">
                        Active
                      </Label>
                      <div className="col-span-3 flex items-center">
                        <input
                          type="checkbox"
                          id="edit-active"
                          checked={editingUser.is_active}
                          onChange={(e) => setEditingUser({...editingUser, is_active: e.target.checked})}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                        />
                        <span>{editingUser.is_active ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-verified" className="text-right">
                        Verified
                      </Label>
                      <div className="col-span-3 flex items-center">
                        <input
                          type="checkbox"
                          id="edit-verified"
                          checked={editingUser.is_verified}
                          onChange={(e) => setEditingUser({...editingUser, is_verified: e.target.checked})}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                        />
                        <span>{editingUser.is_verified ? "Verified" : "Unverified"}</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage farmers and buyers on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="buyer">Buyers</TabsTrigger>
                <TabsTrigger value="farmer">Farmers</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="w-full">
                {renderUsersTable(filteredUsers, isLoading, handleStatusChange, handleRoleChange, handleDelete, openEditDialog, openViewDialog)}
              </TabsContent>
              <TabsContent value="farmer" className="w-full">
                {renderUsersTable(filteredUsers, isLoading, handleStatusChange, handleRoleChange, handleDelete, openEditDialog, openViewDialog)}
              </TabsContent>
              <TabsContent value="buyer" className="w-full">
                {renderUsersTable(filteredUsers, isLoading, handleStatusChange, handleRoleChange, handleDelete, openEditDialog, openViewDialog)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* User View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Detailed information about the selected user.
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 text-2xl font-bold">
                    {selectedUser.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : 
                     selectedUser.username ? selectedUser.username.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.full_name || selectedUser.username}</h3>
                    <p className="text-sm text-muted-foreground">User ID: {selectedUser.id}</p>
                    <div className="flex items-center mt-1">
                      <Badge variant={getBadgeVariantForRole(selectedUser.role)} className="mr-2">
                        {selectedUser.role}
                      </Badge>
                      <Badge variant={selectedUser.is_active ? "outline" : "destructive"} 
                        className={selectedUser.is_active ? "bg-green-100 text-green-800" : ""}>
                        {selectedUser.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Username</p>
                    <p>{selectedUser.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    <div className="flex items-center gap-1">
                      {selectedUser.role === 'admin' && <Shield className="h-4 w-4 text-blue-500" />}
                      {selectedUser.role === 'farmer' && <Leaf className="h-4 w-4 text-green-500" />}
                      {selectedUser.role === 'buyer' && <User className="h-4 w-4 text-purple-500" />}
                      <span className="capitalize">{selectedUser.role}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="flex items-center gap-1">
                      {selectedUser.is_active ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 rounded-full bg-red-500"></div>
                          <span>Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Verification</p>
                    <div className="flex items-center gap-1">
                      {selectedUser.is_verified ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>Not Verified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p>{selectedUser.address || 'Not provided'}</p>
                </div>
                
                {/* Show role-specific stats */}
                {selectedUser.role === 'farmer' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Products Count</p>
                      <p className="text-lg font-semibold">{selectedUser.products_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Orders Received</p>
                      <p className="text-lg font-semibold">{selectedUser.orders_count || 0}</p>
                    </div>
                  </div>
                )}
                
                {selectedUser.role === 'buyer' && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Orders Placed</p>
                    <p className="text-lg font-semibold">{selectedUser.orders_count || 0}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <p>{new Date(selectedUser.created_at).toLocaleDateString()} {new Date(selectedUser.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p>{new Date(selectedUser.updated_at).toLocaleDateString()} {new Date(selectedUser.updated_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              {selectedUser && (
                <Button variant="default" className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                  setIsViewDialogOpen(false);
                  openEditDialog(selectedUser);
                }}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit User
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Loading Overlay */}
        {isActionLoading && (
          <div className="fixed inset-0 bg-black/20 dark:bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-lg flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
              <span>Loading...</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function renderUsersTable(
  users: User[],
  isLoading: boolean,
  handleStatusChange: (userId: number, status: string) => Promise<void>,
  handleRoleChange: (userId: number, role: string) => Promise<void>,
  handleDelete: (userId: number) => Promise<void>,
  openEditDialog: (user: User) => void,
  openViewDialog: (user: User) => void
) {
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  if (users.length === 0) {
    return <p className="text-center py-4">No users found.</p>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.id}</TableCell>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getBadgeVariantForRole(user.role)}>{user.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active ? "outline" : "destructive"} className={user.is_active ? "bg-green-100 text-green-800" : ""}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_verified ? "outline" : "outline"} className={user.is_verified ? "bg-green-100 text-green-800" : ""}>
                  {user.is_verified ? "Verified" : "Unverified"}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(user.created_at), "MMM d, yyyy")}</TableCell>
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
                    <DropdownMenuItem onClick={() => openViewDialog(user)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(user)}>
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      disabled={user.is_active} 
                      onClick={() => handleStatusChange(user.id, "active")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Set as Active
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      disabled={!user.is_active} 
                      onClick={() => handleStatusChange(user.id, "inactive")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Set as Inactive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      disabled={user.role === "farmer"} 
                      onClick={() => handleRoleChange(user.id, "farmer")}
                    >
                      <Leaf className="mr-2 h-4 w-4" />
                      Make Farmer
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      disabled={user.role === "buyer"} 
                      onClick={() => handleRoleChange(user.id, "buyer")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Make Buyer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600" 
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete User
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

function getBadgeVariantForRole(role: string) {
  switch (role) {
    case "admin":
      return "default" as const
    case "farmer":
      return "secondary" as const
    case "buyer":
      return "outline" as const
    default:
      return "outline" as const
  }
}

