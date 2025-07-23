import { Injectable } from '@angular/core';
import hljs from 'highlight.js';

@Injectable({
    providedIn: 'root'
})
export class HighlightService {
    
    constructor() {
        // Configure highlight.js with common languages
        hljs.configure({
            classPrefix: 'hljs-',
        });
    }

    /**
     * Highlight code block with syntax highlighting
     */
    highlightCodeBlock(code: string, language: string | undefined): string {
        if (language) {
            try {
                return hljs.highlight(code, {
                    language,
                }).value;
            } catch (e) {
                console.warn(`Highlighting failed for language: ${language}`, e);
                return this.escapeHtml(code);
            }
        }
        
        // Auto-detect language if not specified
        try {
            const result = hljs.highlightAuto(code);
            return result.value;
        } catch (e) {
            return this.escapeHtml(code);
        }
    }

    /**
     * Escape HTML characters
     */
    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * Get available languages
     */
    getLanguages(): string[] {
        return hljs.listLanguages();
    }
} 