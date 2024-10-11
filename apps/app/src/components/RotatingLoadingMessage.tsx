import { useEffect, useState } from "react";

const messages = [
	"Visiting your website...",
	"Reading through pages...",
	"Analyzing content...",
	"Understanding your mission...",
	"Identifying key topics...",
	"Preparing workspace details...",
];

export const RotatingLoadingMessage = () => {
	const [messageIndex, setMessageIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	return <span>{messages[messageIndex]}</span>;
};
