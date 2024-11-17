import { ellipsizeText } from "@cloudy/utils/common";
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Navigate, useParams } from "react-router-dom";
import { usePrevious } from "react-use";

import { MainLayout } from "../../components/MainLayout";
import { useWorkspace } from "../../stores/workspace";
import { makeProjectHomeUrl } from "../../utils/projects";
import { makeHeadTitle } from "../../utils/strings";
import { useProject } from "../projects/ProjectContext";
import { EditorErrorBoundary } from "../thoughtDetail/EditorErrorBoundary";
import { ThoughtContent } from "../thoughtDetail/ThoughtDetailView";
import { useThought } from "../thoughtDetail/hooks";
import { DocumentContext } from "./DocumentContext";
import { PublishedDocumentView } from "./PublishedDocumentView";

export const DocumentDetailView = () => {
	const { documentId } = useParams<{ documentId: string }>();

	const workspace = useWorkspace();
	const project = useProject();

	const { data: document, isLoading } = useThought(documentId);

	const previousDocument = usePrevious(document);

	const [isEditMode, setIsEditMode] = useState(false);

	const headTitle = document?.title ? makeHeadTitle(ellipsizeText(document.title, 16)) : makeHeadTitle("New Doc");

	if ((!document && previousDocument) || (!isLoading && !document)) {
		if (project) {
			return <Navigate to={makeProjectHomeUrl(workspace.slug, project.slug)} />;
		}
		return <Navigate to="/" />;
	}

	return (
		<DocumentContext.Provider value={{ documentId: documentId!, isEditMode, setIsEditMode }}>
			<EditorErrorBoundary>
				<MainLayout className="no-scrollbar relative flex h-full w-screen flex-col overflow-hidden px-0 md:w-full md:px-0 lg:px-0">
					<Helmet>
						<title>{headTitle}</title>
					</Helmet>
					{isEditMode ? (
						<ThoughtContent key={documentId} thought={document!} />
					) : (
						<PublishedDocumentView key={documentId} />
					)}
				</MainLayout>
			</EditorErrorBoundary>
		</DocumentContext.Provider>
	);
};
