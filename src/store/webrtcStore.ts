import { create } from 'zustand';
import { sendFileInChunks } from '../service/dataChannel'; // Assuming this path is correct
import { handleIncomingFileChunk } from '../service/fileReceiver'; // Assuming this path is correct

// For demonstration, I'll add a dummy createPeerConnection function.
const createPeerConnection = () => new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

import type { User } from './authStore';

// Define the new types for file transfer handlers
type FileSendProgressHandler = (fileName: string, progress: number, bytesSent: number, totalBytes: number) => void;
type FileReceiveProgressHandler = (fileName: string, progress: number) => void;
type FileCompleteHandler = (blob: Blob, name: string, type: string) => void;

interface WebRTCState {
  // Connection state
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  socket: WebSocket | null;
  isSocketOpen: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  isCaller: boolean;
  isProcessingOffer: boolean;
  
  // User and room info
  roomName: string | null;
  user: User | null;
  peer: User | null;
  
  // Error handling
  error: string | null;
  
  // File transfer handlers (updated)
  onFileSendProgress: FileSendProgressHandler | null;
  onFileReceiveProgress: FileReceiveProgressHandler | null;
  onFileComplete: FileCompleteHandler | null;
  
  // Internal state for queueing early ICE candidates
  _iceCandidateQueue: RTCIceCandidateInit[];
  
  // Public methods
  initialize: (roomName: string, user: User, isCaller?: boolean) => void;
  sendOffer: () => Promise<void>;
  disconnect: () => void;
  sendFile: (file: File, onProgress: FileSendProgressHandler) => Promise<void>; // Updated signature to return Promise
  setFileSendProgressHandler: (handler: FileSendProgressHandler) => void;
  setFileReceiveProgressHandler: (handler: FileReceiveProgressHandler) => void;
  setFileCompleteHandler: (handler: FileCompleteHandler) => void;
  
  // Internal methods
  _setupDataChannel: (channel: RTCDataChannel) => void;
  _handleDataChannel: (event: RTCDataChannelEvent) => void;
  _handleOffer: (message: any) => Promise<void>;
  _handleAnswer: (message: any) => Promise<void>;
  _handleICECandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  _cleanup: () => void;
}

const useWebRTCStore = create<WebRTCState>((set, get) => ({
  // Initial state
  socket: null,
  peerConnection: null,
  dataChannel: null,
  roomName: null,
  user: null,
  peer: null,
  isConnecting: false,
  isConnected: false,
  isCaller: false,
  isSocketOpen: false,
  isProcessingOffer: false,
  error: null,
  onFileSendProgress: null,
  onFileReceiveProgress: null,
  onFileComplete: null,
  _iceCandidateQueue: [], // Initialize the queue

  // Initialize WebRTC connection
  initialize: (roomName: string, user: User, isCaller = false) => {
    console.log('[WebRTC] Initializing connection...', { roomName, user, isCaller });
    const { _cleanup } = get();
    
    _cleanup();
    
    set({
      roomName,
      user,
      isCaller,
      isConnecting: true,
      isConnected: false,
      error: null,
      isSocketOpen: false,
      _iceCandidateQueue: [], // Ensure queue is reset on new connection
    });

    try {
      const socket = new WebSocket('wss://shuttlr.onrender.com');
      const peerConnection = createPeerConnection();
      
      set({ peerConnection, socket });
      
      socket.onopen = () => {
        console.log('[WebRTC] WebSocket connected');
        set({ isSocketOpen: true });
        socket.send(JSON.stringify({ type: 'join', room: roomName, user: user.id, isCaller }));
      };
      
      socket.onclose = () => {
        console.log('[WebRTC] WebSocket disconnected');
        set({ isSocketOpen: false, isConnected: false });
      };
      
      socket.onerror = (error) => {
        console.error('[WebRTC] WebSocket error:', error);
        set({ error: 'WebSocket connection error', isConnecting: false });
      };
      
      socket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebRTC] Received message:', message);
          
          switch (message.type) {
            case 'offer': await get()._handleOffer(message); break;
            case 'answer': await get()._handleAnswer(message); break;
            case 'ice-candidate': await get()._handleICECandidate(message.candidate); break;
            case 'user-joined':
              set({ peer: message.user });
              if (get().isCaller) {
                console.log('[WebRTC] Peer joined, sending offer as caller');
                setTimeout(() => get().sendOffer(), 100);
              }
              break;
            case 'user-left':
              set({ peer: null, isConnected: false });
              get()._cleanup();
              break;
            case 'room-full':
              set({ error: 'Room is full', isConnecting: false });
              break;
          }
        } catch (error) {
          console.error('[WebRTC] Error handling message:', error);
        }
      };
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && get().socket?.readyState === WebSocket.OPEN) {
          console.log('[WebRTC] Sending ICE candidate');
          get().socket?.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            room: get().roomName
          }));
        }
      };
      
      peerConnection.ondatachannel = (event) => {
        console.log('[WebRTC] Data channel received');
        get()._handleDataChannel(event);
      };
      
      peerConnection.onconnectionstatechange = () => {
        const state = get().peerConnection?.connectionState;
        console.log('[WebRTC] Connection state:', state);
        if (state === 'connected') {
          set({ isConnected: true, isConnecting: false, error: null });
        } else if (['disconnected', 'failed', 'closed'].includes(state || '')) {
          set({ isConnected: false, isConnecting: false });
          if (state === 'failed') set({ error: 'Connection failed' });
        }
      };
      
      peerConnection.oniceconnectionstatechange = () => {
        const state = get().peerConnection?.iceConnectionState;
        console.log('[WebRTC] ICE connection state:', state);
        if (state === 'failed') set({ error: 'ICE connection failed' });
      };
      
    } catch (error) {
      console.error('[WebRTC] Error initializing connection:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to initialize WebRTC', isConnecting: false });
      get()._cleanup();
    }
  },
  
  _handleOffer: async (message: any) => {
    const { peerConnection, socket, roomName, _iceCandidateQueue } = get();
    if (!peerConnection || !socket || !roomName) return;

    if (peerConnection.signalingState !== 'stable') {
      console.warn('[WebRTC] Ignoring incoming offer due to non-stable signaling state:', peerConnection.signalingState);
      return;
    }
    
    try {
      set({ isProcessingOffer: true });
      console.log('[WebRTC] Handling offer');
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.send(JSON.stringify({ type: 'answer', sdp: answer, room: roomName }));

      _iceCandidateQueue.forEach(candidate => peerConnection.addIceCandidate(candidate));
      set({ _iceCandidateQueue: [] });
      
    } catch (error) {
      console.error('[WebRTC] Error handling offer:', error);
      set({ error: 'Failed to handle offer' });
    } finally {
      set({ isProcessingOffer: false });
    }
  },
  
  _handleAnswer: async (message: any) => {
    const { peerConnection, _iceCandidateQueue } = get();
    if (!peerConnection) return;

    if (peerConnection.signalingState !== 'have-local-offer') {
        console.error('[WebRTC] Received answer in wrong state:', peerConnection.signalingState);
        return;
    }
    
    try {
      console.log('[WebRTC] Handling answer');
      await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));

      _iceCandidateQueue.forEach(candidate => peerConnection.addIceCandidate(candidate));
      set({ _iceCandidateQueue: [] }); // Clear the queue
      
    } catch (error) {
      console.error('[WebRTC] Error handling answer:', error);
      set({ error: 'Failed to handle answer' });
    }
  },
  
  _handleICECandidate: async (candidate: RTCIceCandidateInit) => {
    const { peerConnection } = get();
    if (!peerConnection || !candidate) return;
    
    try {
      if (!peerConnection.remoteDescription) {
          console.log('[WebRTC] Queuing ICE candidate until remote description is set.');
          set(state => ({ _iceCandidateQueue: [...state._iceCandidateQueue, candidate] }));
          return;
      }
      console.log('[WebRTC] Adding ICE candidate immediately.');
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.warn('[WebRTC] Error adding ICE candidate:', error);
    }
  },
  
  sendOffer: async () => {
    const { peerConnection, socket, roomName, isCaller } = get();
    if (!peerConnection || !socket || !roomName) return;
    
    try {
      console.log('[WebRTC] Sending offer');
      
      if (isCaller && !get().dataChannel) {
        console.log('[WebRTC] Creating data channel as caller');
        const dataChannel = peerConnection.createDataChannel('fileTransfer');
        get()._setupDataChannel(dataChannel);
      }
      
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket.send(JSON.stringify({ type: 'offer', sdp: offer, room: roomName }));
      
    } catch (error) {
      console.error('[WebRTC] Error sending offer:', error);
      set({ error: 'Failed to send offer' });
    }
  },
  
  // Updated method to initiate file sending using the dataChannel.ts utility
  sendFile: (file: File, onProgress: FileSendProgressHandler): Promise<void> => {
    return new Promise((resolve, reject) => {
      const { dataChannel } = get();
      if (dataChannel && dataChannel.readyState === 'open') {
        // Create a wrapper function to convert the progress callback signature
        const progressWrapper = (progress: number) => {
          onProgress(file.name, progress, Math.floor((progress / 100) * file.size), file.size);
        };
        
        sendFileInChunks(
          file,
          dataChannel,
          progressWrapper, // Pass the wrapped progress callback
          () => {
            console.log(`[WebRTC Store] File "${file.name}" sent successfully.`);
            resolve(); // Resolve the promise on completion
          },
          (error) => {
            console.error(`[WebRTC Store] Error sending file "${file.name}":`, error);
            set({ error: `Error sending file: ${file.name}. ${error.message}` });
            reject(error); // Reject the promise on error
          }
        );
      } else {
        const error = new Error('Data channel is not open or ready');
        console.error(`[WebRTC Store] ${error.message}`);
        set({ error: error.message });
        reject(error);
      }
    });
  },
  
  // Updated handler setters
  setFileSendProgressHandler: (handler: FileSendProgressHandler) => {
    set({ onFileSendProgress: handler });
  },
  setFileReceiveProgressHandler: (handler: FileReceiveProgressHandler) => {
    set({ onFileReceiveProgress: handler });
  },
  setFileCompleteHandler: (handler: FileCompleteHandler) => {
    set({ onFileComplete: handler });
  },
  
  _setupDataChannel: (channel: RTCDataChannel) => {
    console.log('[WebRTC] Setting up data channel');
    
    // Set up event handlers first
    channel.onopen = () => {
      console.log('[WebRTC] Data channel opened');
      set({ dataChannel: channel });
    };
    
    channel.onclose = () => {
      console.log('[WebRTC] Data channel closed');
      // Only clear data channel if it's the current one
      const currentState = get();
      if (currentState.dataChannel === channel) {
        set({ dataChannel: null });
      }
    };
    
    channel.onerror = (error) => {
      // Only log the error if it's not a closure error
      if (error.type !== 'error' || !error.error?.message?.includes('User-Initiated Abort')) {
        console.error('[WebRTC] Data channel error:', error);
        set({ error: 'Data channel error: ' + (error.error?.message || 'Unknown error') });
      }
    };
    
    // Use the handleIncomingFileChunk from fileReceiver.ts
    channel.onmessage = (event) => {
      try {
        const { onFileReceiveProgress, onFileComplete } = get();
        handleIncomingFileChunk(
          event,
          (fileName, progress) => {
            if (onFileReceiveProgress) onFileReceiveProgress(fileName, progress);
          },
          (blob, name, type) => {
            if (onFileComplete) onFileComplete(blob, name, type);
          }
        );
      } catch (error) {
        console.error('[WebRTC] Error handling incoming message:', error);
      }
    };
    
    // Only set the data channel if it's not already set or if it's a new instance
    set((state) => ({
      dataChannel: state.dataChannel?.readyState !== 'open' ? channel : state.dataChannel
    }));
  },
  
  _handleDataChannel: (event: RTCDataChannelEvent) => {
    console.log('[WebRTC] New data channel received');
    get()._setupDataChannel(event.channel);
  },
  
  disconnect: () => {
    console.log('[WebRTC] Disconnecting...');
    get()._cleanup();
  },
  
  _cleanup: () => {
    const { socket, peerConnection, dataChannel } = get();
    
    // Clean up data channel first
    if (dataChannel) {
      try {
        // Remove all event listeners to prevent memory leaks
        dataChannel.onopen = null;
        dataChannel.onclose = null;
        dataChannel.onerror = null;
        dataChannel.onmessage = null;
        
        // Only close if not already closed or closing
        if (dataChannel.readyState !== 'closed' && dataChannel.readyState !== 'closing') {
          dataChannel.close();
        }
      } catch (e) {
        console.error('[WebRTC] Error cleaning up data channel:', e);
      }
    }
    
    // Clean up peer connection
    if (peerConnection) {
      try {
        // Remove all event listeners
        peerConnection.ondatachannel = null;
        peerConnection.onicecandidate = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onsignalingstatechange = null;
        peerConnection.onicegatheringstatechange = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.onnegotiationneeded = null;
        
        // Close all transceivers
        peerConnection.getTransceivers().forEach(transceiver => {
          try { transceiver.stop && transceiver.stop(); } catch (e) {}
        });
        
        // Close the connection
        peerConnection.close();
      } catch (e) {
        console.error('[WebRTC] Error closing peer connection:', e);
      }
    }
    
    // Clean up WebSocket
    if (socket) {
      try {
        socket.onopen = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      } catch (e) {
        console.error('[WebRTC] Error closing WebSocket:', e);
      }
    }
    
    // Reset state
    set({
      socket: null,
      peerConnection: null,
      dataChannel: null,
      isConnected: false,
      isConnecting: false,
      isSocketOpen: false,
      isProcessingOffer: false,
      error: null,
      roomName: null,
      user: null,
      peer: null,
      isCaller: false,
      _iceCandidateQueue: [],
      onFileSendProgress: null,
      onFileReceiveProgress: null,
      onFileComplete: null
    });
  }
}));

export default useWebRTCStore;
