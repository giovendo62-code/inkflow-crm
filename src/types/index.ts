export type UserRole = 'MANAGER' | 'ARTIST' | 'STUDENT';

export interface Tenant {
  id: string;
  name: string;
  logo?: string;
  theme?: {
    primaryColor: string;
    sidebarStyle: 'dark' | 'light' | 'colored';
    menuPosition: 'left' | 'top';
    colorMode: 'dark' | 'light';
  };
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string; // Operator photo
  createdAt?: string; // Registration date
  profile?: {
    bio?: string;
    taxId?: string; // Partita IVA
    phone?: string;
    address?: string;
    commissionRate?: number; // Percentage (0-100)
    color: string; // Calendar color
    googleCalendarId?: string;
    googleCalendarConnected?: boolean;
    googleCalendarLastSync?: string;
    password?: string; // Stored locally for custom auth flow (Temporary/Demo)
    preferences?: any; // Generic preferences object (theme, notifications, etc)
  };
}

export type TattooStyle =
  | 'REALISTICO'
  | 'MICRO_REALISTICO'
  | 'MINIMAL'
  | 'GEOMETRICO'
  | 'TRADIZIONALE'
  | 'GIAPPONESE'
  | 'BLACKWORK'
  | 'WATERCOLOR'
  | 'TRIBAL'
  | 'OLD_SCHOOL'
  | 'NEW_SCHOOL'
  | 'LETTERING'
  | 'ALTRO';

export interface Client {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fiscalCode?: string; // Codice Fiscale
  birthDate?: string;
  birthPlace?: string; // Luogo di nascita
  address?: {
    street: string;
    city: string;
    zip: string;
    municipality?: string; // Comune
    country: string;
  };
  preferences: {
    styles: TattooStyle[];
    notes?: string;
  };
  preferredStyle?: TattooStyle; // Main preferred style
  inBroadcast?: boolean; // WhatsApp broadcast list

  // Flat address fields (for backward compatibility)
  street?: string;
  city?: string;
  zip?: string;

  consents?: {
    privacy: boolean;
    informedConsent: boolean;
    privacyDate?: string;
    informedConsentDate?: string;
  };
  notes?: string;
  privacyPolicyAccepted?: boolean;
  privacyPolicyDate?: string;
  informedConsentAccepted?: boolean;
  informedConsentDate?: string;
  attachments?: string[]; // URLs of uploaded images/documents
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  artistId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  serviceType?: string;
  tattooStyle?: TattooStyle; // Style of tattoo for this appointment
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  reminders?: {
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
  };
  createdAt: string;
  updatedAt: string;
  financials: {
    priceQuote?: number; // Preventivo
    depositAmount?: number; // Caparra
    depositPaid: boolean;
  };
  notes?: string;
  attachments?: string[]; // Array of Base64 strings
}

// ==================== ACADEMY ====================

export interface TeachingMaterial {
  id: string;
  tenantId: string;
  studentId: string; // Materiale assegnato allo studente specifico
  courseId: string;
  title: string;
  description?: string;
  url: string; // Link al file (o base64 simulato)
  type: 'PDF' | 'VIDEO' | 'LINK' | 'IMAGE';
  unlockThresholdDays: number; // Giorni di presenza necessari per vederlo (0 = subito)
  createdAt: string;
}

export interface Course {
  id: string;
  tenantId: string;
  name: string; // e.g., "Corso Base Tatuaggio 2024"
  description?: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  totalLessons?: number; // Numero totale lezioni/giornate
  price: number; // Costo totale corso
  instructorId: string; // User ID dell'istruttore
  schedule?: string; // e.g., "Lunedì e Mercoledì 14:00-18:00"
  program?: string; // Programma del corso
  attachments?: string[]; // Materiale didattico (Base64)
  maxStudents?: number;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  tenantId: string;
  courseId: string;

  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fiscalCode?: string;
  birthDate?: string;

  // Address
  street?: string;
  city?: string;
  zip?: string;

  // Course Info
  enrollmentDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'SUSPENDED';

  // Financials
  totalPaid: number; // Totale pagato finora
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  tenantId: string;
  studentId: string;
  courseId: string;
  date: string; // Data della lezione
  present: boolean;
  hours: number; // Ore di lezione
  notes?: string;
  createdAt: string;
}

export interface CoursePayment {
  id: string;
  tenantId: string;
  studentId: string;
  courseId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
  notes?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  tenantId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;

  // Additional fields for UI
  senderName?: string;
  content?: string; // Alias for message
  type?: 'info' | 'warning' | 'message' | 'chat';
  senderAvatar?: string;
}

