import { ComponentPropsWithRef, forwardRef } from "react";
import ReactTextareaAutosize, { TextareaAutosizeProps } from "react-textarea-autosize";

export const TextArea = forwardRef(
	(props: TextareaAutosizeProps & ComponentPropsWithRef<"textarea">, ref: React.ForwardedRef<HTMLTextAreaElement>) => {
		return (
			<ReactTextareaAutosize
				{...props}
				ref={ref}
				className="h-64 w-full resize-none rounded-lg border border-slate-700 bg-slate-900 p-8 outline-indigo-800 focus:outline"
			/>
		);
	},
);
