import FileHandler from "@tiptap-pro/extension-file-handler";
import { upload } from "@vercel/blob/client";

import { apiClient } from "src/api/client";

export const makeFilePath = (thoughtId: string, attachmentId: string, fileName: string): string => {
	const fileExtension = fileName.split(".").pop();

	return `user-content/thoughts/${thoughtId}/${attachmentId}.${fileExtension}`;
};

export const createFileHandlerExtension = (thoughtId: string) =>
	FileHandler.configure({
		allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
		onDrop: (currentEditor, files, pos) => {
			files.forEach(file => {
				const attachmentId = crypto.randomUUID();

				currentEditor.commands.insertContent({
					type: "pending-attachment",
					attrs: {
						attachmentId,
					},
				});

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
		},
		onPaste: (currentEditor, files, htmlContent) => {
			files.forEach(file => {
				if (htmlContent) {
					// if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
					// you could extract the pasted file from this url string and upload it to a server for example
					console.log(htmlContent); // eslint-disable-line no-console
					return false;
				}

				const fileReader = new FileReader();

				fileReader.readAsDataURL(file);
				fileReader.onload = () => {
					currentEditor
						.chain()
						.insertContentAt(currentEditor.state.selection.anchor, {
							type: "image",
							attrs: {
								src: fileReader.result,
							},
						})
						.focus()
						.run();
				};
			});
		},
	});
