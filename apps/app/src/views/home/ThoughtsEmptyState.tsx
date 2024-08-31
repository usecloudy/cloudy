import { FolderUpIcon, PlusIcon, XIcon, FilesIcon, FolderIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

import { Button } from "src/components/Button";

export const ThoughtsEmptyState = () => { 
	const [showPopup, setShowPopup] = useState(false);

	const handleImport = (method: 'google' | 'file') => {
		console.log(`Importing from ${method}`);
		setShowPopup(false);
	};

	return (
		<div className="flex flex-col items-center justify-center w-full gap-4">
			<span className="text-tertiary"> Missing your other notes? Import them here! or start writing a new note.</span>
			<Link to="/thoughts/new">
				<Button>
					<PlusIcon className="size-4 stroke-[3px]" />
					<span>Start new note</span>
				</Button>
			</Link>
				<Button variant="secondary" onClick={() => setShowPopup(true)}>
					<FolderUpIcon className="size-4 stroke-[3px]" />
					<span>Import notes</span>
				</Button>

				{showPopup && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white primary-gradient p-6 rounded-lg shadow-lg max-w-md w-full">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-bold">Import Notes</h2>
								<Button variant="ghost" size="icon" onClick={() => setShowPopup(false)}>
									<XIcon className="h-4 w-4" />
								</Button>
							</div>
							<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose a method to import your notes:</p>
							<div className="space-y-2">
								<Button variant="secondary" className="w-full justify-start" onClick={() => handleImport('google')}>
									<FilesIcon className="mr-2 h-4 w-4" />
									Import from Google Docs
								</Button>
								<Button variant="secondary" className="w-full justify-start" onClick={() => handleImport('file')}>
									<FolderIcon className="mr-2 h-4 w-4" />
									Import from File
								</Button>
							</div>
						</div>
					</div>
				)}
		</div>
	);
};
