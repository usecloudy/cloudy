import { format, isSameWeek, isSameYear, isToday, isYesterday } from "date-fns";
import { CloudIcon, CloudyIcon, LightbulbIcon, ListIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { ThoughtCard } from "./ThoughtCard";

interface Collection {
	id: string;
	title: string | null;
}

interface Thought {
	id: string;
	title: string | null;
	content_md: string | null;
	content_plaintext: string | null;
	created_at: string;
	updated_at: string;
	collections: Collection[];
}

interface ThoughtListProps {
	thoughts: Thought[];
}

export const ThoughtList = ({ thoughts }: ThoughtListProps) => {
	const groupThoughtsByDate = useMemo(() => {
		return (thoughts: Thought[]) => {
			const grouped: { [key: string]: Thought[] } = {};

			// Sort thoughts by newest first
			const sortedThoughts = [...thoughts].sort(
				(a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
			);

			sortedThoughts.forEach(thought => {
				const date = new Date(thought.updated_at);
				let groupKey: string;

				if (isToday(date)) {
					groupKey = "Today";
				} else if (isYesterday(date)) {
					groupKey = "Yesterday";
				} else if (isSameWeek(date, new Date())) {
					groupKey = format(date, "EEEE"); // Day of the week
				} else if (isSameYear(date, new Date())) {
					groupKey = format(date, "MMMM d"); // Month and day
				} else {
					groupKey = format(date, "MMMM d, yyyy"); // Full date for older thoughts
				}

				if (!grouped[groupKey]) {
					grouped[groupKey] = [];
				}
				grouped[groupKey].push(thought);
			});

			return grouped;
		};
	}, []);

	const groupedThoughts = groupThoughtsByDate(thoughts);

	return (
		<div className="space-y-6">
			{Object.entries(groupedThoughts).map(([date, thoughtsInGroup]) => (
				<div key={date} className="space-y-2">
					<h2 className="mb-1 text-sm font-medium text-secondary">{date}</h2>
					{thoughtsInGroup.map(thought => (
						<ThoughtCard key={thought.id} thought={thought} />
					))}
				</div>
			))}
		</div>
	);
};
