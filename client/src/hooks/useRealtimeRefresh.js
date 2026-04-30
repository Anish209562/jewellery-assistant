import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

export default function useRealtimeRefresh(events, onRefresh) {
  const refreshRef = useRef(onRefresh);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const socket = getSocket();
    const handler = () => refreshRef.current();
    events.forEach(event => socket.on(event, handler));

    return () => {
      events.forEach(event => socket.off(event, handler));
    };
  }, [events]);
}
