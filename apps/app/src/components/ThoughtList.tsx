import { format, isSameWeek, isSameYear, isToday, isYesterday } from "date-fns";
import { useMemo } from "react";

import { CollectionCard } from "./CollectionCard";
import { ThoughtCard } from "./ThoughtCard";

interface SubCollection {
	id: string;
	title: string | null;
	updated_at: string;
}

interface ThoughtCollection {
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
	collections: ThoughtCollection[];
}

interface ThoughtListProps {
	thoughts: Thought[];
	collections?: SubCollection[];
}

interface BaseGroupItem {
	updated_at: string;
}

interface ThoughtGroupItem extends BaseGroupItem {
	type: "thought";
	thought: Thought;
}

interface CollectionGroupItem extends BaseGroupItem {
	type: "collection";
	collection: SubCollection;
}

type GroupItem = ThoughtGroupItem | CollectionGroupItem;

export const ThoughtList = ({ thoughts, collections }: ThoughtListProps) => {
	const groupedItems = useMemo(() => {
		const grouped: { [key: string]: GroupItem[] } = {};

		const allItems: GroupItem[] = [
			...thoughts.map(thought => ({ type: "thought", thought, updated_at: thought.updated_at }) as ThoughtGroupItem),
			...(collections?.map(
				collection => ({ type: "collection", collection, updated_at: collection.updated_at }) as CollectionGroupItem,
			) || []),
		];

		// Sort all items by newest first
		const sortedItems = allItems.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

		sortedItems.forEach(item => {
			const date = new Date(item.updated_at);
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
				groupKey = format(date, "MMMM d, yyyy"); // Full date for older items
			}

			if (!grouped[groupKey]) {
				grouped[groupKey] = [];
			}
			grouped[groupKey].push(item);
		});

		return grouped;
	}, [thoughts, collections]);

	return (
		<div className="space-y-6">
			{Object.entries(groupedItems).map(([date, groupItems]) => (
				<div key={date} className="space-y-2">
					<h2 className="mb-1 text-sm font-medium text-secondary">{date}</h2>
					{groupItems.map(item => {
						if (item.type === "thought") {
							return <ThoughtCard key={item.thought.id} thought={item.thought} />;
						} else {
							return <CollectionCard key={item.collection.id} collection={item.collection} />;
						}
					})}
				</div>
			))}
		</div>
	);
};
