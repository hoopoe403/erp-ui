import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ChatConfigService } from 'app/modules/admin/chat/services/chat.config.service';
import { ChatSession, ChatMessage, ChatRequest, ChatResponse, SessionInfo, Profile } from 'app/modules/admin/chat/chat.types';

@Injectable({
    providedIn: 'root'
})
export class QueryAssistService {
    private _currentSession: BehaviorSubject<ChatSession | null> = new BehaviorSubject(null);
    private _sessions: BehaviorSubject<SessionInfo[]> = new BehaviorSubject([]);
    private _messages: BehaviorSubject<ChatMessage[]> = new BehaviorSubject([]);
    private _profile: BehaviorSubject<Profile> = new BehaviorSubject(null);
    private _loading: BehaviorSubject<boolean> = new BehaviorSubject(false);

    // Base URL for the API
    private readonly API_BASE_URL = "http://localhost:8000/api";
    private readonly ASSISTANT_ID = 2; // Query assist assistant ID

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _chatConfigService: ChatConfigService
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current session
     */
    get currentSession$(): Observable<ChatSession | null> {
        return this._currentSession.asObservable();
    }

    /**
     * Getter for sessions
     */
    get sessions$(): Observable<SessionInfo[]> {
        return this._sessions.asObservable();
    }

    /**
     * Getter for messages
     */
    get messages$(): Observable<ChatMessage[]> {
        return this._messages.asObservable();
    }

    /**
     * Getter for profile
     */
    get profile$(): Observable<Profile> {
        return this._profile.asObservable();
    }

    /**
     * Getter for loading state
     */
    get loading$(): Observable<boolean> {
        return this._loading.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get query assist sessions
     */
    getSessions(): Observable<SessionInfo[]> {
        const params = { assist_id: this.ASSISTANT_ID };
        return this._httpClient.get<SessionInfo[]>(`${this.API_BASE_URL}/sessions/list`, { params }).pipe(
            tap((sessions: SessionInfo[]) => {
                this._sessions.next(sessions);
            })
        );
    }

    /**
     * Get a specific session
     */
    getSession(sessionId: string): Observable<ChatSession> {
        return this._httpClient.get<any>(`${this.API_BASE_URL}/sessions/${sessionId}`).pipe(
            tap((response: any) => {
                // Transform backend response to frontend format
                const transformedMessages: ChatMessage[] = response.messages.map((msg: any, index: number) => ({
                    id: `${msg.role}_${response.session_id}_${index}`,
                    isUser: msg.role === 'user',
                    content: msg.content,
                    timestamp: msg.timestamp,
                    sessionId: response.session_id,
                    sessionName: response.session_name
                }));

                const session: ChatSession = {
                    sessionId: response.session_id,
                    session_name: response.session_name,
                    assist_id: this.ASSISTANT_ID,
                    messages: transformedMessages,
                    created_at: response.created_at,
                    updated_at: response.updated_at
                };

                this._currentSession.next(session);
                this._messages.next(transformedMessages);
            })
        );
    }

    /**
     * Create a new session
     */
    createSession(session: Partial<ChatSession>): Observable<ChatSession> {
        const sessionData = { ...session, assist_id: this.ASSISTANT_ID };
        return this._httpClient.post<ChatSession>(`${this.API_BASE_URL}/sessions`, sessionData).pipe(
            tap((newSession: ChatSession) => {
                // Update sessions list
                const currentSessions = this._sessions.getValue();
                const newSessionInfo: SessionInfo = {
                    session_id: newSession.sessionId,
                    session_name: newSession.session_name,
                    assist_id: this.ASSISTANT_ID
                };
                this._sessions.next([newSessionInfo, ...currentSessions]);
                this._currentSession.next(newSession);
                this._messages.next([]);
            })
        );
    }

    /**
     * Delete a session
     */
    deleteSession(sessionId: string): Observable<void> {
        return this._httpClient.delete<void>(`${this.API_BASE_URL}/sessions/${sessionId}`).pipe(
            tap(() => {
                // Remove from sessions list
                const currentSessions = this._sessions.getValue();
                const updatedSessions = currentSessions.filter(s => s.session_id !== sessionId);
                this._sessions.next(updatedSessions);
                
                // Clear current session if it's the deleted one
                const currentSession = this._currentSession.getValue();
                if (currentSession && currentSession.sessionId === sessionId) {
                    this._currentSession.next(null);
                    this._messages.next([]);
                }
            })
        );
    }

    /**
     * Rename a session
     */
    renameSession(sessionId: string, newName: string): Observable<ChatSession> {
        return this._httpClient.put<ChatSession>(`${this.API_BASE_URL}/sessions/rename`, {
            session_id: sessionId,
            new_name: newName
        }).pipe(
            tap((updatedSession: ChatSession) => {
                // Update sessions list
                const currentSessions = this._sessions.getValue();
                const updatedSessions = currentSessions.map(s => 
                    s.session_id === sessionId 
                        ? { ...s, session_name: newName }
                        : s
                );
                this._sessions.next(updatedSessions);
                
                // Update current session if it's the renamed one
                const currentSession = this._currentSession.getValue();
                if (currentSession && currentSession.sessionId === sessionId) {
                    this._currentSession.next(updatedSession);
                }
            })
        );
    }

    /**
     * Send a message and get AI response
     */
    sendMessage(sessionId: string | null, message: string): Observable<ChatResponse> {
        this._loading.next(true);
        
        const request: ChatRequest = {
            session_id: sessionId || '',
            query: message
        };
        
        return this._httpClient.post<any>(`${this.API_BASE_URL}/assist`, request).pipe(
            tap((response: any) => {
                // Transform backend response to frontend format
                const currentMessages = this._messages.getValue();
                const userMessage: ChatMessage = {
                    id: 'user_' + Date.now(),
                    isUser: true,
                    content: message,
                    timestamp: new Date().toISOString(),
                    sessionId: response.session_id,
                    sessionName: response.session_name
                };
                
                const aiMessage: ChatMessage = {
                    id: response.id || 'ai_' + Date.now(),
                    isUser: false,
                    content: response.content,
                    timestamp: response.timestamp,
                    sessionId: response.session_id,
                    sessionName: response.session_name
                };
                
                this._messages.next([...currentMessages, userMessage, aiMessage]);
                
                // If this was a new session (no sessionId was provided), 
                // update the current session with the response data
                if (!sessionId) {
                    const newSession: ChatSession = {
                        sessionId: response.session_id,
                        session_name: response.session_name,
                        assist_id: this.ASSISTANT_ID,
                        messages: [...currentMessages, userMessage, aiMessage]
                    };
                    this._currentSession.next(newSession);
                    
                    // Refresh the sessions list to include the new session
                    this.getSessions().subscribe();
                }
                
                this._loading.next(false);
            })
        );
    }

    /**
     * Get profile
     */
    getProfile(): Observable<Profile> {
        const mockProfile: Profile = {
            id: '2',
            name: 'Query Assistant',
            email: 'queryassist@assistant.com',
            avatar: null,
            about: 'Your Query Assistant'
        };
        
        this._profile.next(mockProfile);
        return of(mockProfile);
    }

    /**
     * Reset the selected session
     */
    resetSession(): void {
        this._currentSession.next(null);
        this._messages.next([]);
    }

    /**
     * Set current session
     */
    setCurrentSession(session: ChatSession): void {
        this._currentSession.next(session);
        if (session.messages) {
            this._messages.next(session.messages);
        }
    }


}
