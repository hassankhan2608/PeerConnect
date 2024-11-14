import { create } from 'zustand';
import { DataConnection, Peer, MediaConnection } from 'peerjs';

interface ChatState {
  username: string;
  peerId: string;
  peer: Peer | null;
  connections: Map<string, ConnectionInfo>;
  messages: Map<string, Message[]>;
  activeChat: string | null;
  connectionStatus: Map<string, ConnectionStatus>;
  typingStatus: Map<string, boolean>;
  unreadCounts: Map<string, number>;
  callStatus: Map<string, CallStatus>;
  activeCall: string | null;
  activeVideoCall: string | null;
  incomingCall: IncomingCall | null;
  incomingVideoCall: IncomingCall | null;
  mediaConnection: MediaConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  setUsername: (username: string) => void;
  setPeerId: (peerId: string) => void;
  setPeer: (peer: Peer) => void;
  addConnection: (peerId: string, info: ConnectionInfo) => void;
  removeConnection: (peerId: string) => void;
  addMessage: (peerId: string, message: Message) => void;
  setActiveChat: (peerId: string | null) => void;
  updateConnectionStatus: (peerId: string, status: ConnectionStatus) => void;
  setTypingStatus: (peerId: string, isTyping: boolean) => void;
  incrementUnread: (peerId: string) => void;
  clearUnread: (peerId: string) => void;
  setCallStatus: (peerId: string, status: CallStatus) => void;
  setActiveCall: (peerId: string | null) => void;
  setActiveVideoCall: (peerId: string | null) => void;
  setIncomingCall: (call: IncomingCall | null) => void;
  setIncomingVideoCall: (call: IncomingCall | null) => void;
  setMediaConnection: (connection: MediaConnection | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
}

export interface ConnectionInfo {
  connection: DataConnection;
  username: string;
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
}

export interface IncomingCall {
  peerId: string;
  call: MediaConnection;
}

export type ConnectionStatus = 'connected' | 'disconnected';
export type CallStatus = 'none' | 'ringing' | 'ongoing' | 'ended';

export const useChatStore = create<ChatState>((set) => ({
  username: '',
  peerId: '',
  peer: null,
  connections: new Map(),
  messages: new Map(),
  activeChat: null,
  connectionStatus: new Map(),
  typingStatus: new Map(),
  unreadCounts: new Map(),
  callStatus: new Map(),
  activeCall: null,
  activeVideoCall: null,
  incomingCall: null,
  incomingVideoCall: null,
  mediaConnection: null,
  localStream: null,
  remoteStream: null,
  setUsername: (username) => set({ username }),
  setPeerId: (peerId) => set({ peerId }),
  setPeer: (peer) => set({ peer }),
  addConnection: (peerId, info) =>
    set((state) => ({
      connections: new Map(state.connections).set(peerId, info),
      connectionStatus: new Map(state.connectionStatus).set(peerId, 'connected'),
    })),
  removeConnection: (peerId) =>
    set((state) => {
      const newConnections = new Map(state.connections);
      newConnections.delete(peerId);
      return { 
        connections: newConnections,
        connectionStatus: new Map(state.connectionStatus).set(peerId, 'disconnected'),
      };
    }),
  addMessage: (peerId, message) =>
    set((state) => {
      const newMessages = new Map(state.messages);
      const peerMessages = newMessages.get(peerId) || [];
      newMessages.set(peerId, [...peerMessages, message]);
      return { messages: newMessages };
    }),
  setActiveChat: (peerId) => set({ activeChat: peerId }),
  updateConnectionStatus: (peerId, status) =>
    set((state) => ({
      connectionStatus: new Map(state.connectionStatus).set(peerId, status),
    })),
  setTypingStatus: (peerId, isTyping) =>
    set((state) => ({
      typingStatus: new Map(state.typingStatus).set(peerId, isTyping),
    })),
  incrementUnread: (peerId) =>
    set((state) => ({
      unreadCounts: new Map(state.unreadCounts).set(
        peerId,
        (state.unreadCounts.get(peerId) || 0) + 1
      ),
    })),
  clearUnread: (peerId) =>
    set((state) => {
      const newUnreadCounts = new Map(state.unreadCounts);
      newUnreadCounts.delete(peerId);
      return { unreadCounts: newUnreadCounts };
    }),
  setCallStatus: (peerId, status) =>
    set((state) => ({
      callStatus: new Map(state.callStatus).set(peerId, status),
    })),
  setActiveCall: (peerId) => set({ activeCall: peerId }),
  setActiveVideoCall: (peerId) => set({ activeVideoCall: peerId }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  setIncomingVideoCall: (call) => set({ incomingVideoCall: call }),
  setMediaConnection: (connection) => set({ mediaConnection: connection }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
}));