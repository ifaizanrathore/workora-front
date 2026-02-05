'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// ============================================================
// Types
// ============================================================

export interface TaskActivity {
  type: string;
  taskId: string;
  userId: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

// ============================================================
// Socket Configuration
// ============================================================

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SOCKET_NAMESPACE = '/timer';

// ============================================================
// useSocket Hook
// ============================================================

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  // Get token from localStorage
  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }, []);

  // Connect to socket
  const connect = useCallback(() => {
    const token = getToken();

    if (!token) {
      setState((prev) => ({ ...prev, error: 'No auth token' }));
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    const socket = io(`${SOCKET_URL}${SOCKET_NAMESPACE}`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setState({ isConnected: true, isConnecting: false, error: null });
    });

    socket.on('connected', (data) => {
      console.log('[Socket] Server confirmed connection:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setState({ isConnected: false, isConnecting: false, error: error.message });
    });

    socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
      setState((prev) => ({ ...prev, error: error.message || 'Socket error' }));
    });

    socketRef.current = socket;
  }, [getToken]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({ isConnected: false, isConnecting: false, error: null });
    }
  }, []);

  // Subscribe to a task
  const subscribeToTask = useCallback((taskId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:task', { taskId }, (response: any) => {
        console.log('[Socket] Subscribed to task:', taskId, response);
      });
    }
  }, []);

  // Unsubscribe from a task
  const unsubscribeFromTask = useCallback((taskId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:task', { taskId });
    }
  }, []);

  // Subscribe to multiple tasks
  const subscribeToTasks = useCallback((taskIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:tasks', { taskIds }, (response: any) => {
        console.log('[Socket] Subscribed to tasks:', response);
      });
    }
  }, []);

  // Subscribe to a list
  const subscribeToList = useCallback((listId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:list', { listId }, (response: any) => {
        console.log('[Socket] Subscribed to list:', listId, response);
      });
    }
  }, []);

  // Listen for task activity
  const onTaskActivity = useCallback(
    (callback: (activity: TaskActivity) => void) => {
      if (socketRef.current) {
        socketRef.current.on('task:activity', callback);
        return () => {
          socketRef.current?.off('task:activity', callback);
        };
      }
      return () => {};
    },
    []
  );

  // Listen for any event
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => {
        socketRef.current?.off(event, callback);
      };
    }
    return () => {};
  }, []);

  // Emit an event
  const emit = useCallback((event: string, data?: any, callback?: (response: any) => void) => {
    if (socketRef.current?.connected) {
      if (callback) {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
    }
  }, []);

  // Get socket instance
  const getSocket = useCallback(() => socketRef.current, []);

  return {
    ...state,
    connect,
    disconnect,
    subscribeToTask,
    unsubscribeFromTask,
    subscribeToTasks,
    subscribeToList,
    onTaskActivity,
    on,
    emit,
    getSocket,
  };
}

// ============================================================
// useTaskSocket Hook - Convenience hook for task-specific socket
// ============================================================

export function useTaskSocket(taskId: string | null) {
  const socket = useSocket();
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const subscribedRef = useRef(false);

  // Connect and subscribe when taskId changes
  useEffect(() => {
    if (!taskId) return;

    // Connect if not connected
    if (!socket.isConnected && !socket.isConnecting) {
      socket.connect();
    }

    return () => {
      if (taskId && subscribedRef.current) {
        socket.unsubscribeFromTask(taskId);
        subscribedRef.current = false;
      }
    };
  }, [taskId, socket.isConnected, socket.isConnecting]);

  // Subscribe to task when connected
  useEffect(() => {
    if (socket.isConnected && taskId && !subscribedRef.current) {
      socket.subscribeToTask(taskId);
      subscribedRef.current = true;
    }
  }, [socket.isConnected, taskId, socket.subscribeToTask]);

  // Listen for task activities
  useEffect(() => {
    if (!socket.isConnected || !taskId) return;

    const unsubscribe = socket.onTaskActivity((activity) => {
      if (activity.taskId === taskId) {
        console.log('[Socket] Task activity received:', activity);
        setActivities((prev) => [activity, ...prev]);
      }
    });

    return unsubscribe;
  }, [socket.isConnected, taskId, socket.onTaskActivity]);

  return {
    ...socket,
    activities,
    clearActivities: () => setActivities([]),
  };
}

export default useSocket;
