import { ChevronDownIcon, ListIcon, PlusIcon } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Dropdown, DropdownItem } from "./Dropdown";
import { Input } from "./Input";

interface Collection {
	id: string;
	title: string | null;
}

interface CollectionDropdownProps {
	collections: Collection[];
	onSelect: (collectionId: string) => void;
	onCreate: (name: string) => void;
	trigger: React.ReactNode;
}

export const CollectionDropdown: React.FC<CollectionDropdownProps> = ({ collections, onSelect, onCreate, trigger }) => {
	const [filter, setFilter] = useState("");
	const [isCreatingNew, setIsCreatingNew] = useState(collections.length === 0);
	const [newCollectionName, setNewCollectionName] = useState("");

	useEffect(() => {
		setIsCreatingNew(collections.length === 0);
	}, [collections]);

	const filteredCollections = collections.filter(collection =>
		collection.title?.toLowerCase().includes(filter.toLowerCase()),
	);

	const handleCreateNew = () => {
		if (newCollectionName.trim()) {
			onCreate(newCollectionName.trim());
			setNewCollectionName("");
			setIsCreatingNew(false);
		}
	};

	return (
		<Dropdown trigger={trigger} className="w-72" align="start" onClose={() => setIsCreatingNew(collections.length === 0)}>
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
					<div className="max-h-60 overflow-y-auto">
						{filteredCollections.map(collection => (
							<DropdownItem key={collection.id} onClick={() => onSelect(collection.id)}>
								<ListIcon className="h-4 w-4" />
								<span>{collection.title ?? "Untitled Collection"}</span>
							</DropdownItem>
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
		</Dropdown>
	);
};
