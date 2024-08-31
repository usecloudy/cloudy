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
				<div className="absolute top-0 right-2 h-full flex items-center">
					<Button variant="ghost" size="icon-xs" className="text-secondary" onClick={closeToast}>
						<XIcon className="w-4 h-4" />
					</Button>
				</div>
			)}
			className="flex flex-col gap-2"
			toastClassName={props =>
				cn(
					// props?.defaultClassName,
					"relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer bg-background border border-border shadow-sm",
				)
			}
			bodyClassName={props =>
				cn(props?.defaultClassName, "text-sm text-primary font-sans block p-3 flex flex-row items-center")
			}
			progressClassName={props => cn(props?.defaultClassName, "bg-accent/40 h-[2px]")}
		/>
	);
};
