/**
 * A file attached to a record, exactly as erp-be's file endpoints return it
 * (`FileResponse`). Where/how it is stored is never sent to the client - a file is
 * only ever opened through its record's API by `fileId`.
 */
export interface FileAttachment {
    fileId: number;
    originalName: string;
    contentType: string;
    sizeBytes: number;
    /** When it was uploaded (the row's DATE_TIME). */
    createdAt: string;
}

/** What erp-be accepts (it re-checks the real content; these only give instant feedback). */
export const FILE_ATTACHMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg';
export const FILE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
