/**
 * SettingsPage — platform-level settings for super admin.
 */

import { useState } from 'react';
import { Settings, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export function SettingsPage() {
  const [platformName, setPlatformName] = useState('StudyLib ERP');
  const [supportEmail, setSupportEmail] = useState('support@studylib.com');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Platform settings saved successfully!');
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-500" />
          Platform Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Global application configurations and defaults.
        </p>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-6">
        <div className="space-y-4">
          <Input
            label="Platform Name"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            required
          />
          <Input
            label="Support Email"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            required
          />

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-border focus:ring-amber-500"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Allow New Library Registrations</p>
                <p className="text-xs text-muted-foreground">
                  When enabled, public signup/request access forms remain active.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button type="submit" loading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
