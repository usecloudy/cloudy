import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { cn } from "src/utils";

import { Button } from "./Button";
import { Dropdown, DropdownItem } from "./Dropdown";
import { Input } from "./Input";

interface Collection {
	id: string;
	title: string | null;
	parent_collection_id: string | null;
	children?: Collection[];
}

interface CollectionDropdownProps {
	collections: Collection[];
	onSelect: (collectionId: string) => void;
	onCreate: (name: string) => void;
	trigger: React.ReactNode;
}

const CollectionItem: React.FC<{
	collection: Collection;
	onSelect: (collectionId: string) => void;
	level: number;
}> = ({ collection, onSelect, level }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const indent = 4; // Indentation size in pixels per level
	const hasChildren = collection.children && collection.children.length > 0;

	return (
		<>
			<DropdownItem
				key={collection.id}
				onSelect={e => {
					e.stopPropagation();
					e.preventDefault();
					setIsExpanded(!isExpanded);
				}}
				className={cn("justify-between gap-0", !hasChildren && "cursor-default")}
				disableHover={!hasChildren}
				style={{ paddingLeft: `${level * indent + 4}px` }}>
				<div className="flex flex-row items-center">
					{hasChildren ? (
						<div className="w-5">
							{isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
						</div>
					) : (
						<div className="w-5" />
					)}
					<span>{collection.title || "Untitled Collection"}</span>
				</div>
				<Button
					variant="outline"
					className="h-6 rounded px-1"
					size="sm"
					onClick={e => {
						e.stopPropagation();
						e.preventDefault();
						onSelect(collection.id);
					}}>
					<PlusIcon className="h-4 w-4" />
					<span>Add</span>
				</Button>
			</DropdownItem>
			{isExpanded &&
				collection.children &&
				collection.children.map(child => (
					<CollectionItem key={child.id} collection={child} onSelect={onSelect} level={level + 1} />
				))}
		</>
	);
};

export const CollectionDropdown: React.FC<CollectionDropdownProps> = ({ collections, onSelect, onCreate, trigger }) => {
	const [filter, setFilter] = useState("");
	const [isCreatingNew, setIsCreatingNew] = useState(collections.length === 0);
	const [newCollectionName, setNewCollectionName] = useState("");

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setIsCreatingNew(collections.length === 0);
	}, [collections]);

	const buildNestedCollections = (collections: Collection[]): Collection[] => {
		const collectionMap = new Map<string, Collection>();

		// First pass: create all collection objects with empty children arrays
		collections.forEach(collection => {
			collectionMap.set(collection.id, { ...collection, children: [] });
		});

		// Second pass: build the hierarchy
		const rootCollections: Collection[] = [];
		collections.forEach(collection => {
			const collectionWithChildren = collectionMap.get(collection.id)!;
			if (collection.parent_collection_id) {
				const parent = collectionMap.get(collection.parent_collection_id);
				if (parent) {
					parent.children?.push(collectionWithChildren);
				} else {
					// If parent is not found, treat it as a root collection
					rootCollections.push(collectionWithChildren);
				}
			} else {
				rootCollections.push(collectionWithChildren);
			}
		});

		return rootCollections;
	};

	const nestedCollections = buildNestedCollections(collections);

	const filterCollections = (collections: Collection[], filter: string): Collection[] => {
		return collections.filter(collection => {
			const matchesFilter = collection.title?.toLowerCase().includes(filter.toLowerCase());
			const childrenMatch = collection.children ? filterCollections(collection.children, filter).length > 0 : false;
			return matchesFilter || childrenMatch;
		});
	};

	const filteredCollections = filterCollections(nestedCollections, filter);

	const handleCreateNew = () => {
		if (newCollectionName.trim()) {
			onCreate(newCollectionName.trim());
			setNewCollectionName("");
			setIsCreatingNew(false);
		}
	};

	return (
		<Dropdown trigger={trigger} className="w-72" align="start" onClose={() => setIsCreatingNew(collections.length === 0)}>
			{({ close }) => (
				<>
					<div className="p-1">
						{isCreatingNew ? (
							<Input
								type="text"
								placeholder="New collection name..."
								value={newCollectionName}
								onChange={e => setNewCollectionName(e.target.value)}
								className="mb-1"
								onKeyPress={e => {
									if (e.key === "Enter") {
										handleCreateNew();
									}
								}}
								autoFocus
							/>
						) : (
							<Input
								type="text"
								placeholder="Search collections..."
								value={filter}
								onChange={e => setFilter(e.target.value)}
								className="mb-2"
							/>
						)}
					</div>
					{!isCreatingNew && (
						<div className="flex flex-col gap-2">
							<div className="no-scrollbar max-h-60 overflow-y-auto">
								{filteredCollections.map(collection => (
									<CollectionItem
										key={collection.id}
										collection={collection}
										onSelect={collectionId => {
											close();
											onSelect(collectionId);
										}}
										level={0}
									/>
								))}
							</div>
							<DropdownItem
								onSelect={e => {
									e.preventDefault();
									setIsCreatingNew(true);
								}}
								variant="ghost">
								<PlusIcon className="h-4 w-4" />
								<span className="font-semibold">Create new collection</span>
							</DropdownItem>
						</div>
					)}
					{isCreatingNew && (
						<div className="flex w-full flex-row gap-1">
							{collections.length > 0 && (
								<DropdownItem
									className="flex flex-1 items-center justify-center"
									onSelect={e => {
										e.preventDefault();
										setIsCreatingNew(false);
										setNewCollectionName("");
									}}>
									Cancel
								</DropdownItem>
							)}
							<DropdownItem
								className="flex flex-1 items-center justify-center bg-accent font-semibold text-background focus:bg-accent/80"
								onSelect={handleCreateNew}>
								Create
							</DropdownItem>
						</div>
					)}
				</>
			)}
		</Dropdown>
	);
};
