import { RocketIcon } from "lucide-react";
import { useEffect, useState } from "react";
import ConfettiExplosion from "react-confetti-explosion";
import { useSearchParams } from "react-router-dom";

import { Button } from "src/components/Button";
import { Dialog, DialogContent } from "src/components/Dialog";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

export const PaymentSuccessDialog: React.FC = () => {
	const [searchParams] = useSearchParams();
	const sessionId = searchParams.get("session_id");
	const [showDialog, setShowDialog] = useState(false);
	const { data: customerStatus, isLoading } = useCustomerStatus();

	useEffect(() => {
		if (sessionId && customerStatus?.customerStatus?.isActive) {
			setShowDialog(true);
		}
	}, [sessionId, customerStatus]);

	const handleClose = () => {
		setShowDialog(false);
		// Remove the session_id from the URL
		searchParams.delete("session_id");
		window.history.replaceState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
	};

	if (isLoading) {
		return null;
	}

	return (
		<Dialog open={showDialog} onOpenChange={handleClose}>
			<DialogContent
				insertBetween={
					<div className="fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center">
						<ConfettiExplosion force={0.8} duration={8000} particleCount={175} width={1600} />
					</div>
				}>
				<div className="flex flex-col items-center gap-4 p-6">
					<img src="/logo.png" className="w-16" alt="Cloudy Logo" />
					<h2 className="text-2xl font-bold text-primary">Thank You!</h2>
					<p className="text-center text-secondary">
						Your subscription is now active. We're excited to have you on board!
					</p>
					<Button onClick={handleClose} className="mt-4">
						<RocketIcon className="w-4 h-4" />
						<span>Get Started</span>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
