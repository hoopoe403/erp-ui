import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { from, Subject } from 'rxjs';
import { concatMap, finalize, takeUntil } from 'rxjs/operators';
import { FileAttachmentsService } from './file-attachments.service';
import { FILE_ATTACHMENT_ACCEPT, FILE_ATTACHMENT_MAX_BYTES, FileAttachment } from './file-attachments.types';

/**
 * Documents attached to one record (the scanned purchase invoice, delivery notes...):
 * drop or pick files to upload, open, download, delete. Reusable by any feature - it
 * only needs the record's files path (see `FileAttachmentsService`).
 *
 * - `filesPath` null means the record isn't saved yet (no id), so nothing can be
 *   attached; the panel says so instead of failing.
 * - `readonly` hides upload/delete (e.g. a posted invoice) - erp-be refuses them anyway
 *   (409); this just doesn't offer what would fail.
 *
 * File type and size are checked here only for instant feedback; erp-be re-checks the
 * real content and is the authority.
 */
@Component({
    selector: 'app-file-attachments',
    templateUrl: './file-attachments.component.html'
})
export class FileAttachmentsComponent implements OnChanges, OnDestroy {

    @Input() filesPath: string | null = null;
    @Input() readonly = false;
    @Input() title = 'Documents';

    readonly accept = FILE_ATTACHMENT_ACCEPT;
    files: FileAttachment[] = [];
    isLoading = false;
    isUploading = false;
    isDragOver = false;
    errorMessage: string | null = null;

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _fileAttachmentsService: FileAttachmentsService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _cdr: ChangeDetectorRef
    ) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.filesPath) {
            this.files = [];
            this.errorMessage = null;
            this._load();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get canUpload(): boolean {
        return !!this.filesPath && !this.readonly && !this.isUploading;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Upload
    // -----------------------------------------------------------------------------------------------------

    onFilesPicked(input: HTMLInputElement): void {
        this._upload(Array.from(input.files || []));
        input.value = '';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = this.canUpload;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = false;
        if (this.canUpload && event.dataTransfer) {
            this._upload(Array.from(event.dataTransfer.files));
        }
    }

    /** One at a time, so a refusal (e.g. the file limit) is reported for the file that hit it. */
    private _upload(picked: File[]): void {
        const rejected = picked.filter((file) => this._clientSideProblem(file));
        const accepted = picked.filter((file) => !this._clientSideProblem(file));
        this.errorMessage = rejected.length ? this._clientSideProblem(rejected[0]) : null;
        if (!accepted.length || !this.filesPath) {
            return;
        }
        const path = this.filesPath;
        this.isUploading = true;
        from(accepted).pipe(
            concatMap((file) => this._fileAttachmentsService.upload(path, file)),
            finalize(() => {
                this.isUploading = false;
                this._cdr.markForCheck();
            }),
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (stored) => {
                this.files = [...this.files, stored];
                this._cdr.markForCheck();
            },
            error: (err) => this._showError(err)
        });
    }

    private _clientSideProblem(file: File): string | null {
        const extension = (file.name.split('.').pop() || '').toLowerCase();
        if (!this.accept.split(',').includes('.' + extension)) {
            return `"${file.name}": only PDF, PNG and JPEG files can be uploaded`;
        }
        if (file.size === 0) {
            return `"${file.name}" is empty`;
        }
        if (file.size > FILE_ATTACHMENT_MAX_BYTES) {
            return `"${file.name}" is larger than 10 MB`;
        }
        return null;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Open / download / delete
    // -----------------------------------------------------------------------------------------------------

    /** Opens in a new tab (the browser's own PDF/image viewer). The tab is opened
     *  synchronously, before the request, so popup blockers allow it. */
    open(file: FileAttachment): void {
        const tab = window.open('', '_blank');
        this._fetch(file, (url) => {
            if (tab) {
                tab.opener = null;
                tab.location.href = url;
            }
        }, () => tab && tab.close());
    }

    download(file: FileAttachment): void {
        this._fetch(file, (url) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = file.originalName;
            link.click();
        });
    }

    delete(file: FileAttachment): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete document',
            message: `Remove "${file.originalName}" from this record?`,
            actions: { confirm: { label: 'Delete' } }
        });
        confirmation.afterClosed().subscribe((result) => {
            if (result !== 'confirmed' || !this.filesPath) {
                return;
            }
            this._fileAttachmentsService.delete(this.filesPath, file.fileId).pipe(takeUntil(this._unsubscribeAll)).subscribe({
                next: () => {
                    this.files = this.files.filter((f) => f.fileId !== file.fileId);
                    this._cdr.markForCheck();
                },
                error: (err) => this._showError(err)
            });
        });
    }

    isImage(file: FileAttachment): boolean {
        return file.contentType.startsWith('image/');
    }

    formatSize(bytes: number): string {
        if (bytes < 1024) {
            return bytes + ' B';
        }
        if (bytes < 1024 * 1024) {
            return Math.round(bytes / 1024) + ' KB';
        }
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private
    // -----------------------------------------------------------------------------------------------------

    private _load(): void {
        if (!this.filesPath) {
            return;
        }
        this.isLoading = true;
        this._fileAttachmentsService.list(this.filesPath).pipe(
            finalize(() => {
                this.isLoading = false;
                this._cdr.markForCheck();
            }),
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (files) => this.files = files,
            error: (err) => this._showError(err)
        });
    }

    /** Fetches the bytes (with the auth header) and hands over a short-lived object URL. */
    private _fetch(file: FileAttachment, use: (url: string) => void, onError?: () => void): void {
        if (!this.filesPath) {
            return;
        }
        this._fileAttachmentsService.download(this.filesPath, file.fileId).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(new Blob([blob], { type: file.contentType }));
                use(url);
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            },
            error: (err) => {
                if (onError) {
                    onError();
                }
                this._showError(err);
            }
        });
    }

    /**
     * erp-be's RFC 7807 `detail` when there is one. A failed download's body arrives
     * as a Blob (responseType 'blob'), so it is read as text first.
     */
    private _showError(error: any): void {
        const body = error && error.error;
        if (body instanceof Blob) {
            body.text().then((text) => {
                let detail: string | undefined;
                try {
                    detail = JSON.parse(text).detail;
                } catch {
                    detail = undefined;
                }
                this._setError(detail, error);
            });
            return;
        }
        this._setError(body && body.detail, error);
    }

    private _setError(detail: string | undefined, error: any): void {
        if (typeof detail === 'string' && detail) {
            this.errorMessage = detail;
        } else if (error && error.status === 0) {
            this.errorMessage = 'Could not reach the server. Please try again.';
        } else {
            this.errorMessage = 'Something went wrong with the document. Please try again.';
        }
        this._cdr.markForCheck();
    }
}
