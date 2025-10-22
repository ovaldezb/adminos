// Activity/Event Interface
export interface Activity {
  id: string;
  condominiumId: string;
  type: ActivityType;
  title: string;
  description: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum ActivityType {
  PAYMENT_RECEIVED = 'payment_received',
  INVOICE_GENERATED = 'invoice_generated',
  REMINDER_SENT = 'reminder_sent',
  RESIDENT_ADDED = 'resident_added',
  RESIDENT_REMOVED = 'resident_removed',
  UNIT_UPDATED = 'unit_updated',
  MAINTENANCE_SCHEDULED = 'maintenance_scheduled',
  ANNOUNCEMENT_POSTED = 'announcement_posted',
  REPORT_GENERATED = 'report_generated',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout'
}

export enum EntityType {
  CONDOMINIUM = 'condominium',
  UNIT = 'unit',
  RESIDENT = 'resident',
  INVOICE = 'invoice',
  PAYMENT = 'payment',
  MAINTENANCE = 'maintenance',
  ANNOUNCEMENT = 'announcement',
  REPORT = 'report',
  USER = 'user'
}

export interface ActivityWithDetails extends Activity {
  condominiumName: string;
  icon: string;
  color: string;
  amount?: string;
  timeAgo: string;
}
