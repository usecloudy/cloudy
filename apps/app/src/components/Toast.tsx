import { XIcon } from "lucide-react";
import { ToastContainer as BaseToastContainer, Bounce } from "react-toastify";

import { cn } from "src/utils";

import { Button } from "./Button";

export const ToastContainer = () => {
	return (
		<BaseToastContainer
			position="bottom-center"
			autoClose={6000}
			hideProgressBar={false}
			newestOnTop
			closeOnClick
			rtl={false}
			pauseOnFocusLoss
			draggable
			pauseOnHover
			transition={Bounce}
			icon={false}
			closeButton={({ closeToast }) => (
				<div className="absolute right-2 top-0 flex h-full items-center">
					<Button variant="ghost" size="icon-xs" className="text-secondary" onClick={closeToast}>
						<XIcon className="h-4 w-4" />
					</Button>
				</div>
			)}
			className="flex flex-col gap-2"
			toastClassName={props =>
				cn(
					// props?.defaultClassName,
					"relative flex min-h-10 cursor-pointer justify-between overflow-hidden rounded-md border border-border bg-background p-1 shadow-sm",
				)
			}
			bodyClassName={props =>
				cn(props?.defaultClassName, "block flex flex-row items-center p-3 font-sans text-sm text-primary")
			}
			progressClassName={props => cn(props?.defaultClassName, "h-[2px] bg-accent/40")}
		/>
	);
};
