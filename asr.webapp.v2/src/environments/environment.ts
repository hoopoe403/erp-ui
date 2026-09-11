// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  //BASE_URL: "http://5.9.137.29:5000/api/",
  //BASE_URL: "http://109.230.205.40:5000/api/",
  BASE_URL: "http://localhost:5001/api/", // erp-be running locally — local-mock-data endpoints require this
  Image_URL: "http://109.230.205.40:5001",
  // Reference/lookup master data used by entry-form dropdowns (vendors, GL accounts,
  // cost centers, fixed assets, VAT posting groups). Vendor and GL Account have a
  // working real branch (existing endpoints). Cost Center/Fixed Asset/VAT groups now
  // always call erp-be's local-mock-data endpoints (financial/manualInvoice/mock/...)
  // regardless of this flag — whether those return real data is controlled server-side
  // by application.local-mock-data.enabled, not by this flag.
  useMockMasterData: true,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
