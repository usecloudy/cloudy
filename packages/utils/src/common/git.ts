export enum PrStatus {
    OPEN = "open",
    CLOSED = "closed",
    MERGED = "merged",
}

export enum PrDocsStatus {
    PUBLISHED = "published",
    DRAFT = "draft",
    SKIPPED = "skipped",
}

export enum PrDraftDocumentStatus {
    PUBLISHED = "published",
    CONFIRMED = "confirmed",
    DRAFT = "draft",
    SKIPPED = "skipped",
}

export enum PrDraftDocumentModificationType {
    CREATE = "create",
    EDIT = "edit",
}

export const makeGithubPrUrl = (
    owner: string,
    repo: string,
    prNumber: number
) => {
    return `https://github.com/${owner}/${repo}/pull/${prNumber}`;
};
