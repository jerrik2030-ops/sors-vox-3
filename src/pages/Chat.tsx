import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Send, Phone, Video, VideoOff, X, Flag, UserPlus, StopCircle, CameraOff, Flame, Sparkles, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { socket } from '../lib/socket';
import { ReportModal } from '../components/ReportModal';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export function Chat() {
  const navigate = useNavigate();
  const { user, currentMatch, endMatch, selectedIcebreaker } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [targetReportMessage, setTargetReportMessage] = useState<Message | null>(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isRemoteVideoActive, setIsRemoteVideoActive] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!currentMatch || !user) {
      navigate('/');
      return;
    }

    // Socket Listeners for chat
    const onReceiveMessage = (data: { senderId: string, text: string }) => {
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        senderId: data.senderId,
        text: data.text,
        timestamp: new Date(),
      }]);
    };

    const onMatchEnded = () => {
      endMatch();
      navigate('/');
    };

    socket.on('receive_message', onReceiveMessage);
    socket.on('match_ended', onMatchEnded);

    // WebRTC Listeners
    socket.on('offer', async (offer) => {
      if (!peerConnectionRef.current) initPeerConnection();
      const pc = peerConnectionRef.current!;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', answer);
      setIsRemoteVideoActive(true);
    });

    socket.on('answer', async (answer) => {
      const pc = peerConnectionRef.current;
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice_candidate', async (candidate) => {
      const pc = peerConnectionRef.current;
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.off('receive_message', onReceiveMessage);
      socket.off('match_ended', onMatchEnded);
      socket.off('offer');
      socket.off('answer');
      socket.off('ice_candidate');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [currentMatch, user, navigate, endMatch]);

  const initPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      setIsRemoteVideoActive(true);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleVideo = async () => {
    if (isVideoActive) {
      // Turn off video
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      setIsVideoActive(false);
      
      // We would ideally tell the peer we stopped video
    } else {
      // Turn on video
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setIsVideoActive(true);

        const pc = peerConnectionRef.current || initPeerConnection();
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Wait, if we are the ones turning on video first, we need to create an offer
        // If we received an offer earlier, we are just answering (already handled but we need to add tracks and renegotiate)
        // Simplest: always create offer when toggling on
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', offer);

      } catch (err) {
        console.error("Error accessing media devices.", err);
        alert("Could not access camera/microphone. Please check permissions.");
      }
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  if (!currentMatch || !user) return null;

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages([...messages, newMsg]);
    socket.emit('send_message', inputText.trim());
    setInputText('');
  };

  const handleEndChat = () => {
    socket.emit('end_match');
    endMatch();
    navigate('/');
  };

  const handleOpenReport = (msg?: Message) => {
    setTargetReportMessage(msg || null);
    setIsReporting(true);
  };

  return (
    <div className="flex-1 flex flex-col w-full h-[calc(100vh-6rem)] bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden relative">
      
      {/* Report User for Moderation Modal */}
      <ReportModal
        isOpen={isReporting}
        onClose={() => {
          setIsReporting(false);
          setTargetReportMessage(null);
        }}
        currentUser={user}
        reportedUser={currentMatch.user}
        matchId={currentMatch.id}
        messages={messages}
        targetMessage={targetReportMessage}
        onReportComplete={(shouldDisconnect) => {
          setIsReporting(false);
          setTargetReportMessage(null);
          if (shouldDisconnect) {
            socket.emit('end_match');
            endMatch();
            navigate('/');
          }
        }}
      />

      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center font-bold text-neutral-500 text-lg border border-neutral-200">
            {currentMatch.user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight flex items-center space-x-2">
              <span>{currentMatch.user.username}</span>
              <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded text-neutral-500 border border-neutral-200">
                {currentMatch.user.country}
              </span>
            </h2>
            <div className="flex items-center text-sm text-neutral-500 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Online
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-full transition-colors hidden sm:flex">
            <Phone className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleVideo}
            className={cn(
              "p-2 rounded-full transition-colors hidden sm:flex",
              isVideoActive ? "text-white bg-black hover:bg-neutral-800" : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            )}
            title={isVideoActive ? "Turn off Video" : "Turn on Video"}
          >
            {isVideoActive ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          <div className="w-px h-6 bg-neutral-200 hidden sm:block"></div>
          
          {/* Report User Button */}
          <button 
            onClick={() => handleOpenReport()}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200/80 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs"
            title="Report User for Moderation"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Report User</span>
          </button>

          <button 
            onClick={handleEndChat}
            className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
            title="End Chat"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Video Call Overlay area when active */}
      {(isVideoActive || isRemoteVideoActive) && (
        <div className="flex-none bg-black h-48 sm:h-64 md:h-72 border-b border-neutral-200 flex p-4 gap-4 relative">
          {/* Remote User Video */}
          <div className="flex-1 bg-neutral-900 rounded-2xl overflow-hidden relative flex items-center justify-center border border-neutral-800">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className={cn("w-full h-full object-cover", !isRemoteVideoActive && "hidden")}
            />
            
            {!isRemoteVideoActive && (
              <div className="text-center absolute">
                <CameraOff className="w-12 h-12 text-neutral-600 mx-auto mb-2 opacity-50" />
                <p className="text-neutral-400 text-sm font-medium">Remote Camera Off</p>
                {currentMatch.user.id === 'ai-bot' && (
                  <p className="text-neutral-600 text-xs mt-1 max-w-[200px] leading-tight">AI cannot share video.</p>
                )}
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-white text-xs font-medium backdrop-blur-sm z-10">
              {currentMatch.user.username}
            </div>
          </div>
          
          {/* Local User Video */}
          <div className="w-1/3 sm:w-1/4 max-w-[200px] bg-neutral-800 rounded-2xl overflow-hidden relative border border-neutral-700 shadow-xl">
             <video 
               ref={localVideoRef} 
               autoPlay 
               playsInline 
               muted 
               className="w-full h-full object-cover transform -scale-x-100" 
             />
             <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-white text-xs font-medium backdrop-blur-sm">
              You
            </div>
          </div>
        </div>
      )}

      {/* Shared Interests & Match Compatibility Banner */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 bg-black text-white px-2.5 py-1 rounded-lg font-black text-[11px]">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentMatch.matchScore || 95}% MATCH</span>
          </span>
          {currentMatch.sharedInterests.length > 0 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
              <span className="font-semibold text-neutral-500 hidden sm:inline">Mutual topics:</span>
              {currentMatch.sharedInterests.map(interest => (
                <span key={interest} className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md font-bold text-neutral-800 shrink-0">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {(selectedIcebreaker || currentMatch.icebreaker) && messages.length <= 2 && (
          <button
            type="button"
            onClick={() => setInputText(selectedIcebreaker || currentMatch.icebreaker || '')}
            className="inline-flex items-center space-x-1.5 text-neutral-600 hover:text-black bg-white hover:bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-lg font-medium transition-colors ml-auto text-[11px]"
            title="Click to insert icebreaker into chat input"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate max-w-[200px] sm:max-w-[320px]">
              Prompt: "{selectedIcebreaker || currentMatch.icebreaker}"
            </span>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50">
        <div className="text-center">
          <span className="text-xs font-bold text-neutral-400 tracking-widest uppercase bg-neutral-100 px-3 py-1 rounded-full">
            Conversation Started
          </span>
        </div>
        
        {messages.map((msg) => {
          const isMe = msg.senderId === user.id;
          return (
            <div key={msg.id} className={cn("flex w-full group items-center", isMe ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[75%] px-5 py-3 rounded-2xl relative",
                isMe 
                  ? "bg-black text-white rounded-br-sm" 
                  : "bg-white text-black border border-neutral-200 rounded-bl-sm shadow-sm"
              )}>
                <p className="text-[15px] leading-relaxed">{msg.text}</p>
                <div className={cn("text-[10px] mt-1 text-right font-medium", isMe ? "text-neutral-400" : "text-neutral-400")}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {!isMe && (
                <button
                  type="button"
                  onClick={() => handleOpenReport(msg)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-2"
                  title="Flag this message for moderation"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Bar */}
      <div className="bg-white border-t border-neutral-200 p-4">
        <form onSubmit={handleSend} className="flex items-center space-x-3 max-w-4xl mx-auto">
          <button 
            type="button"
            className="p-3 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-xl transition-colors"
            title="Add Person"
          >
            <UserPlus className="w-5 h-5" />
          </button>
          
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-5 py-3 bg-neutral-100 rounded-full focus:outline-none focus:ring-2 focus:ring-black transition-shadow border-none"
          />
          
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-black text-white rounded-full hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
