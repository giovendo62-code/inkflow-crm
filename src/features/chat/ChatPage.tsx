import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { storage } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { type ChatMessage } from '../../types';
import { Send, Info, MessageSquare, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function ChatPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isInfo, setIsInfo] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadMessages = async () => {
        try {
            if (!user?.tenantId) return;
            const msgs = await storage.getMessages(user.tenantId);
            // Sort by timestamp
            setMessages(msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        } catch (error) {
            console.error("Failed to load messages:", error);
        }
    };

    useEffect(() => {
        const fetchAndMark = async () => {
            await loadMessages();
            if (user?.tenantId) {
                await storage.markMessagesAsRead(user.tenantId, user.id);
            }
        };

        fetchAndMark();

        // Realtime Subscription for Chat
        let messageSubscription: any;
        if (user?.tenantId) {
            messageSubscription = supabase
                .channel(`chat-room-${user.tenantId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `tenant_id=eq.${user.tenantId}`
                    },
                    (payload) => {
                        console.log("📨 New Message received!", payload);
                        fetchAndMark(); // Reload and mark as read
                    }
                )
                .subscribe();
        }

        return () => {
            if (messageSubscription) messageSubscription.unsubscribe();
        };
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const msg: ChatMessage = {
            id: uuidv4(),
            tenantId: user.tenantId,
            senderId: user.id,
            senderName: user.name,
            senderAvatar: user.avatarUrl,
            receiverId: '',
            message: newMessage,
            content: newMessage,
            read: false,
            timestamp: new Date().toISOString(),
            type: isInfo && user.role === 'MANAGER' ? 'info' : 'chat'
        };

        try {
            await storage.saveMessage(msg);
            setNewMessage('');
            setIsInfo(false);
            loadMessages();
        } catch (error: any) {
            console.error("Failed to send message:", error);
            alert("Errore invio messaggio: " + (error.message || JSON.stringify(error)));
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        if (!confirm('Vuoi davvero cancellare questo messaggio?')) return;
        try {
            await storage.deleteMessage(msgId);
            setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (error) {
            console.error("Failed to delete message:", error);
            alert("Errore eliminazione messaggio");
        }
    };

    return (
        <div style={{
            height: 'calc(100vh - 2rem)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <MessageSquare size={24} color="var(--color-primary)" />
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Studio Chat</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        Bacheca e comunicazioni interne del team
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                padding: '2rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    const isSystemInfo = msg.type === 'info';

                    return (
                        <div key={msg.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isSystemInfo ? 'center' : (isMe ? 'flex-end' : 'flex-start'),
                            width: '100%',
                            position: 'relative'
                        }}>
                            {/* Delete Button for Manager */}
                            {user?.role === 'MANAGER' && (
                                <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    style={{
                                        position: 'absolute',
                                        // Align opposite to the bubble side or just outside it
                                        [isMe ? 'left' : 'right']: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-text-muted)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        opacity: 0.6
                                    }}
                                    title="Cancella messaggio"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}

                            {/* Avatar/Name only if not me and not info */}
                            {!isMe && !isSystemInfo && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', marginLeft: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                                        {msg.senderName}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div style={{
                                maxWidth: '70%',
                                padding: isSystemInfo ? '1rem 2rem' : '1rem',
                                borderRadius: isSystemInfo ? 'var(--radius-md)' : (isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px'),
                                backgroundColor: isSystemInfo
                                    ? 'rgba(255, 107, 53, 0.1)'
                                    : (isMe ? 'var(--color-primary)' : 'var(--color-surface)'),
                                color: isSystemInfo
                                    ? 'var(--color-text-primary)'
                                    : (isMe ? 'white' : 'var(--color-text-primary)'),
                                border: isSystemInfo
                                    ? '1px solid var(--color-primary)'
                                    : (isMe ? 'none' : '1px solid var(--color-border)'),
                                boxShadow: 'var(--shadow-sm)',
                                position: 'relative'
                            }}>
                                {isSystemInfo && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.5rem',
                                        color: 'var(--color-primary)',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem'
                                    }}>
                                        <Info size={16} />
                                        ANNUNCIO IMPORTANTE
                                    </div>
                                )}
                                <p style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                {isMe && !isSystemInfo && (
                                    <div style={{
                                        fontSize: '0.7rem',
                                        opacity: 0.8,
                                        marginTop: '0.5rem',
                                        textAlign: 'right'
                                    }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>

                            {/* Announcer Name */}
                            {isSystemInfo && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                    Postato da {msg.senderName} • {new Date(msg.timestamp).toLocaleString()}
                                </span>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{
                padding: '1.5rem',
                backgroundColor: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-end'
            }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Scrivi un messaggio..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-background)',
                            color: 'var(--color-text-primary)',
                            resize: 'none',
                            minHeight: '60px',
                            fontFamily: 'inherit'
                        }}
                    />
                    {user?.role === 'MANAGER' && (
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.85rem',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={isInfo}
                                onChange={(e) => setIsInfo(e.target.checked)}
                            />
                            Segna come Annuncio Importante (tutti riceveranno notifica)
                        </label>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                        padding: '1rem',
                        borderRadius: '50%',
                        backgroundColor: newMessage.trim() ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                        color: newMessage.trim() ? 'white' : 'var(--color-text-muted)',
                        border: 'none',
                        cursor: newMessage.trim() ? 'pointer' : 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Send size={24} />
                </button>
            </form>
        </div>
    );
}
