import { Injectable } from '@angular/core';
@Injectable()
export class GridSizeComponent {
    public getWindowSize(): string {
        let newSize: string;
        let minWidth: number;
        minWidth = window.innerWidth;
        if (minWidth < 960)
            newSize = 'sm';
        else if (minWidth >= 960 && minWidth < 1280)
            newSize = 'md';
        else if (minWidth >= 1280)
            newSize = 'lg';
        return newSize;
    }
    public afterViewInit(gridSizeInfo: GridSize) {
        const styleElement = document.createElement('style');
        if (gridSizeInfo.currentSize == 'sm')
            styleElement.textContent = gridSizeInfo.smSCSS;
        else if (gridSizeInfo.currentSize == 'md')
            styleElement.textContent = gridSizeInfo.mdSCSS;
        else if (gridSizeInfo.currentSize == 'lg')
            styleElement.textContent = gridSizeInfo.lgSCSS;
        styleElement.id = gridSizeInfo.classId;
        document.head.appendChild(styleElement);
        const div = document.getElementsByName(gridSizeInfo.tagName);
        for (let index = 0; index < div.length; index++)
            div[index].classList.add(gridSizeInfo.className);
    }
    public onResize(gridSizeInfo: GridSize): string {
        let newSize: string;
        let minWidth: number;
        let newGridSCSS: string;
        let currentGridSCSS: string;

        minWidth = window.innerWidth;
        if (gridSizeInfo.currentSize == 'sm')
            currentGridSCSS = gridSizeInfo.smSCSS;
        else if (gridSizeInfo.currentSize == 'md')
            currentGridSCSS = gridSizeInfo.mdSCSS;
        else if (gridSizeInfo.currentSize == 'lg')
            currentGridSCSS = gridSizeInfo.lgSCSS;

        if (minWidth < 960) {
            newSize = 'sm';
            newGridSCSS = gridSizeInfo.smSCSS;
        }
        else if (minWidth >= 960 && minWidth < 1280) {
            newSize = 'md';
            newGridSCSS = gridSizeInfo.mdSCSS;
        }
        else if (minWidth >= 1280) {
            newSize = 'lg';
            newGridSCSS = gridSizeInfo.lgSCSS;
        }

        if (newSize != gridSizeInfo.currentSize) {
            const currentStyleElement = document.createElement('style');
            currentStyleElement.textContent = currentGridSCSS;
            currentStyleElement.id = gridSizeInfo.classId;
            currentStyleElement.remove();

            const styleElement = document.createElement('style');
            styleElement.textContent = newGridSCSS;
            styleElement.id = gridSizeInfo.classId;
            document.head.appendChild(styleElement);
            const div = document.getElementsByName(gridSizeInfo.tagName);
            for (let index = 0; index < div.length; index++)
                div[index].classList.add(gridSizeInfo.className);
        }
        return newSize;

    }

}

export class GridSize {
    currentSize: string;
    smSCSS: string;
    mdSCSS: string;
    lgSCSS: string;
    classId: string;
    tagName: string;
    className: string;
}
export class columnAccessType {
    list: boolean;
    excel: boolean;
    pdf: boolean;
    advancedSearch: boolean;
}
export class ColumnAccess {
    show: columnAccessType;
    width: {
        sm: string;
        md: string;
        lg: string;
    }
}