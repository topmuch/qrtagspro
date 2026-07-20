/**
 * Web Push configuration — VAPID keys for push notifications
 *
 * These keys are generated once and must be stable across deployments.
 * In production, store them as environment variables.
 */

import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BLCdjsHac0NGNGMdS8w_w8CYEbxkdsm5k4RMWwAc8iz6UurqwLxYu1XZvbUxvCwiIWAonAYYkNz45r1ov2dOhb0';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '9J8fPpwYlBSmE0eX0aGzBli-2wqjhj1grl6DP92qytQ';

// Configure web-push with VAPID details
webpush.setVapidDetails(
  'mailto:contact@qrtags.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export { VAPID_PUBLIC_KEY, webpush };

export interface PushSubscriptionData {
  reference: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

/**
 * Send a push notification to a subscriber.
 * Subscriptions are stored in /app/data/push-subscriptions.json
 */
export async function sendPushNotification(
  reference: string,
  title: string,
  body: string,
  url: string = '/'
): Promise<void> {
  try {
    const fs = await import('fs');
    const path = await import('path');

    const subFile = path.join(process.env.DATABASE_URL?.replace('file:', '').replace(/[^/]+$/, '') || '/app/data/', 'push-subscriptions.json');

    if (!fs.existsSync(subFile)) return;

    const subs: PushSubscriptionData[] = JSON.parse(fs.readFileSync(subFile, 'utf-8'));
    const matching = subs.filter(s => s.reference === reference);

    if (matching.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      url,
      tag: `qrtags-${reference}`,
    });

    for (const sub of matching) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
      } catch (err) {
        console.error('[push] Failed to send to', sub.subscription.endpoint, err);
        // Remove invalid subscription
      }
    }
  } catch (error) {
    console.error('[push] Error sending notification:', error);
  }
}
