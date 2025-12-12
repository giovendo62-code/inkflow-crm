import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { storage } from '../../lib/storage';
import { type ChatMessage } from '../../types';
import { Send, Info, MessageSquare } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function ChatPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isInfo, setIsInfo] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadMessages = () => {
        const msgs = storage.getMessages();
        // Sort by timestamp
        setMessages(msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    };

    useEffect(() => {
        loadMessages();
        // Poll for new messages every 5 seconds (primitive real-time)
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const msg: ChatMessage = {
            id: uuidv4(),
            senderId: user.id,
            senderName: user.name,
            senderAvatar: user.avatarUrl,
            content: newMessage,
            timestamp: new Date().toISOString(),
            type: isInfo && user.role === 'MANAGER' ? 'info' : 'chat'
        };

        storage.saveMessage(msg);
        setNewMessage('');
        setIsInfo(false);
        loadMessages();
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
                            width: '100%'
                        }}>
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
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
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
