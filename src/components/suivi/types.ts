// Shared types for /suivi tab components

export interface BaggageInfo {
  reference: string;
  type: string;
  travelerName: string;
  baggageIndex: number;
  baggageType: string;
  status: string;
  airlineName: string | null;
  flightNumber: string | null;
  destination: string | null;
  destinationCountry: string | null;
  departureDate: string | null;
  departureTime: string | null;
  transportMode: string;
  trainCompany: string | null;
  trainNumber: string | null;
  shipName: string | null;
  shipCabin: string | null;
  busCompany: string | null;
  busLineNumber: string | null;
  agency: string | null;
  createdAt: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
  declaredLostAt: string | null;
  foundAt: string | null;
  expiresAt: string | null;
}

export interface ScanEntry {
  id: string;
  location: string | null;
  city: string | null;
  country: string | null;
  context: string;
  finderName: string | null;
  finderPhone: string | null;
  message: string | null;
  hasMap: boolean;
  latitude: number | null;
  longitude: number | null;
  scannedAt: string;
  whatsappStatus: string | null;
}

export interface LastPosition {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  hasCoordinates: boolean;
}

export interface SuiviData {
  status: string;
  baggage: BaggageInfo;
  lastFinder: { name: string | null; phone: string | null } | null;
  scans: ScanEntry[];
  lastPosition: LastPosition | null;
}
