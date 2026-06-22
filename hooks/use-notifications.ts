import { Client } from '@stomp/stompjs';
import { useEffect } from 'react';
import { useNotificationStore } from '@/features/notifications/utils/store';

export function useNotifications(active: boolean) {
    useEffect(() => {
        if (!active) return;

        let stompClient: Client | null = null;
        let isCurrent = true;

        async function initSocket() {
            try {
                // Fetch the WS token from our secure server route
                const res = await fetch('/api/auth/ws-token', {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!res.ok) {
                    throw new Error('Failed to fetch websocket token');
                }
                const data = await res.json();
                const token = data.accessToken;
                if (!token || !isCurrent) return;

                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
                const brokerURL = apiBase
                    .replace('/api/v1', '/ws')
                    .replace(/^https/, 'wss')   // https → wss (production)
                    .replace(/^http/, 'ws');    // http  → ws  (development)

                stompClient = new Client({
                    brokerURL,
                    connectHeaders: { Authorization: `Bearer ${token}` },
                    reconnectDelay: 5000,
                    onConnect: () => {
                        stompClient?.subscribe('/user/queue/notifications', (frame) => {
                            try {
                                const notification = JSON.parse(frame.body);

                                // Parse deep link từ data payload
                                const redirectUrl = (() => {
                                    try {
                                        if (notification.data) {
                                            const parsed = JSON.parse(notification.data);
                                            return parsed.redirect || undefined;
                                        }
                                    } catch { }
                                    return undefined;
                                })();

                                // Dispatch vào store
                                useNotificationStore.getState().addNotification({
                                    id: String(notification.id),
                                    title: notification.title,
                                    body: notification.body,
                                    createdAt: notification.createdAt || new Date().toISOString(),
                                    redirectUrl,
                                    type: notification.type,
                                    actions: redirectUrl
                                        ? [
                                            {
                                                id: 'redirect_action',
                                                label: 'Xem chi tiết',
                                                type: 'redirect' as const,
                                                style: 'primary' as const,
                                            },
                                        ]
                                        : undefined,
                                });
                            } catch (e) {
                                console.error('Failed to process incoming WebSocket notification:', e);
                            }
                        });
                    },
                    onStompError: (frame) => {
                        console.error('STOMP protocol error:', frame);
                    },
                    onWebSocketError: (event) => {
                        console.error('WebSocket connection error:', event);
                    },
                });

                stompClient.activate();
            } catch (err) {
                console.error('WebSocket connection initialization failed:', err);
            }
        }

        initSocket();

        return () => {
            isCurrent = false;
            if (stompClient) {
                stompClient.deactivate();
            }
        };
    }, [active]);
}
