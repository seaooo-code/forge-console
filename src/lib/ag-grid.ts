import {
  CellStyleModule,
  ClientSideRowModelModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";

ModuleRegistry.registerModules([ClientSideRowModelModule, CellStyleModule]);

export { themeQuartz };
