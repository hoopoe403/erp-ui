import { Injectable } from '@angular/core';
import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';

@Injectable({
    providedIn: 'root'
})
export class MarkdownService {
    
    /**
     * Get custom marked options
     */
    getMarkedOptions(): MarkedOptions {
        const renderer = new MarkedRenderer();
        
        // Custom code block renderer
        renderer.code = (code: string, language: string) => {
            const lang = language || 'text';
            return `<pre class="code-block language-${lang}">
                        <div class="code-header">
                            <span class="language-label">${lang}</span>
                            <button class="copy-button" onclick="this.copyCode(event)">Copy</button>
                        </div>
                        <code class="hljs language-${lang}">${code}</code>
                    </pre>`;
        };
        
        // Custom table renderer
        renderer.table = (header: string, body: string) => {
            return `<div class="table-wrapper">
                        <table class="markdown-table">
                            <thead>${header}</thead>
                            <tbody>${body}</tbody>
                        </table>
                    </div>`;
        };
        
        // Custom blockquote renderer
        renderer.blockquote = (quote: string) => {
            return `<blockquote class="markdown-blockquote">${quote}</blockquote>`;
        };
        
        return {
            renderer: renderer,
            gfm: true,
            breaks: true,
            pedantic: false,
            smartLists: true,
            smartypants: true
        };
    }
    
    /**
     * Copy code to clipboard
     */
    copyCode(event: Event): void {
        const button = event.target as HTMLButtonElement;
        const codeBlock = button.closest('.code-block');
        const code = codeBlock?.querySelector('code')?.textContent;
        
        if (code) {
            navigator.clipboard.writeText(code).then(() => {
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            });
        }
    }
} 