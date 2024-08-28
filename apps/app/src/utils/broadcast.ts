import { ipcRenderer } from "electron";
import { useCallback, useEffect, useState } from "react";

interface BroadcastMessage {
	type: string;
	sentAt: Date;
	payload: any;
}

export function useBroadcast(messageType: string) {
	const [lastMessage, setLastMessage] = useState<any>(null);
	const [isListening, setIsListening] = useState(false);
	const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
	const [lastReceivedAt, setLastReceivedAt] = useState<Date | null>(null);

	useEffect(() => {
		const handleBroadcast = (event: Electron.IpcRendererEvent, message: BroadcastMessage) => {
			if (message.type === messageType) {
				setLastMessage(message.payload);
				setLastReceivedAt(new Date());
			}
		};

		ipcRenderer.on("broadcast", handleBroadcast);
		setIsListening(true);

		return () => {
			ipcRenderer.removeListener("broadcast", handleBroadcast);
			setIsListening(false);
		};
	}, [messageType]);

	const sendBroadcast = useCallback(
		(payload: any) => {
			const sentAt = new Date();
			const message: BroadcastMessage = {
				type: messageType,
				payload,
				sentAt,
			};
			ipcRenderer.send("broadcast", message);
			setLastSentAt(sentAt);
		},
		[messageType],
	);

	return {
		data: lastMessage,
		isListening,
		lastSentAt,
		lastReceivedAt,
		send: sendBroadcast,
	};
}
