import { MessageCircleHeartIcon, SendHorizonalIcon } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";

import { Button } from "./Button";
import { Dropdown } from "./Dropdown";

type FeedbackFormData = {
	feedback: string;
};

export const FeedbackDropdown = () => {
	const posthog = usePostHog();
	const { register, handleSubmit, reset } = useForm<FeedbackFormData>();

	const [didSubmit, setDidSubmit] = useState(false);

	const onSubmit = (data: FeedbackFormData) => {
		posthog.capture("survey sent", {
			$survey_id:
				process.env.NODE_ENV === "production"
					? "0191ceaa-219b-0000-fd42-ccb028308020"
					: "0191ceaa-f303-0000-5adb-b85aeb76a3ba",
			$survey_response: data.feedback,
		});
		setDidSubmit(true);
		reset();
	};

	return (
		<Dropdown
			trigger={
				<div>
					<Button variant="ghost" size="icon" className="flex lg:hidden">
						<MessageCircleHeartIcon className="size-6" />
					</Button>
					<Button variant="secondary" size="sm" className="hidden lg:flex">
						<MessageCircleHeartIcon className="size-4" />
						<span>Give feedback</span>
					</Button>
				</div>
			}
			className="w-screen md:max-w-[28rem]"
			onClose={() => setDidSubmit(false)}>
			{didSubmit ? (
				<div className="p-4 gap-2 flex flex-col">
					<h3 className="font-semibold">Thank you for your feedback!</h3>
					<p className="text-sm text-secondary mb-2">We'll use this to improve Cloudy.</p>
				</div>
			) : (
				<form onSubmit={handleSubmit(onSubmit)} className="p-4 gap-2 flex flex-col">
					<h3 className="font-semibold">What can we do to improve Cloudy?</h3>
					<p className="text-sm text-secondary mb-2">
						Got a feature request? Did something go wrong? Got any great ideas? We'd love to hear them.
					</p>
					<TextareaAutosize
						{...register("feedback", { required: true })}
						className="py-2 px-3 min-h-36 bg-white/10 resize-none appearance-none border-border border rounded w-full text-sm outline-none no-scrollbar"
						placeholder="Share your thoughts..."
						rows={4}
					/>
					<Button type="submit" className="w-full mt-2">
						<SendHorizonalIcon className="size-4" />
						<span>Submit feedback</span>
					</Button>
				</form>
			)}
		</Dropdown>
	);
};
