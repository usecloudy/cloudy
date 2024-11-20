import { Slider, Switch } from "@cloudy/ui";
import { ThoughtsExportGetRequestBody } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { DownloadIcon, ShareIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { pdfjs } from "react-pdf";

import { apiClient } from "src/api/client";
import { Button } from "src/components/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "src/components/Dialog";
import { Input } from "src/components/Input";
import LoadingSpinner from "src/components/LoadingSpinner";
import { SelectDropdown } from "src/components/SelectDropdown";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const useGeneratePDF = (thoughtId: string, options: ThoughtsExportGetRequestBody) => {
	const { data, isLoading } = useQuery({
		queryKey: ["thoughts", thoughtId, "export", JSON.stringify(options)],
		queryFn: async () => {
			const response = await apiClient.get(`/api/thoughts/${thoughtId}/export`, {
				params: {
					options: JSON.stringify(options),
				},
				headers: {
					Accept: "application/pdf",
				},
				responseType: "blob", // Set responseType to 'blob'
			});

			return URL.createObjectURL(response.data);
		},
		staleTime: 15000,
	});

	const downloadPdf = () => {
		const baseUrl = apiClient.defaults.baseURL;
		if (baseUrl) {
			const url = new URL(`/api/thoughts/${thoughtId}/export`, baseUrl);
			url.searchParams.set("options", JSON.stringify(options));
			window.location.href = url.toString();
		}
	};

	return {
		pdf: data,
		isLoading,
		downloadPdf,
	};
};

export const ExportDialog = ({ thoughtId, title }: { thoughtId: string; title?: string }) => {
	const [isOpen, setIsOpen] = useState(false);

	const handleOnClose = () => {
		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger>
				<Button variant="ghost" className="w-full justify-start" size="sm">
					<ShareIcon className="size-4" />
					<span>Export to PDF</span>
				</Button>
			</DialogTrigger>
			{isOpen && <ExportDialogInner thoughtId={thoughtId} title={title} onClose={handleOnClose} />}
		</Dialog>
	);
};

const ExportDialogInner = ({ thoughtId, title, onClose }: { thoughtId: string; title?: string; onClose: () => void }) => {
	const { watch, control, setValue } = useForm<ThoughtsExportGetRequestBody>({
		defaultValues: {
			hideWatermark: true,
			hideTitle: false,
			colorScheme: "white",
			fontSizePt: 11,
			paperSize: "letter",
			fileName: `${title?.replace(/[^a-zA-Z0-9-_]/g, "_") ?? "exported_note"}.pdf`,
		},
	});

	// Watch all form fields
	const exportOptions = watch();

	const { pdf, downloadPdf, isLoading } = useGeneratePDF(thoughtId, exportOptions);

	return (
		<DialogContent size="lg">
			<DialogHeader>
				<DialogTitle>Export Note to PDF</DialogTitle>
			</DialogHeader>
			<div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-sm border border-border bg-card p-0">
				{pdf && !isLoading ? <iframe title="pdf" className="h-full w-full" src={pdf} /> : <LoadingSpinner size="sm" />}
			</div>
			<form className="mb-4 mt-4 space-y-4">
				<FormItem label="Color Scheme" htmlFor="colorScheme">
					<div className="flex space-x-2">
						<ColorSwatch
							scheme="default"
							isSelected={exportOptions.colorScheme === "default"}
							onClick={() => setValue("colorScheme", "default")}
						/>
						<ColorSwatch
							scheme="white"
							isSelected={exportOptions.colorScheme === "white"}
							onClick={() => setValue("colorScheme", "white")}
						/>
					</div>
				</FormItem>
				<FormItem label="Font Size" htmlFor="fontSizePt">
					<div className="w-full pl-12">
						<Controller
							render={({ field }) => (
								<Slider
									// {...field}
									min={8}
									max={18}
									defaultValue={[11]}
									onValueCommit={values => {
										field.onChange(values[0]);
									}}
									showValue
								/>
							)}
							control={control}
							name="fontSizePt"
						/>
					</div>
				</FormItem>
				<FormItem label="Paper Size" htmlFor="paperSize">
					<SelectDropdown
						options={[
							{ value: "a4", label: "A4" },
							{ value: "letter", label: "Letter" },
							{ value: "legal", label: "Legal" },
						]}
						value={exportOptions.paperSize!}
						onChange={value => setValue("paperSize", value as "a4" | "letter" | "legal")}
						className="w-32"
					/>
				</FormItem>
				<FormItem label="Hide Branding" htmlFor="hideWatermark">
					<Controller
						name="hideWatermark"
						control={control}
						render={({ field }) => <Switch defaultChecked={true} onCheckedChange={field.onChange} />}
					/>
				</FormItem>
				<FormItem label="Hide Title" htmlFor="hideTitle">
					<Controller
						name="hideTitle"
						control={control}
						render={({ field }) => <Switch defaultChecked={false} onCheckedChange={field.onChange} />}
					/>
				</FormItem>
				<FormItem label="File Name" htmlFor="fileName">
					<Controller
						name="fileName"
						control={control}
						render={({ field }) => <Input {...field} className="w-full" placeholder="Enter file name" />}
					/>
				</FormItem>
			</form>
			<DialogFooter className="flex-col gap-2 md:flex-row">
				<Button onClick={downloadPdf} disabled={!pdf || isLoading}>
					{pdf && !isLoading ? (
						<>
							<DownloadIcon className="size-4" />
							<span>Download PDF</span>
						</>
					) : (
						<LoadingSpinner size="xs" variant="background" />
					)}
				</Button>
				<Button variant="secondary" onClick={onClose}>
					Close
				</Button>
			</DialogFooter>
		</DialogContent>
	);
};

const FormItem = ({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) => {
	return (
		<div className="flex h-8 items-center justify-between gap-4">
			<label htmlFor={htmlFor} className="whitespace-nowrap">
				{label}
			</label>
			{children}
		</div>
	);
};

interface ColorSwatchProps {
	scheme: "default" | "white";
	isSelected: boolean;
	onClick: () => void;
}

const ColorSwatch = ({ scheme, isSelected, onClick }: ColorSwatchProps) => {
	const bgColor = scheme === "default" ? "bg-[#FFF5E1]" : "bg-white";
	const borderColor = isSelected ? "border-accent" : "border-card";

	return (
		<button
			type="button"
			onClick={onClick}
			className={`h-8 w-8 rounded-full border-4 ${bgColor} ${borderColor} flex items-center justify-center overflow-hidden`}></button>
	);
};
