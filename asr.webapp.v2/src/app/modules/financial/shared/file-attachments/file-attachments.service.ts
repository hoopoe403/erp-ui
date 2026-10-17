import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { FileAttachment } from './file-attachments.types';

/**
 * Calls a record's file endpoints. Every feature exposes the same four under its own
 * record (e.g. `financial/purchaseInvoice/42/files`), so this takes that base path and
 * knows nothing about invoices - the feature's own service builds the path.
 *
 * Plain HTTP semantics like the Purchase Invoice API: the body is the resource, and a
 * refusal is an HTTP error whose RFC 7807 `detail` holds the readable text (400 wrong
 * type/size, 404 unknown file, 409 posted invoice / too many files).
 *
 * Downloads come back as a Blob through HttpClient, so the auth token travels in the
 * header as for every other call - never in a URL a browser could log or share.
 */
@Injectable({
    providedIn: 'root'
})
export class FileAttachmentsService {

    constructor(private _httpClient: HttpClient) {
    }

    list(filesPath: string): Observable<FileAttachment[]> {
        return this._httpClient.get<FileAttachment[]>(ApiHelperService.BASE_URL + filesPath);
    }

    /** 201 - emits the stored file. */
    upload(filesPath: string, file: File): Observable<FileAttachment> {
        const body = new FormData();
        body.append('file', file, file.name);
        return this._httpClient.post<FileAttachment>(ApiHelperService.BASE_URL + filesPath, body);
    }

    download(filesPath: string, fileId: number): Observable<Blob> {
        return this._httpClient.get(ApiHelperService.BASE_URL + filesPath + '/' + fileId, { responseType: 'blob' });
    }

    /** 204 - the file is no longer listed (erp-be keeps it for the audit trail). */
    delete(filesPath: string, fileId: number): Observable<void> {
        return this._httpClient.delete<void>(ApiHelperService.BASE_URL + filesPath + '/' + fileId);
    }
}
