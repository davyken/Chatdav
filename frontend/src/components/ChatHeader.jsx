import { useSocketStore } from "../lib/socket";
import { VideoIcon, PhoneIcon, MicIcon, MicOffIcon, VideoOffIcon } from "lucide-react";
import { useRef, useEffect, useState } from "react";

export function ChatHeader({ participant, chatId }) {
  const { onlineUsers, typingUsers, call, acceptCall, rejectCall, endCall, startCall, localStream, remoteStream } = useSocketStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isOnline = onlineUsers.has(participant?._id);
  const typingUserId = typingUsers.get(chatId);
  const isTyping = typingUserId && typingUserId === participant?._id;

  const handleAudioCall = () => {
    console.log("Audio call clicked, participant:", participant);
    if (participant?._id) {
      console.log("Starting audio call to:", participant._id);
      startCall(participant._id, "audio", chatId);
    } else {
      console.warn("No participant ID available");
    }
  };

  const handleVideoCall = () => {
    console.log("Video call clicked, participant:", participant);
    if (participant?._id) {
      console.log("Starting video call to:", participant._id);
      startCall(participant._id, "video", chatId);
    } else {
      console.warn("No participant ID available");
    }
  };

  const handleAcceptCall = () => {
    acceptCall();
  };

  const handleRejectCall = () => {
    rejectCall();
  };

  const handleEndCall = () => {
    endCall();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="h-16 px-6 border-b border-base-300 flex items-center gap-4 bg-base-200/80">
      <div className="relative">
        <img src={participant?.avatar} className="w-10 h-10 rounded-full bg-base-300/40" alt="" />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-200" />
        )}
      </div>
      <div className="flex-1">
        <h2 className="font-semibold">{participant?.name}</h2>
        <p className="text-xs text-base-content/70">
          {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
        </p>
      </div>
      
      {/* Call Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAudioCall}
          className="btn btn-ghost btn-circle btn-sm"
          title={isOnline ? "Audio Call" : "User is offline - call will fail"}
          disabled={!participant?._id}
        >
          <PhoneIcon className={`w-5 h-5 ${isOnline ? "text-success" : "text-base-content/30"}`} />
        </button>
        <button
          onClick={handleVideoCall}
          className="btn btn-ghost btn-circle btn-sm"
          title={isOnline ? "Video Call" : "User is offline - call will fail"}
          disabled={!participant?._id}
        >
          <VideoIcon className={`w-5 h-5 ${isOnline ? "text-info" : "text-base-content/30"}`} />
        </button>
      </div>

      {/* Incoming Call Modal */}
      {call && call.isIncoming && !call.isAccepted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-2xl shadow-xl text-center">
            <img 
              src={call.caller?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} 
              className="w-16 h-16 rounded-full mx-auto mb-4" 
              alt="" 
            />
            <h3 className="text-lg font-semibold mb-2">
              {call.caller?.name} is calling
            </h3>
            <p className="text-sm text-base-content/70 mb-4">
              {call.type === "video" ? "Incoming Video Call" : "Incoming Audio Call"}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRejectCall}
                className="btn btn-error btn-circle btn-lg"
              >
                <PhoneIcon className="w-6 h-6 rotate-[135deg]" />
              </button>
              <button
                onClick={handleAcceptCall}
                className="btn btn-success btn-circle btn-lg"
              >
                <PhoneIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Modal */}
      {call && call.isAccepted && (
        <div className="fixed inset-0 bg-base-100 z-50 flex flex-col">
          {/* Remote Video - Full Screen */}
          <div className="flex-1 relative bg-base-200">
            {call.type === "video" ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <img 
                        src={participant?.avatar || call.caller?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} 
                        className="w-24 h-24 rounded-full mx-auto mb-4" 
                        alt="" 
                      />
                      <h3 className="text-xl font-semibold">
                        {participant?.name || call.caller?.name}
                      </h3>
                      <p className="text-sm text-base-content/70 mt-2">Connecting...</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <img 
                    src={participant?.avatar || call.caller?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} 
                    className="w-32 h-32 rounded-full mx-auto mb-4" 
                    alt="" 
                  />
                  <h3 className="text-xl font-semibold">
                    {participant?.name || call.caller?.name}
                  </h3>
                  <p className="text-sm text-base-content/70 mt-2">Audio Call • Connected</p>
                </div>
              </div>
            )}
            
            {/* Local Video - Picture in Picture */}
            {call.type === "video" && localStream && (
              <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden shadow-lg bg-base-300 border-2 border-base-100">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Call Info Badge */}
            <div className="absolute top-4 left-4 bg-base-100/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow">
              <p className="font-semibold">{participant?.name || call.caller?.name}</p>
              <p className="text-xs text-base-content/70">
                {call.type === "video" ? "Video Call" : "Audio Call"} • Connected
              </p>
            </div>
          </div>

          {/* Call Controls */}
          <div className="p-8 flex justify-center gap-6 bg-base-100">
            <button
              onClick={toggleMute}
              className={`btn btn-circle btn-lg ${isMuted ? "btn-error" : "btn-ghost"}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
            </button>
            {call.type === "video" && (
              <button
                onClick={toggleVideo}
                className={`btn btn-circle btn-lg ${isVideoOff ? "btn-error" : "btn-ghost"}`}
                title={isVideoOff ? "Turn on video" : "Turn off video"}
              >
                {isVideoOff ? <VideoOffIcon className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
              </button>
            )}
            <button
              onClick={handleEndCall}
              className="btn btn-error btn-circle btn-lg"
              title="End Call"
            >
              <PhoneIcon className="w-6 h-6 rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}

      {/* Outgoing Call Modal */}
      {call && !call.isIncoming && !call.isAccepted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-2xl shadow-xl text-center">
            <img 
              src={participant?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} 
              className="w-16 h-16 rounded-full mx-auto mb-4 animate-pulse" 
              alt="" 
            />
            <h3 className="text-lg font-semibold mb-2">
              Calling {participant?.name}...
            </h3>
            <p className="text-sm text-base-content/70 mb-4">
              {call.type === "video" ? "Video Call" : "Audio Call"}
            </p>
            <button
              onClick={handleEndCall}
              className="btn btn-error btn-circle btn-lg"
            >
              <PhoneIcon className="w-6 h-6 rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
