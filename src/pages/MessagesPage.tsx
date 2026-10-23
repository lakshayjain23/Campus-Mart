import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  Clock,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  supabase,
  fetchUserConversations,
  fetchConversationMessages,
  sendMessage,
  getOrCreateConversation,
  type ConversationItem,
  type MessageItem,
} from '../lib/supabase';

const CAMPUS_SAFE_LOCATIONS = [
  { name: 'Central Library Foyer', desc: 'Well-lit with campus security reception' },
  { name: 'Student Activity Center (SAC)', desc: 'Open daytime common area' },
  { name: 'Campus Main Security Gate', desc: 'Official 24/7 security booth' },
  { name: 'Central Canteen / Food Court', desc: 'Busy daytime seating area' },
  { name: 'Academic Block 1 Entrance', desc: 'Monitored academic quad' },
];

const formatMessageTime = (dateStr?: string | null) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatConversationDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialListingId = searchParams.get('listingId');
  const initialSellerId = searchParams.get('sellerId');

  const { user, openAuthModal } = useAuth();
  const { products } = useMarketplace();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showMeetupModal, setShowMeetupModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user conversations & handle query params
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const initConversations = async () => {
      setLoadingConversations(true);
      try {
        let activeIdToSelect: string | null = null;

        if (initialListingId && initialSellerId && initialSellerId !== user.id) {
          const convId = await getOrCreateConversation(
            initialListingId,
            initialSellerId,
            user.id
          );
          if (convId && isMounted) {
            activeIdToSelect = convId;
          }
        }

        const convs = await fetchUserConversations(user.id);
        if (isMounted) {
          setConversations(convs || []);
          if (activeIdToSelect) {
            setActiveConversationId(activeIdToSelect);
          } else if (convs && convs.length > 0) {
            setActiveConversationId((curr) => curr || convs[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        if (isMounted) setLoadingConversations(false);
      }
    };

    initConversations();

    return () => {
      isMounted = false;
    };
  }, [user, initialListingId, initialSellerId]);

  // Fetch messages and subscribe to Realtime for active conversation
  useEffect(() => {
    if (!activeConversationId || !user) return;

    let isMounted = true;

    const loadMsgs = async () => {
      setLoadingMessages(true);
      const msgs = await fetchConversationMessages(activeConversationId);
      if (isMounted) {
        setMessages(msgs || []);
        setLoadingMessages(false);
      }
    };

    loadMsgs();

    // Supabase Realtime channel subscription
    const channel = supabase
      .channel(`chat_${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (isMounted && newMsg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [
                ...prev,
                {
                  id: newMsg.id,
                  conversationId: newMsg.conversation_id,
                  senderId: newMsg.sender_id,
                  messageText: newMsg.message_text,
                  isMeetupSuggestion: Boolean(newMsg.is_meetup_suggestion),
                  meetupLocation: newMsg.meetup_location || undefined,
                  createdAt: newMsg.created_at,
                  readAt: newMsg.read_at,
                },
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, user]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || messageInput).trim();
    if (!textToSend || !activeConversationId || !user || isSending) return;

    setIsSending(true);
    setSendError(null);

    try {
      const msg = await sendMessage({
        conversationId: activeConversationId,
        senderId: user.id,
        messageText: textToSend,
      });

      if (!customText) setMessageInput('');
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (err: any) {
      setSendError(err.message || 'Error sending message');
    } finally {
      setIsSending(false);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeProduct = activeConversation
    ? products.find((p) => p.id === activeConversation.listingId)
    : null;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-xs">
          <MessageSquare className="w-12 h-12 text-[#15803D] mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Student Messages</h2>
          <p className="text-xs text-slate-500 mb-6">
            Log in to coordinate campus meetups, chat with buyers and sellers, and ask questions about listings.
          </p>
          <button
            onClick={() => openAuthModal('signin')}
            className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs"
          >
            Sign In to View Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[780px]">
          {/* LEFT COLUMN: Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${
              activeConversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#15803D]" />
                  <span>Campus Chats</span>
                </h1>
                <p className="text-[11px] text-slate-500">Coordinate handover safely on campus</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {conversations.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingConversations ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No conversations yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-4">
                    Explore campus listings and click "Chat in App" to contact sellers.
                  </p>
                  <Link
                    to="/explore"
                    className="inline-block px-3 py-1.5 text-xs font-semibold text-white bg-[#064E3B] rounded-lg"
                  >
                    Browse Items
                  </Link>
                </div>
              ) : (
                conversations.map((conv) => {
                  const p = products.find((prod) => prod.id === conv.listingId);
                  const isSelected = conv.id === activeConversationId;
                  const isSeller = conv.sellerId === user.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                        isSelected ? 'bg-emerald-50/80 border-l-4 border-[#064E3B]' : 'hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                        {p?.images[0] ? (
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {p ? p.title : 'Marketplace Item'}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatConversationDate(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mb-1">
                          {p ? `₹${p.price.toLocaleString('en-IN')}` : ''} • {isSeller ? 'You are Seller' : 'You are Buyer'}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-medium">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Active handover</span>
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Chat Thread */}
          <div
            className={`flex-1 flex flex-col bg-white ${
              !activeConversationId ? 'hidden md:flex items-center justify-center' : 'flex'
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setActiveConversationId(null)}
                      className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                      {activeProduct?.images[0] ? (
                        <img src={activeProduct.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {activeProduct ? activeProduct.title : 'Marketplace Conversation'}
                        </h2>
                        {activeProduct?.status === 'sold' && (
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            Sold
                          </span>
                        )}
                        {activeProduct?.status === 'reserved' && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            Reserved
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        {activeProduct && (
                          <span className="font-semibold text-emerald-800">
                            ₹{activeProduct.price.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span>•</span>
                        {activeProduct && (
                          <Link
                            to={`/product/${activeProduct.id}`}
                            className="text-emerald-700 hover:underline flex items-center gap-0.5"
                          >
                            <span>View Listing</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggest Meetup Header Action */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMeetupModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl transition-all shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="hidden sm:inline">Suggest Meetup</span>
                      <span className="sm:hidden">Meetup</span>
                    </button>
                  </div>
                </div>

                {/* Campus Safety Banner */}
                <div className="bg-emerald-50/80 border-b border-emerald-100 px-4 py-2 flex items-center gap-2 text-[11px] text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Campus Safety Reminder:</strong> Meet in public daytime areas (Library, Canteen, SAC). Never send advance wire transfers.
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]">
                  {loadingMessages ? (
                    <div className="text-center py-10 text-xs text-slate-400">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-14 max-w-sm mx-auto">
                      <Sparkles className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-bold text-slate-800">Start the conversation!</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Say hello, confirm condition, or click "Suggest Meetup" above to propose a campus location.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user.id;
                      const isMeetupMsg = msg.isMeetupSuggestion || msg.messageText.includes('meet at');

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                              isMe
                                ? 'bg-[#064E3B] text-white rounded-br-xs'
                                : isMeetupMsg
                                ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-medium rounded-bl-xs'
                                : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs'
                            }`}
                          >
                            {isMeetupMsg && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 mb-1">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                <span>Campus Handover Proposal</span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.messageText}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-1 px-1">
                            <span className="text-[10px] text-slate-400">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {isMe && <CheckCheck className="w-3 h-3 text-emerald-600" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Error Banner if Send Fails */}
                {sendError && (
                  <div className="p-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs px-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {sendError}
                    </span>
                    <button
                      onClick={() => setSendError(null)}
                      className="text-xs font-bold underline ml-2"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Message Input Footer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type message to seller/buyer..."
                    disabled={isSending}
                    className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || isSending}
                    className="px-4 py-2.5 bg-[#064E3B] hover:bg-[#15803D] disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center p-8">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Select a conversation</h3>
                <p className="text-xs text-slate-400 mt-1">Choose a chat from the left panel to begin messaging.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campus Safe Meetup Suggestion Modal */}
      {showMeetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
            <div className="flex items-center gap-2 text-emerald-800 mb-2">
              <MapPin className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">Suggest Campus Meetup Spot</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select an official, busy campus location to ensure a safe in-person handover.
            </p>

            <div className="space-y-2 mb-5">
              {CAMPUS_SAFE_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => {
                    const proposal = `Would you like to meet at ${loc.name} (${loc.desc}) for the handover?`;
                    setMessageInput(proposal);
                    setShowMeetupModal(false);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-600/50 hover:bg-emerald-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                      {loc.name}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Select →
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{loc.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowMeetupModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
