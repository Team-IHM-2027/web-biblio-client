// services/websocket/websocketService.ts
class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Function[]> = new Map();
  private isConnected = false;

  constructor(private serverUrl: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.socket = new WebSocket(this.serverUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.triggerEvent('connected', {});
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.triggerEvent('disconnected', { code: event.code, reason: event.reason });
          
          // Attempt reconnection if not closed cleanly
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.triggerEvent('error', { error });
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(() => {
        // If connection fails, schedule another attempt
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });
    }, delay);
  }

  private handleMessage(data: any) {
    const { type, payload } = data;
    
    if (type && this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      handlers?.forEach(handler => handler(payload));
    }
    
    // Always trigger generic message event
    this.triggerEvent('message', { type, payload });
  }

  send(type: string, payload: any) {
    if (!this.isConnected || this.socket?.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message - WebSocket not connected');
      return false;
    }

    try {
      const message = JSON.stringify({ type, payload });
      this.socket?.send(message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  on(type: string, handler: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler);
  }

  off(type: string, handler?: Function) {
    if (!this.messageHandlers.has(type)) return;

    if (handler) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers?.indexOf(handler);
      if (index !== undefined && index !== -1) {
        handlers?.splice(index, 1);
      }
    } else {
      this.messageHandlers.delete(type);
    }
  }

  private triggerEvent(event: string, data: any) {
    const handlers = this.messageHandlers.get(event);
    handlers?.forEach(handler => handler(data));
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close(1000, 'Client disconnected');
      this.socket = null;
    }

    this.isConnected = false;
    this.messageHandlers.clear();
  }

  isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  // Reservation-specific methods
  requestReservation(userId: string, userEmail: string, userName: string, bookId: string, bookTitle: string) {
    this.send('reservation_request', {
      userId,
      userEmail,
      userName,
      bookId,
      bookTitle,
      timestamp: new Date().toISOString()
    });
  }

  respondToReservation(userId: string, decision: 'approved' | 'rejected', librarianName: string, reason?: string) {
    this.send('reservation_response', {
      userId,
      decision,
      librarianName,
      reason,
      timestamp: new Date().toISOString()
    });
  }
}

// Create singleton instance
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
export const websocketService = new WebSocketService(WS_URL);