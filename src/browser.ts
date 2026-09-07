// Browser-side entry point (widget embed + SSE stream)
export { MitoeraWidget }                from './MitoeraWidget.js';
export type {
  MitoeraWidgetOptions,
  WidgetEvent,
  SeatSelectedEvent,
  SeatDeselectedEvent,
  HoldConfirmedEvent,
  SessionExpiredEvent,
}                                       from './MitoeraWidget.js';

export { MitoeraStream }                from './MitoeraStream.js';
export type {
  MitoeraStreamOptions,
  SeatStatusChangedEvent,
  StreamConnectionEvent,
}                                       from './MitoeraStream.js';

// Exceptions usable in the browser too
export { MitoeraException }             from './exception/MitoeraException.js';
export { ApiException }                 from './exception/ApiException.js';
export { AuthException }                from './exception/AuthException.js';
