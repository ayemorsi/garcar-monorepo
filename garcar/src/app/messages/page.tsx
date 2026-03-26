'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Car,
  Search,
  Send,
  Shield,
  CheckCheck,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConvUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  avatar?: string;
}

interface Conversation {
  user: ConvUser | null;
  latestMessage: { content: string; createdAt: string; read: boolean; receiverId: string };
  unreadCount: number;
}

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(user: ConvUser): string {
  if (user.firstName) return `${user.firstName[0]}${(user.lastName ?? '')[0] ?? ''}`.toUpperCase();
  return user.username.slice(0, 2).toUpperCase();
}

function getDisplayName(user: ConvUser): string {
  if (user.firstName) return `${user.firstName} ${user.lastName ?? ''}`.trim();
  return user.username;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'md' }: { user: ConvUser; size?: 'sm' | 'md' }) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' };
  return (
    <div className={`${sizeClasses[size]} bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {getInitials(user)}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { userId } = getAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getConversations()
      .then((data) => setConversations(data as Conversation[]))
      .catch(console.error)
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!selectedConv?.user) return;
    setLoadingMsgs(true);
    api.getMessages(selectedConv.user._id)
      .then((data) => {
        setMessages(data as Message[]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(console.error)
      .finally(() => setLoadingMsgs(false));
  }, [selectedConv]);

  async function sendMessage() {
    if (!messageText.trim() || !selectedConv?.user) return;
    try {
      setSending(true);
      const msg = await api.sendMessage({ toUserId: selectedConv.user._id, content: messageText.trim() });
      setMessages((prev) => [...prev, msg as Message]);
      setMessageText('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  const filtered = conversations.filter((c) => {
    if (!c.user || !search) return true;
    return getDisplayName(c.user).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AppLayout>
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Left sidebar — conversations */}
        <div className="w-[260px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search neighbors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">No conversations yet</div>
            ) : (
              filtered.map((conv, i) => {
                if (!conv.user) return null;
                const isActive = selectedConv?.user?._id === conv.user._id;
                return (
                  <div
                    key={conv.user._id}
                    onClick={() => setSelectedConv(conv)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 ${
                      isActive ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                    }`}
                  >
                    <Avatar user={conv.user} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                          {getDisplayName(conv.user)}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                          {timeAgo(conv.latestMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.latestMessage.content}</p>
                      {conv.unreadCount > 0 && (
                        <span className="inline-block mt-1 bg-blue-600 text-white text-xs font-bold rounded-full px-1.5">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        {selectedConv?.user ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar user={selectedConv.user} size="md" />
                <div>
                  <div className="font-semibold text-gray-900">{getDisplayName(selectedConv.user)}</div>
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <Shield className="w-3 h-3" />
                    <span>Verified Neighbor</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex justify-center">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-4 py-2 rounded-full flex items-center gap-2 max-w-sm text-center">
                  <Shield className="w-3 h-3 flex-shrink-0" />
                  <span>Both users are verified residents.</span>
                </div>
              </div>

              {loadingMsgs ? (
                <div className="text-center text-gray-400 text-sm py-8">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  Start the conversation with {getDisplayName(selectedConv.user)}
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === userId;
                  return (
                    <div key={msg._id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && <Avatar user={selectedConv.user!} size="sm" />}
                      <div className={`max-w-[70%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-1 text-xs text-gray-400 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && msg.read && (
                            <span className="flex items-center gap-0.5 text-blue-500">
                              <CheckCheck className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !messageText.trim()}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <Car className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">Select a conversation</p>
            <p className="text-xs mt-1">Choose a neighbor to start chatting</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
