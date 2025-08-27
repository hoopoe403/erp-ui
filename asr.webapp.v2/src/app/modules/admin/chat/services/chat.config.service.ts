import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatConfig } from '../chat.types';



@Injectable({
    providedIn: 'root'
})
export class ChatConfigService {
    private _config: BehaviorSubject<ChatConfig> = new BehaviorSubject<ChatConfig>({
        title: 'Chat Assistant',
        icon: 'heroicons_outline:chat-bubble-left-right',
        placeholder: 'Type your message...',
        welcomeMessage: 'How can I help you today?',
        assistantId: 1,
        theme: 'auto',
        showProfile: true,
        showSessions: true,
        maxMessages: 100,
        embedMode: false
    });

    /**
     * Constructor
     */
    constructor() {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for config
     */
    get config$(): Observable<ChatConfig> {
        return this._config.asObservable();
    }

    /**
     * Get current config value
     */
    get config(): ChatConfig {
        return this._config.getValue();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the chat configuration
     */
    updateConfig(config: Partial<ChatConfig>): void {
        const currentConfig = this._config.getValue();
        const updatedConfig = { ...currentConfig, ...config };
        this._config.next(updatedConfig);
    }

    /**
     * Reset configuration to default
     */
    resetConfig(): void {
        this._config.next({
            title: 'Chat Assistant',
            icon: 'heroicons_outline:chat-bubble-left-right',
            placeholder: 'Type your message...',
            welcomeMessage: 'How can I help you today?',
            assistantId: 1,
            theme: 'auto',
            showProfile: true,
            showSessions: true,
            maxMessages: 100,
            embedMode: false
        });
    }


}
