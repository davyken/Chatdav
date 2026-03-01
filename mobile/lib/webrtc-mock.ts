// Mock WebRTC implementation for Expo Go
// This stub prevents the native module error while keeping the code structure

export const RTCPeerConnection = function(config: any) {
  return {
    close: () => {},
    addTrack: () => {},
    createOffer: async () => ({}),
    createAnswer: async () => ({}),
    setLocalDescription: async () => {},
    setRemoteDescription: async () => {},
    addIceCandidate: async () => {},
    ontrack: null,
    onicecandidate: null,
  };
};

export const RTCSessionDescription = function(description: any) {
  return description;
};

export const mediaDevices = {
  getUserMedia: async (constraints: any): Promise<MediaStream> => {
    console.log("WebRTC getUserMedia called (disabled for Expo Go)");
    return new MediaStream() as MediaStream;
  },
};

export const MediaStream = function() {
  return {
    getTracks: () => [],
  };
} as any;

export const RTCIceCandidate = function(candidate: any) {
  return candidate;
};
