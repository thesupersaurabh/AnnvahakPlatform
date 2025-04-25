"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { fetchApi } from "@/lib/api"
import { Eye, EyeOff, User, Lock, Settings as SettingsIcon, Shield, Bell, Globe, FileCheck } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function SettingsPage() {
  const { user, updateUserInfo } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  })

  // App settings state
  const [appSettings, setAppSettings] = useState({
    language: "english",
    autoApproveProducts: false,
    maintenanceMode: false,
    notifications: true,
  })

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetchApi("/api/auth/profile", {
        method: "PUT",
        body: {
          full_name: accountSettings.fullName,
          phone: accountSettings.phone,
        }
      })
      
      // Update the user info in context
      if (user) {
        updateUserInfo({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: accountSettings.fullName,
          phone: accountSettings.phone,
          address: user.address
        })
      }
      
      toast({
        title: "Settings Updated",
        description: "Your account settings have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update account settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await fetchApi("/api/auth/change-password", {
        method: "PUT",
        body: {
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }
      })
      
      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
      })
      
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleAppSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Settings Updated",
        description: "Application settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const getUserInitials = () => {
    if (user?.full_name) {
      const nameParts = user.full_name.split(' ')
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      }
      return user.full_name.substring(0, 2).toUpperCase()
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'AD'
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account preferences and platform settings</p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-100 dark:from-purple-950/30 dark:to-indigo-950/30 dark:border-purple-900/50">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm dark:border-slate-800">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user?.full_name || user?.username}</p>
              <div className="flex items-center">
                <Badge className="bg-purple-600 hover:bg-purple-700 text-[10px] h-4">
                  {user?.role.toUpperCase()}
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                  ID: {user?.id}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8 w-full max-w-md p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
            <TabsTrigger value="account" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-none data-[state=active]:shadow-sm">
              <User size={16} />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-none data-[state=active]:shadow-sm">
              <Lock size={16} />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="application" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-none data-[state=active]:shadow-sm">
              <SettingsIcon size={16} />
              <span>Application</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="account">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Account Settings</CardTitle>
                    <CardDescription className="mt-1">
                      Manage your personal information and preferences
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleAccountSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={accountSettings.fullName} 
                        onChange={(e) => setAccountSettings({...accountSettings, fullName: e.target.value})}
                        className="h-10"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={accountSettings.email} 
                        disabled
                        className="h-10 bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={accountSettings.phone} 
                        onChange={(e) => setAccountSettings({...accountSettings, phone: e.target.value})}
                        className="h-10"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Role</Label>
                      <div className="h-10 px-3 flex items-center border rounded-md bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                          {user?.role.toUpperCase()}
                        </Badge>
                        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                          Administrator access level
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 px-6"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Security Settings</CardTitle>
                    <CardDescription className="mt-1">
                      Update your password and security preferences
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handlePasswordChange} className="space-y-8">
                  <div className="max-w-md space-y-8">
                    <div>
                      <h3 className="text-base font-medium mb-4">Password Management</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                          <div className="relative">
                            <Input 
                              id="currentPassword" 
                              type={showPassword ? "text" : "password"} 
                              value={passwordData.currentPassword} 
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              className="pr-10 h-10"
                              placeholder="Enter your current password"
                            />
                            <button 
                              type="button" 
                              onClick={togglePasswordVisibility}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                          <div className="relative">
                            <Input 
                              id="newPassword" 
                              type={showPassword ? "text" : "password"} 
                              value={passwordData.newPassword} 
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              className="pr-10 h-10"
                              placeholder="Enter your new password"
                            />
                            <button 
                              type="button" 
                              onClick={togglePasswordVisibility}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Password must be at least 8 characters</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 px-6"
                      disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword}
                    >
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="application">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                    <SettingsIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Platform Settings</CardTitle>
                    <CardDescription className="mt-1">
                      Configure global settings for the Annvahak platform
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleAppSettingsSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-base font-medium">General Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="language" className="text-sm font-medium">Interface Language</Label>
                          <Select 
                            value={appSettings.language} 
                            onValueChange={(value) => setAppSettings({...appSettings, language: value})}
                          >
                            <SelectTrigger id="language" className="h-10">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="english">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span>English</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="hindi">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span>Hindi</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="spanish">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span>Spanish</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
                              <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">Notifications</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Enable notification alerts for platform activities
                              </p>
                            </div>
                          </div>
                          <Switch 
                            checked={appSettings.notifications} 
                            onCheckedChange={(checked) => setAppSettings({
                              ...appSettings, 
                              notifications: checked
                            })}
                            className="data-[state=checked]:bg-purple-600"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-base font-medium">System Preferences</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
                              <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">Auto-approve Products</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Automatically approve new product listings without manual review
                              </p>
                            </div>
                          </div>
                          <Switch 
                            checked={appSettings.autoApproveProducts} 
                            onCheckedChange={(checked) => setAppSettings({
                              ...appSettings, 
                              autoApproveProducts: checked
                            })}
                            className="data-[state=checked]:bg-purple-600"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/50">
                              <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">Maintenance Mode</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Put the application in maintenance mode (restricts user access)
                              </p>
                            </div>
                          </div>
                          <Switch 
                            checked={appSettings.maintenanceMode} 
                            onCheckedChange={(checked) => setAppSettings({
                              ...appSettings, 
                              maintenanceMode: checked
                            })}
                            className="data-[state=checked]:bg-orange-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-8" />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 px-6"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 