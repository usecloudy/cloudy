import { ellipsizeText } from "@cloudy/utils/common";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Navigate, useParams } from "react-router-dom";

import { MainLayout } from "../../components/MainLayout";
import { useWorkspace } from "../../stores/workspace";
import { makeProjectHomeUrl } from "../../utils/projects";
import { makeHeadTitle } from "../../utils/strings";
import { useProject } from "../projects/ProjectContext";
import { DocumentContext } from "./DocumentContext";
import { DocumentLoadingPlaceholderWithPadding } from "./DocumentLoadingPlaceholder";
import { LatestDocumentVersionContext, useLatestDocumentVersion } from "./LatestDocumentVersionContext";
import { PublishedDocumentView } from "./PublishedDocumentView";
import { EditorErrorBoundary } from "./editor/EditorErrorBoundary";
import { EditorView } from "./editor/EditorView";
import { useThought, useThoughtChannelListeners } from "./editor/hooks";

const DocumentDetailInner = ({ documentId }: { documentId: string }) => {
	const workspace = useWorkspace();
	const project = useProject();

	const { data: document, isLoading } = useThought(documentId);
	const { data: latestDocumentVersion, isLoading: isLatestDocumentVersionLoading } = useLatestDocumentVersion(documentId);
	useThoughtChannelListeners(documentId);

	const [isEditMode, setIsEditMode] = useState(false);
	const [isReady, setIsReady] = useState(false);

	const headTitle = document?.title ? makeHeadTitle(ellipsizeText(document.title, 16)) : makeHeadTitle("New Doc");

	useEffect(() => {
		if (!isLatestDocumentVersionLoading) {
			if (!latestDocumentVersion) {
				setIsEditMode(true);
			}
			setIsReady(true);
		}
	}, [latestDocumentVersion, isLatestDocumentVersionLoading]);

	if (!isLoading && !document) {
		if (project) {
			return <Navigate to={makeProjectHomeUrl(workspace.slug, project.slug)} />;
		}
		return <Navigate to="/" />;
	}

	return (
		<DocumentContext.Provider value={{ documentId, isEditMode, setIsEditMode }}>
			<LatestDocumentVersionContext.Provider value={{ latestDocumentVersion }}>
				<EditorErrorBoundary>
					<MainLayout className="no-scrollbar relative flex h-full w-screen flex-col overflow-hidden px-0 md:w-full md:px-0 lg:px-0">
						<Helmet>
							<title>{headTitle}</title>
						</Helmet>
						{isLoading || isLatestDocumentVersionLoading || !isReady ? (
							<DocumentLoadingPlaceholderWithPadding />
						) : isEditMode ? (
							<EditorView thought={document!} />
						) : (
							<PublishedDocumentView />
						)}
					</MainLayout>
				</EditorErrorBoundary>
			</LatestDocumentVersionContext.Provider>
		</DocumentContext.Provider>
	);
};

export const DocumentDetailView = () => {
	const { documentId } = useParams<{ documentId: string }>();

	return <DocumentDetailInner key={documentId} documentId={documentId!} />;
};
