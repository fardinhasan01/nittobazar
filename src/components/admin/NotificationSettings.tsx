import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Volume2, Smartphone } from 'lucide-react';
import type { AdminNotificationSettings } from '@/lib/adminNotificationSettings';

interface NotificationSettingsProps {
  settings: AdminNotificationSettings;
  onChange: (settings: AdminNotificationSettings) => void;
  onTest: () => void;
  fcmReady: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onChange,
  onTest,
  fcmReady,
}) => (
  <Card className="bg-white/80 backdrop-blur-lg border border-premium-200/30">
    <CardHeader>
      <CardTitle className="text-premium-800 flex items-center gap-2 text-lg">
        <Bell className="w-5 h-5 text-green-700" />
        Notification Settings
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between gap-4 min-h-12 py-1">
        <Label htmlFor="notif-enabled" className="text-gray-700 flex-1">
          Enable order notifications
        </Label>
        <Switch
          id="notif-enabled"
          checked={settings.enabled}
          onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
          className="shrink-0 scale-110"
        />
      </div>
      <div className="flex items-center justify-between gap-4 min-h-12 py-1">
        <Label htmlFor="notif-sound" className="text-gray-700 flex items-center gap-2 flex-1">
          <Volume2 className="w-4 h-4" />
          Sound
        </Label>
        <Switch
          id="notif-sound"
          checked={settings.sound}
          disabled={!settings.enabled}
          onCheckedChange={(sound) => onChange({ ...settings, sound })}
          className="shrink-0 scale-110"
        />
      </div>
      <div className="flex items-center justify-between gap-4 min-h-12 py-1">
        <Label htmlFor="notif-vibrate" className="text-gray-700 flex items-center gap-2 flex-1">
          <Smartphone className="w-4 h-4" />
          Vibration
        </Label>
        <Switch
          id="notif-vibrate"
          checked={settings.vibration}
          disabled={!settings.enabled}
          onCheckedChange={(vibration) => onChange({ ...settings, vibration })}
          className="shrink-0 scale-110"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full min-h-12 touch-manipulation border-green-300 text-green-800 hover:bg-green-50"
        onClick={onTest}
        disabled={!settings.enabled}
      >
        Send Test Notification
      </Button>
      <p className="text-xs text-gray-500">
        {fcmReady
          ? 'Push notifications are registered for this device.'
          : 'Web: allow notifications and set VITE_FIREBASE_VAPID_KEY. Android APK: add google-services.json from Firebase and VITE_NATIVE_PUSH_ENABLED=true. In-app order alerts always work on the dashboard.'}
      </p>
    </CardContent>
  </Card>
);

export default NotificationSettings;
