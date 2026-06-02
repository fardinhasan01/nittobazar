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
        <Bell className="w-5 h-5 text-orange-600" />
        Notification Settings
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="notif-enabled" className="text-gray-700">
          Enable order notifications
        </Label>
        <Switch
          id="notif-enabled"
          checked={settings.enabled}
          onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="notif-sound" className="text-gray-700 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Sound
        </Label>
        <Switch
          id="notif-sound"
          checked={settings.sound}
          disabled={!settings.enabled}
          onCheckedChange={(sound) => onChange({ ...settings, sound })}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="notif-vibrate" className="text-gray-700 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Vibration
        </Label>
        <Switch
          id="notif-vibrate"
          checked={settings.vibration}
          disabled={!settings.enabled}
          onCheckedChange={(vibration) => onChange({ ...settings, vibration })}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
        onClick={onTest}
        disabled={!settings.enabled}
      >
        Send Test Notification
      </Button>
      <p className="text-xs text-gray-500">
        {fcmReady
          ? 'Push notifications are registered for this device.'
          : 'Allow notifications in your browser and set VITE_FIREBASE_VAPID_KEY to enable push when the app is closed.'}
      </p>
    </CardContent>
  </Card>
);

export default NotificationSettings;
