// Browser-side entry point
export { SeatingChart }           from './browser/SeatingChart.js';
export { ChartDesigner }          from './browser/ChartDesigner.js';
export type {
  SeatingChartOptions,
  ChartDesignerOptions,
  SeatInfo,
  ReadyData,
  CategoryPrice,
}                                 from './browser/types.js';

// Exceptions usables côté browser
export { MitoeraException }       from './exception/MitoeraException.js';
export { ApiException }           from './exception/ApiException.js';
export { AuthException }          from './exception/AuthException.js';
