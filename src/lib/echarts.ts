import type { EChartsOption } from "echarts";
import { BarChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([BarChart, CanvasRenderer, GridComponent]);

export type { EChartsOption };
export { echarts };
