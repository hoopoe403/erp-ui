import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface Profile
{
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
    about?: string;
}

export interface ChatConfig {
    title?: string;
    icon?: string;
    placeholder?: string;
    welcomeMessage?: string;
    assistantId?: number;
    theme?: 'light' | 'dark' | 'auto';
    showProfile?: boolean;
    showSessions?: boolean;
    maxMessages?: number;
    embedMode?: boolean;
}

export interface ChatSession
{
    sessionId: string;
    session_name: string;
    assist_id: number;
    messages?: ChatMessage[];
    created_at?: string;
    updated_at?: string;
}

export interface ChatMessage
{
    id: string;
    isUser: boolean;
    content: string;
    timestamp: string;
    sessionId: string;
    sessionName?: string;
}

export interface ChatRequest
{
    session_id: string;
    query: string;
}

export interface ChatResponse
{
    id: string;
    isUser: boolean;
    content: string;
    timestamp: string;
    sessionId: string;
    sessionName: string;
}

export interface SessionInfo
{
    session_id: string;
    session_name: string;
    assist_id: number;
}

// Legacy types for backward compatibility
export interface Contact
{
    id?: string;
    avatar?: string;
    name?: string;
    about?: string;
    details?: {
        emails?: {
            email?: string;
            label?: string;
        }[];
        phoneNumbers?: {
            country?: string;
            phoneNumber?: string;
            label?: string;
        }[];
        title?: string;
        company?: string;
        birthday?: string;
        address?: string;
    };
    attachments?: {
        media?: any[];
        docs?: any[];
        links?: any[];
    };
}

export interface Chat
{
    id?: string;
    contactId?: string;
    contact?: Contact;
    unreadCount?: number;
    muted?: boolean;
    lastMessage?: string;
    lastMessageAt?: string;
    messages?: {
        id?: string;
        chatId?: string;
        contactId?: string;
        isMine?: boolean;
        value?: string;
        createdAt?: string;
    }[];
}

// Interface that both UserGuideService and QueryAssistService must implement
export interface IChatService {
    currentSession$: Observable<ChatSession | null>;
    sessions$: Observable<SessionInfo[]>;
    messages$: Observable<ChatMessage[]>;
    profile$: Observable<Profile>;
    loading$: Observable<boolean>;
    
    getSessions(): Observable<SessionInfo[]>;
    getSession(sessionId: string): Observable<ChatSession>;
    createSession(session: Partial<ChatSession>): Observable<ChatSession>;
    deleteSession(sessionId: string): Observable<void>;
    renameSession(sessionId: string, newName: string): Observable<ChatSession>;
    sendMessage(sessionId: string | null, message: string): Observable<ChatResponse>;
    getProfile(): Observable<Profile>;
    resetSession(): void;
    setCurrentSession(session: ChatSession): void;
}

// Injection token for chat service
export const CHAT_SERVICE_TOKEN = new InjectionToken<IChatService>('ChatService');
