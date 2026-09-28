import React, { useState } from 'react';
import { EventLogItem, TelemetryPoint } from '../types/fsoc';
import {
  ListFilter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Radio,
  Clock,
  Shield,
} from 'lucide-react';

interface EventReviewProps {
  events: EventLogItem[];
  history: TelemetryPoint[];
}

export const EventReview: React.FC<EventReviewProps> = ({ events }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = events.filter((evt) => {
    const matchesSev = filterSeverity === 'all' || evt.severity === filterSeverity;
    const matchesQuery =
      evt.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesQuery;
  });

  const getEventIcon = (type: EventLogItem['type']) => {
    switch (type) {
      case 'LOCK_ACQUIRED':
      case 'REACQUIRED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'LOCK_LOST':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'OCCLUDED':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'DECOY_REJECTED':
        return <Shield className="w-4 h-4 text-orange-600" />;
      case 'TARGET_DETECTED':
      case 'ID_VERIFIED':
        return <Radio className="w-4 h-4 text-cyan-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ListFilter className="w-4 h-4 text-cyan-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            State Transition & Diagnostic Event Log
          </h2>
          <span className="bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
            {filteredEvents.length} Events
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search event history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded pl-8 pr-3 py-1 text-xs focus:border-cyan-500 font-medium"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-50 text-slate-800 border border-slate-300 rounded px-2 py-1 text-xs font-medium"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Events List Timeline */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 max-h-[500px] overflow-y-auto space-y-2 shadow-sm">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No diagnostic events matching filter criteria.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className={`p-3 rounded border flex items-start gap-3 text-xs font-mono transition ${
                evt.severity === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : evt.severity === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : evt.severity === 'error'
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="mt-0.5 shrink-0">{getEventIcon(evt.type)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{evt.type}</span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> T = {evt.time.toFixed(2)}s
                  </span>
                </div>
                <div className="text-slate-700 font-sans text-xs font-medium">{evt.message}</div>
                {evt.details && (
                  <div className="text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 mt-1 flex flex-wrap gap-3">
                    {Object.entries(evt.details).map(([k, v]) => (
                      <span key={k}>
                        {k}: <strong className="text-cyan-700">{String(v)}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
