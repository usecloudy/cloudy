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
import LoadingSpinner from "src/components/LoadingSpinner";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const useGeneratePDF = (thoughtId: string, options: ThoughtsExportGetRequestBody) => {
	const { data, isLoading } = useQuery({
		queryKey: ["thoughts", thoughtId, "export", JSON.stringify(options)],
		queryFn: async () => {
			console.log("options", options);
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
	});

	const downloadPdf = () => {
		window.open(data, "_blank");
	};

	return {
		pdf: data,
		isLoading,
		downloadPdf,
	};
};

export const ExportDialog = ({ thoughtId }: { thoughtId: string }) => {
	const [isOpen, setIsOpen] = useState(false);

	const handleOnClose = () => {
		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger>
				<Button variant="ghost" className="justify-start w-full">
					<ShareIcon className="size-4" />
					<span>Export Note</span>
				</Button>
			</DialogTrigger>
			<ExportDialogInner thoughtId={thoughtId} onClose={handleOnClose} />
		</Dialog>
	);
};

const ExportDialogInner = ({ thoughtId, onClose }: { thoughtId: string; onClose: () => void }) => {
	const { watch, control, setValue } = useForm<ThoughtsExportGetRequestBody>({
		defaultValues: {
			hideWatermark: false,
			hideTitle: false,
			colorScheme: "default",
			fontSizePt: 12,
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
			<div className="w-full h-64 overflow-hidden bg-card flex items-center justify-center p-0 rounded-sm border border-border">
				{pdf && !isLoading ? <iframe title="pdf" className="w-full h-full" src={pdf} /> : <LoadingSpinner size="sm" />}
			</div>
			<form className="space-y-4 mt-4">
				<div className="flex items-center space-x-2 justify-between">
					<label htmlFor="hideWatermark">Hide Watermark</label>
					<Controller
						name="hideWatermark"
						control={control}
						render={({ field }) => <Switch defaultChecked={false} onCheckedChange={field.onChange} />}
					/>
				</div>
				<div className="flex items-center space-x-2 justify-between">
					<label htmlFor="hideTitle">Hide Title</label>
					<Controller
						name="hideTitle"
						control={control}
						render={({ field }) => <Switch defaultChecked={false} onCheckedChange={field.onChange} />}
					/>
				</div>
				<div className="flex items-center justify-between space-x-2">
					<label>Color Scheme</label>
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
				</div>
				<div className="flex items-center space-x-2 justify-between gap-4">
					<label htmlFor="fontSizePt" className="whitespace-nowrap">
						Font Size
					</label>
					<Controller
						render={({ field }) => (
							<Slider
								// {...field}
								min={8}
								max={18}
								defaultValue={[11]}
								onValueCommit={values => {
									console.log("values", values);
									field.onChange(values[0]);
								}}
								showValue
							/>
						)}
						control={control}
						name="fontSizePt"
					/>
				</div>
			</form>
			<DialogFooter>
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
			className={`w-8 h-8 rounded-full border-4 ${bgColor} ${borderColor} flex items-center justify-center overflow-hidden`}></button>
	);
};
