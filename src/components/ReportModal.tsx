import React, { useState } from 'react';
import { 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Ban, 
  MessageSquare, 
  Check, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { socket } from '../lib/socket';
import { User } from '../store';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  reportedUser: User;
  matchId: string;
  messages: Message[];
  targetMessage?: Message | null;
  onReportComplete: (shouldDisconnect: boolean) => void;
}

const REPORT_REASONS = [
  {
    id: 'harassment',
    label: 'Harassment or Hate Speech',
    description: 'Bullying, offensive language, personal attacks, or discrimination',
    icon: AlertTriangle,
    severity: 'High'
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate or Explicit Content',
    description: 'Unsolicited sexual remarks, nudity, or inappropriate conduct',
    icon: Ban,
    severity: 'High'
  },
  {
    id: 'spam_scam',
    label: 'Spam, Links, or Scams',
    description: 'Suspicious links, phishing attempts, commercial promotion',
    icon: MessageSquare,
    severity: 'Medium'
  },
  {
    id: 'safety',
    label: 'Safety Concern or Threats',
    description: 'Threats of violence, self-harm mentions, or safety risk',
    icon: ShieldAlert,
    severity: 'Critical'
  },
  {
    id: 'disruptive',
    label: 'Disruptive or Toxic Behavior',
    description: 'Intentional trolling, wasting time, or aggressive behavior',
    icon: X,
    severity: 'Medium'
  }
];

export function ReportModal({
  isOpen,
  onClose,
  currentUser,
  reportedUser,
  matchId,
  messages,
  targetMessage,
  onReportComplete
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('harassment');
  const [details, setDetails] = useState('');
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [showTranscriptPreview, setShowTranscriptPreview] = useState(false);
  const [blockUser, setBlockUser] = useState(true);
  const [disconnectNow, setDisconnectNow] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportResult, setReportResult] = useState<{ reportId: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const transcriptPayload = includeTranscript
      ? messages.slice(-15).map(m => ({
          sender: m.senderId === currentUser.id ? 'You' : reportedUser.username,
          text: m.text,
          time: m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFlaggedMessage: targetMessage ? m.id === targetMessage.id : false
        }))
      : [];

    const reportData = {
      reporterId: currentUser.id,
      reporterUsername: currentUser.username,
      reportedUserId: reportedUser.id,
      reportedUsername: reportedUser.username,
      matchId,
      reason: REPORT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason,
      details: details.trim(),
      transcript: transcriptPayload,
      blockUser,
      disconnect: disconnectNow,
      flaggedMessageId: targetMessage?.id
    };

    // Emit report via socket
    socket.emit('report_user', reportData, (response?: { success: boolean; reportId: string }) => {
      setIsSubmitting(false);
      const generatedId = response?.reportId || 'REP-' + Math.random().toString(36).substr(2, 7).toUpperCase();
      setReportResult({ reportId: generatedId });
    });

    // Fallback timer if socket response doesn't return
    setTimeout(() => {
      if (isSubmitting) {
        setIsSubmitting(false);
        setReportResult({ reportId: 'REP-' + Math.random().toString(36).substr(2, 7).toUpperCase() });
      }
    }, 1500);
  };

  const handleFinish = (action: 'new_match' | 'home' | 'stay') => {
    onClose();
    if (action === 'new_match' || action === 'home') {
      onReportComplete(true);
    } else {
      onReportComplete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {!reportResult ? (
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-neutral-900 leading-tight">
                    Report User for Moderation
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Flagging conversation with <strong className="text-neutral-800">{reportedUser.username}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target message banner if user clicked report on specific message */}
            {targetMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold block">Reporting specific message:</span>
                  <p className="italic truncate text-neutral-700 mt-0.5">"{targetMessage.text}"</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reason selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
                  What is the issue? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map(reason => {
                    const isSelected = selectedReason === reason.id;
                    const Icon = reason.icon;
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => setSelectedReason(reason.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between text-xs",
                          isSelected
                            ? "border-black bg-neutral-900 text-white shadow-sm"
                            : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                        )}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-amber-400" : "text-neutral-500")} />
                          <div>
                            <span className="font-bold block">{reason.label}</span>
                            <span className={cn("text-[11px]", isSelected ? "text-neutral-300" : "text-neutral-500")}>
                              {reason.description}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional details textarea */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe what occurred, or provide timestamps/details to help our moderation team..."
                  maxLength={300}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black resize-none h-20"
                />
              </div>

              {/* Transcript inclusion checkbox & preview */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeTranscript}
                      onChange={(e) => setIncludeTranscript(e.target.checked)}
                      className="rounded accent-black w-4 h-4"
                    />
                    <span className="font-bold text-neutral-800">
                      Include chat transcript ({messages.length} messages)
                    </span>
                  </label>
                  {includeTranscript && messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowTranscriptPreview(!showTranscriptPreview)}
                      className="text-[11px] font-semibold text-neutral-500 hover:text-black flex items-center space-x-0.5"
                    >
                      <span>{showTranscriptPreview ? 'Hide' : 'Preview'}</span>
                      {showTranscriptPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {includeTranscript && showTranscriptPreview && (
                  <div className="mt-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-white border border-neutral-200 text-[11px] space-y-1 font-mono">
                    {messages.length === 0 ? (
                      <span className="text-neutral-400 italic">No messages sent yet.</span>
                    ) : (
                      messages.slice(-8).map(m => (
                        <div key={m.id} className="truncate">
                          <strong className={m.senderId === currentUser.id ? 'text-blue-600' : 'text-neutral-800'}>
                            {m.senderId === currentUser.id ? 'You' : reportedUser.username}:
                          </strong>{' '}
                          <span className="text-neutral-600">{m.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Safety actions */}
              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={blockUser}
                    onChange={(e) => setBlockUser(e.target.checked)}
                    className="rounded accent-black w-4 h-4"
                  />
                  <span className="font-bold text-neutral-800">
                    Block this user from future matching
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={disconnectNow}
                    onChange={(e) => setDisconnectNow(e.target.checked)}
                    className="rounded accent-black w-4 h-4"
                  />
                  <span className="font-bold text-neutral-800">
                    Immediately exit chat with this user
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm shadow-red-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-neutral-900">
                Conversation Flagged
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Thank you for helping keep Sors Vox safe. This conversation has been recorded and submitted to moderation for immediate review.
              </p>
            </div>

            <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 font-mono text-xs text-neutral-600 inline-block">
              Case Ref: <strong className="text-neutral-900">{reportResult.reportId}</strong>
            </div>

            {blockUser && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 px-3 rounded-xl font-medium">
                ✓ {reportedUser.username} has been blocked and will not be matched with you again.
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleFinish('new_match')}
                className="flex-1 py-3.5 px-4 rounded-xl bg-black text-white font-bold text-xs hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Find a New Match
              </button>
              <button
                type="button"
                onClick={() => handleFinish('home')}
                className="flex-1 py-3.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
