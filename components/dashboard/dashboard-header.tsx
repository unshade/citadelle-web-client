import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type DashboardHeaderProps = {
  userId: string;
  onLogout: () => void;
};

export function DashboardHeader({ userId, onLogout }: DashboardHeaderProps) {
  return (
    <header className="border-b border-white/10 backdrop-blur-md bg-black/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl ice-glass-deep flex items-center justify-center border border-white/10">
            <Shield className="w-5 h-5 text-blue-300/70" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-light tracking-wider text-white/90">
              CITADELLE
            </h1>
            <p className="text-xs text-blue-200/40 tracking-wider">
              Secure File Storage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-blue-200/50 tracking-wider px-3 py-1 rounded-full bg-white/5">
            User: {userId.slice(0, 8)}...
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-blue-200/60 hover:text-blue-200 hover:bg-white/5"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
