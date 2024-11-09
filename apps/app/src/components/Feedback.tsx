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
					<Button variant="ghost" size="icon" className="flex md:hidden">
						<MessageCircleHeartIcon className="size-6" />
					</Button>
					<Button variant="outline" size="sm" className="hidden w-full md:flex">
						<MessageCircleHeartIcon className="size-4" />
						<span>Give feedback</span>
					</Button>
				</div>
			}
			className="w-screen md:max-w-[28rem]"
			onClose={() => setDidSubmit(false)}>
			{didSubmit ? (
				<div className="flex flex-col gap-2 p-4">
					<h3 className="font-semibold">Thank you for your feedback!</h3>
					<p className="mb-2 text-sm text-secondary">We'll use this to improve Cloudy.</p>
				</div>
			) : (
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 p-4">
					<h3 className="font-semibold">What can we do to improve Cloudy?</h3>
					<p className="mb-2 text-sm text-secondary">
						Got a feature request? Did something go wrong? Got any great ideas? We'd love to hear them.
					</p>
					<TextareaAutosize
						{...register("feedback", { required: true })}
						className="no-scrollbar min-h-36 w-full resize-none appearance-none rounded border border-border bg-card px-3 py-2 text-sm outline-none"
						placeholder="Share your thoughts..."
						rows={4}
					/>
					<Button type="submit" className="mt-2 w-full">
						<SendHorizonalIcon className="size-4" />
						<span>Submit feedback</span>
					</Button>
				</form>
			)}
		</Dropdown>
	);
};
