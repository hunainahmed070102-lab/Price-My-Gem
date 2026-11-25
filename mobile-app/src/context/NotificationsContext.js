import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotificationPreference();
  }, []);

  const loadNotificationPreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem('notificationsEnabled');
      if (savedPreference !== null) {
        setNotificationsEnabled(savedPreference === 'true');
      }
    } catch (error) {
      console.error('Error loading notification preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotifications = async () => {
    try {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      await AsyncStorage.setItem('notificationsEnabled', newValue.toString());
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  };

  const sendNotification = async (title, body) => {
    if (!notificationsEnabled) {
      console.log('Notifications are disabled by user');
      return;
    }
    console.log(`[Notification]: ${title} - ${body}`);
  };

  return (
    <NotificationsContext.Provider 
      value={{ 
        notificationsEnabled, 
        toggleNotifications, 
        sendNotification,
        isLoading 
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
