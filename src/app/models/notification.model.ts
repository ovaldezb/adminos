// Notification Interface
export interface Notification {
  id: string;
  userId: string;
  condominiumId?: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  color: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

export enum NotificationType {
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_OVERDUE = 'payment_overdue',
  INVOICE_GENERATED = 'invoice_generated',
  NEW_RESIDENT = 'new_resident',
  MAINTENANCE_REQUEST = 'maintenance_request',
  SYSTEM_UPDATE = 'system_update',
  MESSAGE = 'message',
  ALERT = 'alert',
  INFO = 'info'
}

export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  paymentReminders: boolean;
  maintenanceAlerts: boolean;
  systemUpdates: boolean;
}
