import { RepoReference } from "./docs";
import { Product } from "./pricing";

export interface PaymentsProductsGetResponse {
    products: Product[];
}

export interface CustomerStatus {
    stripeCustomerId: string;
    isActive: boolean;
    isTrialing: boolean;
    isEligibleForTrial: boolean;
    remainingDaysInTrial: number | null;
    unitPrice: number | null;
    unitCount: number | null;
    totalPrice: number | null;
}

export interface PaymentsCustomersStatusGetResponse {
    wsId: string;
    wsSlug: string;
    customerStatus: CustomerStatus | null;
    userCount: number;
}

export interface ThoughtsExportGetRequestBody {
    hideWatermark?: boolean;
    hideTitle?: boolean;
    colorScheme?: "default" | "white";
    fontSizePt?: number;
    paperSize?: "a4" | "letter" | "legal";
    fileName?: string;
}

export interface WorkspacesNewPostRequestBody {
    name: string;
    slug: string;
}

export interface WorkspacesNewPostResponse {
    success: boolean;
    wsId: string;
    wsSlug: string;
}

export interface TopicsRefreshPostRequestBody {
    topicId: string;
}

export interface TopicsNewPostRequestBody {
    query: string;
    workspaceId: string;
}

export interface FileHandlerClientPayload {
    Authorization: string;
    thoughtId: string;
}

export interface ThreadRespondPostRequestBody {
    threadId: string;
    messageId: string;
}

export interface ApplyChangePostRequestBody {
    documentId: string;
    suggestionContent: string;
}

export interface ApplyChangePostResponse {
    originalSnippet: string | null;
    replacementSnippet: string | null;
}

export interface CollectionSummaryPostRequestBody {
    collectionId: string;
}

export interface ScrapeSiteGetResponse {
    name: string | null;
    welcomeMessage: string | null;
    missionBlurb: string | null;
    collectionNames: string[];
}

export interface RepoFilesGetResponse {
    paths: RepoReference[];
}

export interface GithubVerifyInstallationResponse {
    success: boolean;
    account: {
        id: string;
        login: string;
    };
    accessToken: string;
}

export interface GithubRepository {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    description: string | null;
    defaultBranch: string;
    installationId: number;
}

export interface GithubAllWorkspaceReposGetResponse {
    repositories: GithubRepository[];
}
