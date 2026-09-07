export interface SeatInfo {
  seatKey: string;
  catId: string;
  catColor: string;
  catName: string;
}

export interface ReadyData {
  sessionToken: string;
  holdToken: string;
  eventId: string;
}

export interface CategoryPrice {
  price: number;
  currency: string;
}

export interface SeatingChartOptions {
  /** ID du `<div>` conteneur. */
  divId: string;
  /** Clé publique du workspace (`pk_live_xxx` prod, `pk_test_xxx` sandbox). */
  workspaceKey: string;
  /** Slug ou UUID de l'événement. */
  event: string;
  /** @deprecated Ignoré pour les clés pk_live_/pk_test_. Maintenu pour pk_pub_ legacy. */
  sandbox?: boolean;
  /** URL de base de l'API (défaut : https://api.mitoera.com). Utile pour le développement local. */
  baseUrl?: string;
  /** Affiche la barre de légende (défaut : true). */
  showLegend?: boolean;
  /** Affiche le footer récapitulatif (défaut : false). */
  showResume?: boolean;
  /** Prix par catégorie (catId → { price, currency }). Peut être mis à jour via setCategoryPrices(). */
  categoryPrices?: Record<string, CategoryPrice>;

  onReady?: (data: ReadyData) => void;
  onSeatSelected?: (seat: SeatInfo) => void;
  onSeatDeselected?: (seat: SeatInfo) => void;
  /** Reçoit le tableau complet des sièges sélectionnés à chaque changement. */
  onSelectionChange?: (seats: SeatInfo[]) => void;
  /** N'est déclenché que si checkout est implicitement activé (bouton "Valider" visible). */
  onCheckout?: (seats: SeatInfo[]) => void;
}

export interface ChartDesignerOptions {
  /** ID du `<div>` conteneur. */
  divId: string;
  /** Format : "keyId:secret" */
  secretKey: string;
  /** UUID du plan à éditer. */
  chartKey: string;
  /** UUID de l'événement (optionnel — pour pré-filtrer les statuts). */
  eventKey?: string;
}
