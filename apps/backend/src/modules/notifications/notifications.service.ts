import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let expoInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ExpoClass: any = null;

const getExpo = async () => {
  if (!expoInstance) {
    // Dynamic import to bypass TypeScript's require() conversion
    // This safely loads the ESM module inside a CommonJS file
    const module = await Function('return import("expo-server-sdk")')();
    ExpoClass = module.Expo;
    expoInstance = new ExpoClass();
  }
  return { expo: expoInstance, Expo: ExpoClass };
};

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

    if (notification.user.expoPushToken) {
      const { expo, Expo } = await getExpo();
      if (Expo.isExpoPushToken(notification.user.expoPushToken)) {
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
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't break transactions if notification fails
  }
};
