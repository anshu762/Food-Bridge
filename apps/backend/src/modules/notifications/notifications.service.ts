import { PrismaClient } from '@prisma/client';
import { Expo } from 'expo-server-sdk';

const prisma = new PrismaClient();
const expo = new Expo();

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any,
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? data : undefined,
      },
      include: {
        user: { select: { expoPushToken: true } },
      },
    });

    if (notification.user.expoPushToken && Expo.isExpoPushToken(notification.user.expoPushToken)) {
      try {
        await expo.sendPushNotificationsAsync([
          {
            to: notification.user.expoPushToken,
            sound: 'default',
            title,
            body: message,
            data,
          },
        ]);
      } catch (pushError) {
        console.error('Expo push error:', pushError);
        // Do not throw, just log
      }
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't break transactions if notification fails
  }
};
