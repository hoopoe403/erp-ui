import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, QueryList, Renderer2, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductionProgramDialogConfig } from '../dialog.types';
import { ProductionProgramService } from '../../productionPrograms.service';
import { ProductionProgram } from '../../productionPrograms.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { ProductSerial, ProductSerialUI } from '../productSerial';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import * as html2pdf from 'html2pdf.js';
import { PDFDocument } from 'pdf-lib';

interface scale {
    value: number;
    viewValue: string;
}


@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ProductionProgramDialogComponent implements OnInit {
    /**
     * Constructor
     */
    // @ViewChildren('printSection') pr :QueryList<any>;
    @ViewChild('printSection', { static: true }) pr: ElementRef;
    @ViewChild('everyElement', { static: true }) el: ElementRef;
    // @ViewChildren('printSection') pr : QueryList <ElementRef>;
    productionProgramId: number;
    serialInfoUI: Array<ProductSerialUI>;
    isDataLoading: boolean;
    productionProgramIdList: Array<number> = [];
    serials: Array<ProductSerial>;
    isLoading: boolean;
    elementType = 'img';
    value = '';
    format = 'CODE128';
    lineColor = '#000000';
    width = 2;
    height = 37;
    spareWidth = 3;
    spareHeight = 80;
    displayValue = false;
    fontOptions = '';
    font = 'monospace';
    textAlign = 'center';
    textPosition = 'bottom';
    textMargin = 2;
    fontSize = 15;
    background = '#ffffff';
    margin = 0;
    marginTop = 0;
    marginBottom = 0;
    marginLeft = 0;
    marginRight = 0;
    uploadedPdfs: File[] = [];
    mergedPdf: Uint8Array | null = null;
    newFileName: string = 'neuer_dateiname.pdf';
    // transform = 'rotate(90deg)';

    scalePDF: number = 5;
    scales: scale[] = [
        { value: 2, viewValue: 'Low' },
        { value: 4, viewValue: 'Medium' },
        { value: 6, viewValue: 'High' },
        { value: 8, viewValue: 'Very High' },
        { value: 10, viewValue: 'Ultra High' },
    ];
    defaultScale: number = 6;

    _result: OpResult = new OpResult();
    confirmResult: boolean = false;
    chooseForm = new FormGroup({
        selectAll: new FormControl(),
        printLabel0: new FormControl(),
        printLabel1: new FormControl(),
        printLabel2: new FormControl(),
        printLabel3: new FormControl(),
        cartoonLabel: new FormControl(),
        standardLabel: new FormControl(),
    })

    codeList: string[] = [
        '', 'CODE128',
        'CODE128A', 'CODE128B', 'CODE128C',
        'UPC', 'EAN8', 'EAN5', 'EAN2',
        'CODE39',
        'ITF14',
        'MSI', 'MSI10', 'MSI11', 'MSI1010', 'MSI1110',
        'pharmacode',
        'codabar'
    ];

    constructor(private service: ProductionProgramService, private renderer: Renderer2,
        @Inject(MAT_DIALOG_DATA) public data: ProductionProgramDialogConfig,
        private _fuseAlertService: FuseAlertService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        public matDialogRef: MatDialogRef<ProductionProgramDialogComponent>
    ) {
        this.productionProgramIdList = data.productionProgramIdList;
        this.serials = new Array<ProductSerial>();
        this.serialInfoUI = new Array<ProductSerialUI>();
    }




    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.getById(this.productionProgramIdList);
        this.chooseForm = this.createGoodsAdvancedSearchObject();
    }

    private getById(idList: Array<number>): void {
        let obj: ProductionProgram = new ProductionProgram();
        obj.productionProgramIdList = idList;
        this.service.getSerialInfo(obj).subscribe(res => {
            this.serials = res.data;
            this.serials.forEach(element => {

                this.serialInfoUI.push(new ProductSerialUI);
                const indx = this.serialInfoUI.length - 1;
                this.serialInfoUI[indx].value = element.serial;
                this.serialInfoUI[indx].brandId = element.brandId;
                this.serialInfoUI[indx].brandName = element.brandName;
                this.serialInfoUI[indx].productCode = element.productCode;
                this.serialInfoUI[indx].productTypeId = element.productTypeId;
                this.serialInfoUI[indx].frameCoverName = element.frameCoverName;
                this.serialInfoUI[indx].productionLocalDate = element.productionLocalDate;
                this.serialInfoUI[indx].openingType = this.getOpeningType(element.fullName);
                this.serialInfoUI[indx].doorType = this.getDoorType(element.fullName);
                this.serialInfoUI[indx].panel = this.getPanel(element.fullName);
                this.serialInfoUI[indx].doorHeight = this.getHeight(element.fullName);
                this.serialInfoUI[indx].doorWidth = this.getWidth(element.fullName);
                this.serialInfoUI[indx].doorDirection = this.getDirection(element.fullName);
                this.serialInfoUI[indx].showCover = this.setShowCover(element.fullName);

                if (this.serialInfoUI[indx].doorType.toUpperCase().indexOf('LANDING DOOR') === -1) {
                    this.serialInfoUI[indx].labelLoop = Array(2).fill(1);
                    this.serialInfoUI[indx].motorDriveKamanLoop = this.serialInfoUI[indx].brandId !== 10000983 ? Array(3).fill(2) : Array(2).fill(1);
                    this.serialInfoUI[indx].showStandard = false;
                }
                else {
                    this.serialInfoUI[indx].labelLoop = Array(4).fill(3);
                    this.serialInfoUI[indx].showStandard = true;
                }
            });


        });
    }

    setScaleValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.scalePDF = event.source.value;
        }
    }



    createGoodsAdvancedSearchObject(): FormGroup {
        return this._formBuilder.group({
            selectAll: true,
            printLabel0: true,
            printLabel1: true,
            printLabel2: true,
            printLabel3: true,
            cartoonLabel: true,
            standardLabel: true,
        });
    }

    public changePrintLabel(labelId: string) {
        var node = document.getElementById(labelId);
        console.log(node.style.display)
        node.style.display =
            node.style.display === 'none' || "" ? 'flex' : 'none';
    }


    Prints() {
        const sections = this.pr.nativeElement;
        const container = document.createElement('div');

        const options = {
            margin: 10,
            filename: 'your_file_name.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'px', format: [sections.offsetWidth, sections.offsetHeight], orientation: 'portrait' }
        };

        html2pdf().set(options).from(sections).save();
    }


    async coordinateMergePDFs() {
        const pdfs = await Promise.all(this.uploadedPdfs.map(file => this.readPDF(file)));
        this.mergedPdf = await this.mergePDFsIntoOne(pdfs);
    }
    async readPDF(file: File): Promise<Uint8Array> {
        return new Promise<Uint8Array>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    resolve(new Uint8Array(event.target.result as ArrayBuffer));
                } else {
                    reject('Could not read the PDF file');
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }
    async mergePDFsIntoOne(pdfs: Uint8Array[]): Promise<Uint8Array> {
        const mergedPdf = await PDFDocument.create();
        for (const pdfBytes of pdfs) {
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        }
        return await mergedPdf.save();
    }
    reorderFiles(event: any) {
        const files: FileList = event.target.files;
        for (let i = 0; i < files.length; i++) {
            this.uploadedPdfs.push(files[i]);
        }
        this.coordinateMergePDFs();
    }
    downloadMergedPDF() {
        if (!this.mergedPdf) {
            return;
        }
        const blob = new Blob([this.mergedPdf], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;

        // Verwenden Sie den Wert aus dem Textfeld als Dateinamen
        a.download = this.newFileName; // Hier wird der Dateiname aus dem Textfeld verwendet

        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }



    // Prints(){    
    //          this.pr.map((e) => {
    //             const options = {
    //                       filename: 'your_pdf_file.pdf',
    //                       jsPDF: { orientation: 'portrait' , unit : "px" , format : [e.nativeElement.offsetWidth , e.nativeElement.offsetHeight]},
    //                       html2canvas: { scale: this.scalePDF},
    //                       image: { type: 'jpeg', quality: 0.98 }, 
    //                     };

    //                     html2pdf().from(e.nativeElement).set(options).save();
    //         })

    //   }


    public checkAllIndeterminate(): boolean {
        if ((this.chooseForm.controls['printLabel0'].value === true ||
            this.chooseForm.controls['printLabel1'].value === true ||
            this.chooseForm.controls['printLabel2'].value === true ||
            this.chooseForm.controls['printLabel3'].value === true ||
            this.chooseForm.controls['cartoonLabel'].value === true ||
            this.chooseForm.controls['standardLabel'].value === true)
            && !this.allSelected())
            return true;
        else
            return false;
    }

    public allSelected(): boolean {

        if (this.chooseForm.controls['printLabel0'].value === true &&
            this.chooseForm.controls['printLabel1'].value === true &&
            this.chooseForm.controls['printLabel2'].value === true &&
            this.chooseForm.controls['printLabel3'].value === true &&
            this.chooseForm.controls['cartoonLabel'].value === true &&
            this.chooseForm.controls['standardLabel'].value === true)
            return true;
        else
            return false;

    }
    public masterToggle() {
        if (this.chooseForm.controls['selectAll'].value) {
            this.chooseForm.controls['printLabel0'].setValue(true);
            this.chooseForm.controls['printLabel1'].setValue(true);
            this.chooseForm.controls['printLabel2'].setValue(true);
            this.chooseForm.controls['printLabel3'].setValue(true);
            this.chooseForm.controls['cartoonLabel'].setValue(true);
            this.chooseForm.controls['standardLabel'].setValue(true);
        }
        else {
            this.chooseForm.controls['printLabel0'].setValue(false);
            this.chooseForm.controls['printLabel1'].setValue(false);
            this.chooseForm.controls['printLabel2'].setValue(false);
            this.chooseForm.controls['printLabel3'].setValue(false);
            this.chooseForm.controls['cartoonLabel'].setValue(false);
            this.chooseForm.controls['standardLabel'].setValue(false);
        }
        this.changePrintLabel('printLabel0');
        this.changePrintLabel('printLabel1');
        this.changePrintLabel('printLabel2');
        this.changePrintLabel('printLabel3');
        this.changePrintLabel('cartoonLabel');
        this.changePrintLabel('standardLabel');


    }

    private setShowCover(productName: string): boolean {
        let result: boolean;
        if (productName.toLowerCase().includes('landing'))
            result = true;
        else
            result = false;

        return result;
    }

    private getOpeningType(productName: string): string {
        if (productName.toLowerCase().includes('telescopic'))
            return 'T'
        else
            return 'C';
    }

    private getDoorType(productName: string): string {
        if (productName.toLowerCase().includes('landing'))
            return 'Landing Door'
        else
            return 'Car Door';
    }
    private getWidth(productName: string): string {
        let indx: number = productName.indexOf('H');
        let word: string = productName.substring(indx + 1);
        word = word.trim();
        word = word.substring(word.indexOf(' ') + 1);
        word = word.concat(' ').concat('mm');
        word = word.toLowerCase().replace('right', '');
        word = word.toLowerCase().replace('left', '');
        return word;
    }

    private getDirection(productName: string): string {
        let direction: string;
        if (productName.toLowerCase().includes('right'))
            direction = 'Right';
        else if (productName.toLowerCase().includes('left'))
            direction = 'Left';
        else
            direction = '';

        return direction;
    }

    private getHeight(productName: string): string {
        let indx: number = productName.indexOf('H');
        let word: string = productName.substring(indx + 1);
        word = word.trim();
        word = word.substring(0, word.indexOf(' '));
        word = word.concat(' ').concat('mm');
        return word;
    }
    private getPanel(productName: string): string {
        let lastIndex: number = -1;
        let lastWord: string;
        for (let index = 0; index < productName.length; index++) {

            let word: string;
            let char: string = productName.substring(index, index + 1);
            if (char === ' ') {
                word = productName.substring(lastIndex + 1, index);
                if (word.toLowerCase().includes('panel'))
                    return lastWord.concat(' ').concat(word);
                else {
                    lastIndex = index;
                    lastWord = word;
                }
            }

        }
        return '';
    }


    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    closeDialog() {
        this.matDialogRef.close(this.confirmResult);
    }

}
