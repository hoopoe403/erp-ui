import { Component, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { ChatMessage } from '../../chat.types';

@Component({
    selector: 'chat-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageComponent {
    @Input() message: ChatMessage;
    @Input() showTime: boolean = false;

    /**
     * Format timestamp
     */
    formatTime(timestamp: string): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
} 