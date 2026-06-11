import { Client } from '@stomp/stompjs';

let stompClient: Client | null = null;

export const connectWebSocket = (token: string, onNotification: (data: any) => void) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
    const brokerUrl = apiBase.replace('/api/v1', '/ws').replace(/^http/, 'ws') + '/websocket';

    stompClient = new Client({
        brokerURL: brokerUrl,
        connectHeaders: { Authorization: `Bearer ${token}` },
        debug: (str) => console.log(str),
        reconnectDelay: 5000,
        onConnect: () => {
            console.log('Connected to WebSocket');

            // Subscribe vào queue riêng của user
            stompClient?.subscribe('/user/queue/notifications', (message) => {
                const notification = JSON.parse(message.body);
                onNotification(notification);
            });
        }
    });

    stompClient.activate();
    return stompClient;
};