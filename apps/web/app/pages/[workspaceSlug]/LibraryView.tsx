"use client";

import { FlattenedItem, makePublicDocPath } from "@cloudy/utils/common";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "app/utils/cn";

const findDescendantFolderIds = (items: FlattenedItem[], folderId: string): string[] => {
	const descendants: string[] = [];
	const stack = [folderId];

	while (stack.length > 0) {
		const currentId = stack.pop()!;
		const children = items.filter(item => item.parentId === currentId);

		for (const child of children) {
			if (child.type === "folder") {
				descendants.push(child.id);
				stack.push(child.id);
			}
		}
	}

	return descendants;
};

const LibraryItemInner = ({
	item,
	isOpen,
	onClick,
	isSelected,
}: {
	item: FlattenedItem;
	isOpen?: boolean;
	onClick: () => void;
	isSelected?: boolean;
}) => {
	return (
		<button
			className={cn(
				"flex flex-row hover:bg-card pr-3 py-2 rounded-md justify-between items-center w-full",
				isSelected && "bg-accent/10",
			)}
			style={{
				paddingLeft: `${0.75 + item.depth * 0.5}rem`,
			}}
			onClick={onClick}>
			<div className="text-left">{item.name}</div>
			<div>{item.type === "folder" ? <ChevronRight className={cn("size-5", isOpen && "rotate-90")} /> : null}</div>
		</button>
	);
};

const LibraryItem = ({
	item,
	isOpen,
	toggleFolder,
}: {
	item: FlattenedItem;
	isOpen: boolean;
	toggleFolder: (folderId: string) => void;
}) => {
	const { workspaceSlug, projectSlug, documentId } = useParams();

	const onClick = () => {
		if (item.type === "folder") {
			toggleFolder(item.id);
		}
	};

	if (item.type === "document") {
		return (
			<Link
				href={makePublicDocPath({
					workspaceSlug: workspaceSlug as string,
					projectSlug: projectSlug as string | null,
					documentId: item.id,
				})}>
				<LibraryItemInner item={item} onClick={onClick} isSelected={item.id === documentId} />
			</Link>
		);
	}

	return <LibraryItemInner item={item} isOpen={isOpen} onClick={onClick} />;
};

export const LibraryView = ({ items }: { items: FlattenedItem[] }) => {
	const { workspaceSlug } = useParams();
	const storageKey = `expanded-folders-${workspaceSlug}`;

	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
		if (typeof window === "undefined") return new Set();
		const stored = sessionStorage.getItem(storageKey);
		const parsedData = stored ? (JSON.parse(stored) as string[]) : [];
		return new Set(parsedData);
	});

	useEffect(() => {
		const folderArray = Array.from(expandedFolders);
		sessionStorage.setItem(storageKey, JSON.stringify(folderArray));
	}, [expandedFolders, storageKey]);

	const visibleItems = items.filter(item => {
		if (item.parentId === "<ROOT>") return true;
		return item.parentId && expandedFolders.has(item.parentId);
	});

	const toggleFolder = (folderId: string) => {
		setExpandedFolders(prev => {
			const newSet = new Set(prev);
			if (newSet.has(folderId)) {
				// Closing the folder
				newSet.delete(folderId);
				// Remove all descendant folder IDs
				const descendantIds = findDescendantFolderIds(items, folderId);
				for (const id of descendantIds) {
					newSet.delete(id);
				}
			} else {
				// Opening the folder
				newSet.add(folderId);
			}
			return newSet;
		});
	};

	return (
		<div className="flex flex-col px-4">
			{visibleItems.map(item => (
				<LibraryItem key={item.id} item={item} isOpen={expandedFolders.has(item.id)} toggleFolder={toggleFolder} />
			))}
		</div>
	);
};
