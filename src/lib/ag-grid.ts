import {
  CellStyleModule,
  ClientSideRowModelModule,
  ModuleRegistry,
  RowStyleModule,
  themeQuartz,
} from "ag-grid-community";

// RowStyleModule 提供 rowClass / rowClassRules：可点击行的指针样式和详情面板的选中行高亮。
ModuleRegistry.registerModules([ClientSideRowModelModule, CellStyleModule, RowStyleModule]);

export { themeQuartz };
