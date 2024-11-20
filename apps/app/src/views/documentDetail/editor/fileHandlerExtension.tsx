import FileHandler from "@tiptap-pro/extension-file-handler";
import { Editor } from "@tiptap/react";
import { upload } from "@vercel/blob/client";

import { apiClient } from "src/api/client";

export const makeFilePath = (thoughtId: string, attachmentId: string, fileName: string): string => {
	const fileExtension = fileName.split(".").pop();

	return `user-content/thoughts/${thoughtId}/${attachmentId}.${fileExtension}`;
};

export const createFileHandlerExtension = (thoughtId: string) => {
	const handleUpload = (currentEditor: Editor, files: File[], pos?: number) => {
		files.forEach(file => {
			const attachmentId = crypto.randomUUID();

			if (pos) {
				currentEditor.commands.insertContentAt(pos, {
					type: "pending-attachment",
					attrs: {
						attachmentId,
					},
				});
			} else {
				currentEditor.commands.insertContent({
					type: "pending-attachment",
					attrs: {
						attachmentId,
					},
				});
			}

			upload(makeFilePath(thoughtId, attachmentId, file.name), file, {
				access: "public",
				handleUploadUrl: apiClient.defaults.baseURL + `/api/thoughts/${thoughtId}/attachments/upload`,
				clientPayload: JSON.stringify({
					Authorization: apiClient.defaults.headers.common.Authorization,
				}),
			}).then(attachment => {
				const pendingAttachments = currentEditor.$nodes("pending-attachment");
				const pendingAttachment = pendingAttachments?.find(node => node.node.attrs.attachmentId === attachmentId);

				if (!pendingAttachment) {
					return;
				}

				currentEditor.state.doc.forEach((node, offset) => {
					if (node.attrs.attachmentId === attachmentId) {
						currentEditor
							.chain()
							.setNodeSelection(offset)
							.deleteSelection()
							.insertContent({
								type: "image",
								attrs: {
									src: attachment.url,
								},
							})
							.run();
					}
				});
			});
		});
	};

	return FileHandler.configure({
		allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
		onDrop: (currentEditor, files, pos) => {
			handleUpload(currentEditor, files, pos);
		},
		onPaste: (currentEditor, files, htmlContent) => {
			if (htmlContent) {
				return;
			}

			handleUpload(currentEditor, files);
		},
	});
};
