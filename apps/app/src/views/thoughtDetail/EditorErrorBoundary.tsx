import { FrownIcon, RefreshCwIcon } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";

import { Button } from "src/components/Button";

interface EditorErrorBoundaryProps {
	children: ReactNode;
}

interface EditorErrorBoundaryState {
	hasError: boolean;
}

export class EditorErrorBoundary extends Component<EditorErrorBoundaryProps, EditorErrorBoundaryState> {
	constructor(props: EditorErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(_: Error): EditorErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Editor error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex flex-col items-center justify-center h-full gap-4">
					<FrownIcon className="w-10 h-10 text-tertiary" />
					<div className="flex flex-col items-center gap-2">
						<p className="text-center">Oh no. Something went wrong here.</p>
						<p className="text-center text-sm text-secondary">
							We've been notified, contact support or dm @jennmueng on X if this persists.
						</p>
					</div>
					<Button
						onClick={() => {
							this.setState({ hasError: false });
							window.location.reload();
						}}>
						<RefreshCwIcon className="w-4 h-4" />
						<span>Refresh page</span>
					</Button>
				</div>
			);
		}

		return this.props.children;
	}
}
