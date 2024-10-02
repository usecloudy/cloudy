import { ClipboardCheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Button, ButtonProps } from "./Button";

interface CopyButtonProps extends ButtonProps {
	textToCopy: string;
	copyText?: string;
	copiedText?: string;
}

export const CopyButton = ({ textToCopy, copyText = "Copy", copiedText = "Copied", ...buttonProps }: CopyButtonProps) => {
	const [isCopied, setIsCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(textToCopy);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	};

	return (
		<Button onClick={handleCopy} {...buttonProps}>
			{isCopied ? (
				<>
					<ClipboardCheckIcon className="size-4" />
					<span>{copiedText}</span>
				</>
			) : (
				<>
					<CopyIcon className="size-4" />
					<span>{copyText}</span>
				</>
			)}
		</Button>
	);
};
