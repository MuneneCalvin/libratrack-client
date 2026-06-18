import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui.store';

export default function NotificationBell() {
  const { notificationCount } = useUIStore();
  const navigate = useNavigate();

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')} aria-label="Open notifications">
      <Bell size={18} />
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {notificationCount > 9 ? '9+' : notificationCount}
        </span>
      )}
    </Button>
  );
}
