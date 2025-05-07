import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { ExpoPushToken } from "expo-notifications";
import * as Notifications from 'expo-notifications';
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import * as Location from 'expo-location';
import React from "react";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const NotificationProvider = ({ children }: PropsWithChildren) => {
    const [expoPushToken, setExpoPushToken] = useState<ExpoPushToken>();
    const [notification, setNotification] = useState<Notifications.Notification>();
    const notificationListener = useRef<Notifications.EventSubscription>(null);
    const responseListener = useRef<Notifications.EventSubscription>(null);

    const { profile } = useAuth();

    const savePushToken = async (newToken: string | undefined) => {
        setExpoPushToken(newToken as unknown as ExpoPushToken);
        if (!newToken || !profile?.id) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ expo_push_token: newToken })
                .eq('id', profile.id);

            if (error) {
                console.error("Error saving push token:", error.message);
            } else {
                console.log("Push token saved successfully!");
            }
        } catch (err) {
            console.error("Error saving push token:", err);
        }
    };
        
    useEffect(() => {
        registerForPushNotificationsAsync().then((token) => savePushToken(token));

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("Notification response received:", response);
        });

        return () => {
            if (notificationListener.current) {
              notificationListener.current.remove(); 
            }
            if (responseListener.current) {
              responseListener.current.remove(); 
            }
          };
    }, []);

    

    console.log("Push token: ", expoPushToken);
    console.log("Notification: ", notification);

    return <>{children}</>;
};

export default NotificationProvider;