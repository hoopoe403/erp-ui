import { Translation, TRANSLOCO_CONFIG, TRANSLOCO_LOADER, translocoConfig, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { environment } from 'environments/environment';
import { TranslocoHttpLoader } from 'app/core/transloco/transloco.http-loader';

@NgModule({
    exports  : [
        TranslocoModule
    ],
    providers: [
        {
            // Provide the default Transloco configuration
            provide : TRANSLOCO_CONFIG,
            useValue: translocoConfig({
                availableLangs      : [
                    {
                        id   : 'en',
                        label: 'English'
                    },
                    {
                        id   : 'tr',
                        label: 'Turkish'
                    }
                ],
                defaultLang         : 'en',
                fallbackLang        : 'en',
                reRenderOnLangChange: true,
                prodMode            : environment.production
            })
        },
        {
            // Provide the default Transloco loader
            provide : TRANSLOCO_LOADER,
            useClass: TranslocoHttpLoader
        },
        {
            // Preload the language before the app starts to prevent empty/jumping content
            // Check localStorage for a stored language preference, otherwise use default
            provide   : APP_INITIALIZER,
            deps      : [TranslocoService],
            useFactory: (translocoService: TranslocoService): any => (): Promise<Translation> => {
                // Check if there's a stored language preference in localStorage
                const storedLang = localStorage.getItem('selectedLanguage');
                const availableLangs = ['en', 'tr'];
                
                // Use stored language if valid, otherwise use default
                const langToLoad = storedLang && availableLangs.includes(storedLang) 
                    ? storedLang 
                    : translocoService.getDefaultLang();
                
                translocoService.setActiveLang(langToLoad);
                return translocoService.load(langToLoad).toPromise();
            },
            multi     : true
        }
    ]
})
export class TranslocoCoreModule
{
}
