export type WasteStatus = 'PENDING' | 'DISPATCHED' | 'RESOLVED' | 'CANCELLED';
export type SeverityLevel = 'MILD' | 'MODERATE' | 'OVERFLOWING' | 'EMERGENCY';

export interface WasteReport {
  id: string;
  ticketNumber: string;
  residentName: string;
  residentPhone?: string;
  isElderly: boolean; // Senior Citizen Priority Flag
  severityLevel: SeverityLevel; // Gaano kalala ang basura
  purok: string; // Cavite City Barangay Zone / Purok
  streetAddress?: string;
  houseNumber?: string;
  landmark?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  autoGpsAccurate?: boolean;
  realtimeGpsAddress?: string; // Tunay na address base sa real-time GPS
  isWithinBrgy41?: boolean; // Tag kung nasa sakop ng Barangay 41 o sa labas
  needsAssistanceOutside?: boolean; // Para sa mga nasa labas ng Cavite City pero nakatira sa Brgy 41
  wasteTypes: string[];
  urgency: 'NORMAL' | 'HIGH' | 'URGENT_ELDERLY' | 'OVERFLOWING';
  estimatedBags?: string;
  photos: string[]; // Resident's uploaded photos (1 to 15)
  notes?: string;
  status: WasteStatus;
  createdAt: string;
  dispatchedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  
  // REQUIRED Kagawad Proof of Collection (Proeba na naipadala pabalik sa residente)
  proofPhotos: string[]; // Litrato ng proeba / katibayan na nakolekta na
  proofSubmittedAt?: string;
  proofKagawadName?: string;
  
  cancellationReason?: string;
  cancelledAt?: string;
  sourceStorage: 'Raspberry Pi 4B (Local Cloud)' | 'Cloud Server';
  storageUsedMb: number; // Kabuuang kinakain sa Raspberry Pi 4 storage
  residentPhotosSizeMb: number; // Kinakain ng litrato ng residente sa Pi
  proofPhotosSizeMb: number; // Kinakain ng proof photo ng Kagawad sa Pi
  retentionDays: number;
  expiresAt: string;
  remindersSent: number;
  lastReminderAt?: string;
  aiAnalysis?: {
    detectedCategories: string[];
    estimatedVolume: string;
    hazardRisk: 'Low' | 'Medium' | 'High';
    recyclableItems: string[];
    suggestedAction: string;
    rawSummary: string;
  };
}

export interface PiStatus {
  hardware: string;
  ram: string;
  storageCapacityGb: number;
  storageUsedMb: number;
  storageFreeGb: number;
  residentPhotosCount: number;
  residentPhotosMb: number;
  proofPhotosCount: number;
  proofPhotosMb: number;
  cachedImagesCount: number;
  activeTicketsCount: number;
  pendingTicketsCount: number;
  autoPurgeTtlDays: number;
  cpuTempCelsius: number;
  ramUsagePercent: number;
  ipAddress: string;
  localHostname: string;
  online: boolean;
  lastPurgeRun: string;
}

export interface PurokZone {
  id: string;
  name: string;
  description: string;
  color: string;
  cx: number;
  cy: number;
  r: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
