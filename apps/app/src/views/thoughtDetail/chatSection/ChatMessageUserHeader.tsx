import { Avatar } from "src/components/users/Avatar";
import { useUserProfile } from "src/utils/users";

export const ChatMessageUserHeader = ({ userId }: { userId: string }) => {
	const { data: userProfile } = useUserProfile(userId);

	return (
		<div className="flex flex-row items-center gap-1">
			<Avatar fallback={userProfile?.name ?? userProfile?.email} size="xs" />
			<div className="text-xs font-medium text-secondary">
				{userProfile?.name ?? userProfile?.email ?? "Unknown User"}
			</div>
		</div>
	);
};
