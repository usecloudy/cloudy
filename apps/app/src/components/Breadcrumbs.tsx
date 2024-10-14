import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "src/utils";

interface Breadcrumb {
	label: string;
	url: string;
}

interface BreadcrumbsProps {
	items: Breadcrumb[];
	className?: string;
}

export const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
	return (
		<nav aria-label="Breadcrumb" className={cn("flex items-center text-sm", className)}>
			{items.map((item, index) => (
				<div key={item.url} className="flex items-center">
					{index > 0 && <ChevronRightIcon className="mx-1 size-4 text-secondary" />}
					{index === items.length - 1 ? (
						<span className="text-secondary">{item.label}</span>
					) : (
						<Link
							to={item.url}
							className="text-primary transition-colors duration-200 hover:text-accent hover:underline">
							{item.label}
						</Link>
					)}
				</div>
			))}
		</nav>
	);
};
