import { api, endpoints } from '../utils/api';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  userId: string;
  userName: string;
  unreadCount: number;
  lastMessage: {
    content: string;
    createdAt: string;
  };
}

export const messageService = {
  getConversations: async (token: string) => {
    return api.get<{
      data: Conversation[];
    }>(endpoints.messages.list, token);
  },
  
  getConversation: async (userId: string, token: string) => {
    return api.get<{
      data: Message[];
      user: {
        id: string;
        name: string;
      }
    }>(endpoints.messages.conversation(userId), token);
  },
  
  sendMessage: async (receiverId: string, content: string, token: string) => {
    return api.post<Message>(endpoints.messages.send, {
      receiverId,
      content
    }, token);
  }
}; 