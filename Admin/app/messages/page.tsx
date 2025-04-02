"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { fetchApi } from "@/lib/api"
import { useEffect, useState, useRef } from "react"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Send, Info, MessageCircle, Shield, Leaf, User, UserCheck, Eye } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Conversation = {
  user: {
    id: number
    username: string
    full_name: string
    role: string
  }
  latest_message: {
    message: string
    sender_id: number
    created_at: string
  }
  unread_count: number
}

type Message = {
  id: number
  sender_id: number
  receiver_id: number
  message: string
  is_read: boolean
  created_at: string
  sender_name: string
  receiver_name: string
}

type OtherUser = {
  id: number
  role: string
  full_name: string
}

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

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [userDetails, setUserDetails] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [lastMessageId, setLastMessageId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [newMessageText, setNewMessageText] = useState("")
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isSendingNewMessage, setIsSendingNewMessage] = useState(false)

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Function to fetch conversations
  const fetchConversations = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    try {
      const data = await fetchApi("/api/chats/conversations")
      setConversations(data.conversations || [])
    } catch (error) {
      console.error("Error fetching conversations:", error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      })
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  // Function to fetch messages for a conversation
  const fetchMessages = async (userId: number, showLoading = true) => {
    try {
      const data = await fetchApi(`/api/chats/${userId}`)
      if (data && data.messages) {
        setMessages(data.messages)
        setOtherUser(data.other_user)
        
        if (data.messages.length > 0) {
          const maxId = Math.max(...data.messages.map((msg: Message) => msg.id))
          setLastMessageId(maxId)
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      })
    }
  }

  // Check for new messages in the current conversation
  useEffect(() => {
    if (!selectedConversation || !lastMessageId) return
    
    const checkNewMessages = async () => {
      try {
        const data = await fetchApi(`/api/chats/${selectedConversation.user.id}`)
        
        if (data && data.messages) {
          const newMessages = data.messages.filter((msg: Message) => msg.id > lastMessageId)
          
          if (newMessages.length > 0) {
            setMessages(prevMessages => [...prevMessages, ...newMessages])
            const maxId = Math.max(...data.messages.map((msg: Message) => msg.id))
            setLastMessageId(maxId)
            fetchConversations(false)
          }
        }
      } catch (error: any) {
        if (error.status === 429) {
          console.warn("Rate limit reached, backing off...")
          return
        }
        console.error("Error checking for new messages:", error)
      }
    }
    
    const newMessagesInterval = setInterval(checkNewMessages, 10000)
    return () => clearInterval(newMessagesInterval)
  }, [selectedConversation, lastMessageId])

  // Initial fetch of conversations
  useEffect(() => {
    fetchConversations()
    
    const conversationsInterval = setInterval(() => {
      fetchConversations(false)
    }, 30000)
    
    return () => clearInterval(conversationsInterval)
  }, [])

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.user.id)
    }
  }, [selectedConversation])

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return

    setIsSending(true)
    try {
      const response = await fetchApi("/api/chats/send", {
        method: "POST",
        body: {
          receiver_id: selectedConversation.user.id,
          message: newMessage.trim()
        }
      })

      if (!response || !response.chat) {
        throw new Error("Failed to send message")
      }

      // Get the current user's role from localStorage
      let currentUserName = "Admin";
      if (typeof window !== 'undefined') {
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            currentUserName = user.full_name || "Admin";
          }
        } catch (error) {
          console.warn("Could not access user from localStorage:", error);
        }
      }

      const newMessageObj: Message = {
        id: response.chat.id,
        sender_id: response.chat.sender_id,
        receiver_id: response.chat.receiver_id,
        message: response.chat.message,
        created_at: response.chat.created_at,
        is_read: response.chat.is_read,
        sender_name: currentUserName,
        receiver_name: selectedConversation.user.full_name
      }

      setMessages(prevMessages => [...prevMessages, newMessageObj])
      setNewMessage("")
      setLastMessageId(newMessageObj.id)
      
      fetchConversations(false)

      toast({
        title: "Success",
        description: "Message sent successfully"
      })
    } catch (error: any) {
      console.error("Error sending message:", error)
      
      if (error.status === 429) {
        toast({
          title: "Rate Limit Reached",
          description: "Please wait a moment before sending more messages",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        })
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleViewUserDetails = async (userId: number) => {
    setIsLoadingUser(true)
    try {
      const response = await fetchApi(`/api/admin/users/${userId}`)
      setUserDetails(response.user)
      setIsUserDialogOpen(true)
    } catch (error) {
      console.error("Error fetching user details:", error)
      if (otherUser && otherUser.id === userId) {
        const fallbackUser: User = {
          id: otherUser.id,
          username: selectedConversation?.user.username || "",
          email: "",
          role: otherUser.role,
          full_name: otherUser.full_name,
          phone: "",
          address: "",
          is_active: true,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setUserDetails(fallbackUser)
        setIsUserDialogOpen(true)
        
        toast({
          title: "Limited Information",
          description: "Showing limited user information. Full details are only available to admins.",
          variant: "default"
        })
      } else {
        toast({
          title: "Error",
          description: "Could not load user details",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoadingUser(false)
    }
  }

  // Function to get badge variant based on role
  const getBadgeVariantForRole = (role: string) => {
    switch (role) {
      case "admin":
        return "default"
      case "farmer":
        return "secondary"
      case "buyer":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Function to fetch users
  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const response = await fetchApi("/api/admin/users")
      setUsers(response.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Function to send new message
  const handleSendNewMessage = async () => {
    if (!selectedUserId || !newMessageText.trim()) {
      toast({
        title: "Error",
        description: "Please select a user and enter a message",
        variant: "destructive"
      })
      return
    }

    setIsSendingNewMessage(true)
    try {
      await fetchApi("/api/chats/send", {
        method: "POST",
        body: {
          receiver_id: selectedUserId,
          message: newMessageText.trim()
        }
      })

      toast({
        title: "Success",
        description: "Message sent successfully"
      })

      // Reset form and close dialog
      setNewMessageText("")
      setSelectedUserId(null)
      setIsNewMessageDialogOpen(false)

      // Refresh conversations
      fetchConversations()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setIsSendingNewMessage(false)
    }
  }

  // Fetch users when dialog opens
  useEffect(() => {
    if (isNewMessageDialogOpen) {
      fetchUsers()
    }
  }, [isNewMessageDialogOpen])

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Messages</h1>
          <Button onClick={() => setIsNewMessageDialogOpen(true)}>
            <MessageCircle className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        {/* New Message Dialog */}
        <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>
                Select a user and type your message
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                          selectedUserId === user.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <Avatar>
                          <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.full_name}</span>
                            <Badge variant={getBadgeVariantForRole(user.role)}>
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="space-y-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  disabled={isSendingNewMessage}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendNewMessage}
                    disabled={!selectedUserId || !newMessageText.trim() || isSendingNewMessage}
                  >
                    {isSendingNewMessage && (
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Conversations sidebar */}
          <div className="w-full md:w-1/3 border-r flex flex-col min-h-0">
            <CardHeader className="flex-none">
              <CardTitle>Conversations</CardTitle>
              <CardDescription>Chat with farmers and buyers</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No conversations found.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.user.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${
                          selectedConversation?.user.id === conversation.user.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <Avatar>
                          <AvatarFallback>{conversation.user.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{conversation.user.full_name}</span>
                              <Badge variant="outline" className="ml-2">
                                {conversation.user.role}
                              </Badge>
                            </div>
                            {conversation.unread_count > 0 && (
                              <Badge className="ml-auto bg-primary text-primary-foreground">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.latest_message.message}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(conversation.latest_message.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </div>

          {/* Messages area */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedConversation ? (
              <>
                <CardHeader className="flex-none border-b">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{selectedConversation.user.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <CardTitle>{selectedConversation.user.full_name}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewUserDetails(selectedConversation.user.id)}
                          className="ml-2"
                        >
                          <Info className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                      </div>
                      <CardDescription>
                        {selectedConversation.user.role.charAt(0).toUpperCase() +
                          selectedConversation.user.role.slice(1)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <div className="flex-1 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === otherUser?.id ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 relative group ${
                              message.sender_id === otherUser?.id ? "bg-muted" : "bg-primary text-primary-foreground"
                            }`}
                            onClick={() => message.sender_id === otherUser?.id && handleViewUserDetails(otherUser.id)}
                          >
                            {message.sender_id === otherUser?.id && (
                              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            <p className="break-words">{message.message}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {format(new Date(message.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="flex-none p-4 border-t">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSendMessage()
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                      />
                      <Button type="submit" size="icon" disabled={isSending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium">No conversation selected</h3>
                  <p className="text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* User details dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user
            </DialogDescription>
          </DialogHeader>

          {isLoadingUser ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : userDetails && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 py-2">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-xl">
                    {userDetails.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-bold">{userDetails.full_name}</h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Badge variant={getBadgeVariantForRole(userDetails.role)}>
                      {userDetails.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                      {userDetails.role === 'farmer' && <Leaf className="h-3 w-3 mr-1" />}
                      {userDetails.role === 'buyer' && <User className="h-3 w-3 mr-1" />}
                      {userDetails.role}
                    </Badge>
                    {userDetails.is_verified && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        <UserCheck className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p>{userDetails.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{userDetails.email || 'Not available'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{userDetails.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="flex items-center gap-1">
                    {userDetails.is_active ? (
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
              </div>
              
              {userDetails.address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p>{userDetails.address}</p>
                </div>
              )}
              
              {/* Display role-specific statistics */}
              {userDetails.role === 'farmer' && userDetails.products_count !== undefined && (
                <div className="grid grid-cols-1 gap-4 bg-muted p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Products Listed</p>
                    <p className="text-xl font-semibold">{userDetails.products_count}</p>
                  </div>
                  {userDetails.orders_count !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Orders Received</p>
                      <p className="text-xl font-semibold">{userDetails.orders_count}</p>
                    </div>
                  )}
                </div>
              )}
              
              {userDetails.role === 'buyer' && userDetails.orders_count !== undefined && (
                <div className="grid grid-cols-1 gap-4 bg-muted p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Orders Placed</p>
                    <p className="text-xl font-semibold">{userDetails.orders_count}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Loading overlay when sending messages */}
      {isSending && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
            <span>Sending...</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
