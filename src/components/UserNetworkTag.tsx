import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '../lib/useNetworkStatus';
import { cn } from '../lib/utils';

export interface UserNetworkTagProps {
  variant?: 'badge' | 'compact' | 'dot' | 'chip' | 'full';
  showWhenOnline?: boolean;
  className?: string;
  label?: string;
}

/**
 * Visual tag/badge showing user network connectivity (Online / Offline Network).
 */
export const UserNetworkTag: React.FC<UserNetworkTagProps> = ({
  variant = 'badge',
  showWhenOnline = false,
  className = '',
  label,
}) => {
  const { isOnline, isOffline } = useNetworkStatus();

  // If online and configured not to show when online in this view, return null
  if (isOnline && !showWhenOnline) {
    return null;
  }

  if (variant === 'dot') {
    return (
      <span
        className={cn(
          'relative flex h-3 w-3 rounded-full ring-2 ring-white flex-shrink-0',
          isOffline ? 'bg-rose-500' : 'bg-emerald-500',
          className
        )}
        title={isOffline ? 'Offline - Network Disconnected' : 'Online & Connected'}
      >
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        {isOffline && (
          <span className="absolute inset-0 flex items-center justify-center text-[7px] text-white font-bold">
            ✕
          </span>
        )}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-2xs transition-all',
          isOffline
            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          className
        )}
        title={isOffline ? 'User is not connected to the network' : 'User is connected to the network'}
      >
        {isOffline ? (
          <>
            <WifiOff className="h-3 w-3 text-rose-600 flex-shrink-0" />
            <span>{label || 'Offline'}</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span>{label || 'Online'}</span>
          </>
        )}
      </span>
    );
  }

  if (variant === 'chip') {
    return (
      <div
        className={cn(
          'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
          isOffline
            ? 'bg-rose-50/90 text-rose-800 border-rose-200 shadow-2xs'
            : 'bg-emerald-50/90 text-emerald-800 border-emerald-200',
          className
        )}
      >
        {isOffline ? (
          <>
            <WifiOff className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
            <span className="font-bold">{label || 'Offline Network'}</span>
          </>
        ) : (
          <>
            <Wifi className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{label || 'Network Connected'}</span>
          </>
        )}
      </div>
    );
  }

  // Default 'badge' or 'full'
  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs transition-all',
        isOffline
          ? 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-300/40'
          : 'bg-emerald-100 text-emerald-800 border-emerald-200',
        className
      )}
      title={isOffline ? 'Offline - Not connected to the network' : 'Online - Connected to workspace network'}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-3 w-3 text-rose-600 flex-shrink-0" />
          <span>{label || 'Offline Network'}</span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span>{label || 'Online'}</span>
        </>
      )}
    </span>
  );
};

/**
 * Top alert banner that appears across the top of the workspace when disconnected.
 */
export const OfflineNetworkBanner: React.FC = () => {
  const { isOffline, reconnect } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  if (!isOffline) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await reconnect();
    } finally {
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  return (
    <div 
      className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between z-40 transition-all animate-in slide-in-from-top-2 duration-200"
      role="alert"
    >
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <WifiOff className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex items-center space-x-2 min-w-0">
          <span className="px-2 py-0.5 rounded-md bg-rose-800/80 text-[10px] font-extrabold uppercase tracking-wider border border-rose-400/40 flex-shrink-0">
            Offline Network
          </span>
          <p className="truncate text-rose-50 text-[11px] sm:text-xs">
            You are currently working offline. Cached workspace data is available and actions will synchronize once reconnected.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRetry}
        disabled={isRetrying}
        className="ml-3 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1.5 flex-shrink-0 cursor-pointer disabled:opacity-60"
      >
        <RefreshCw className={cn('h-3 w-3', isRetrying && 'animate-spin')} />
        <span>{isRetrying ? 'Checking...' : 'Check Connection'}</span>
      </button>
    </div>
  );
};
