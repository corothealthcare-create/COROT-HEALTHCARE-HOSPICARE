/**
 * COROT HEALTHCARE HOSPICARE - NOTIFICATIONS CONTEXT
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemNotification } from '../types';
import { db } from '../lib/database';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'warning' | 'critical' | 'success', module: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeHospital } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const refreshNotifications = () => {
    const list = db.getNotifications(activeHospital?.id, user?.is_super_admin);
    setNotifications(list);
  };

  useEffect(() => {
    refreshNotifications();
  }, [user, activeHospital]);

  const markAsRead = (id: string) => {
    db.markNotificationRead(id);
    refreshNotifications();
  };

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'critical' | 'success', module: string) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      hospital_id: activeHospital?.id,
      title,
      message,
      type,
      module,
      is_read: false,
      created_at: new Date().toISOString()
    };
    const list = db.getNotifications();
    list.unshift(newNotif);
    localStorage.setItem('corot_hospicare_notifications', JSON.stringify(list));
    refreshNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
