import { handleSupabaseError } from "@cloudy/utils/common";
import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import debounce from "debounce";
import { EventEmitter } from "events";
import { fromUint8Array, toUint8Array } from "js-base64";
import { MutableRefObject } from "react";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness";
import * as Y from "yjs";

export interface SupabaseProviderConfiguration {
	id: string;
	/**
	 * The identifier/name of your document
	 */
	name: string;
	/**
	 * The actual Y.js document
	 */
	document: Y.Doc;
	/**
	 * The awareness instance
	 */
	awareness?: Awareness;
	/**
	 * Details about the database to connect to
	 */
	databaseDetails: {
		schema: string;
		table: string;
		updateColumns: { name: string; content: string };
		conflictColumns: string;
	};
	disableUpdatesRef: MutableRefObject<boolean>;
}

export class SupabaseProvider extends EventEmitter {
	public configuration: SupabaseProviderConfiguration = {
		name: "",
		// @ts-ignore
		document: undefined,
		// @ts-ignore
		awareness: undefined,
		databaseDetails: {
			schema: "",
			table: "",
			updateColumns: { name: "", content: "" },
			conflictColumns: "",
		},
		disableUpdatesRef: { current: false },
	};

	private supabase: SupabaseClient;
	private channel: RealtimeChannel | null = null;
	private awareness: Awareness | null = null;
	private version: number = 0;
	public callbacks: { [key: string]: Function[] } = {};

	private debouncedDocumentUpdateHandler: (update: Uint8Array, origin?: any) => void;
	private debouncedAwarenessUpdateHandler: (update: any, origin: any) => void;

	private isConnected: boolean = false;

	constructor(supabase: SupabaseClient, config: SupabaseProviderConfiguration) {
		super();
		this.setConfiguration(config);
		this.configuration.document = config.document ? config.document : new Y.Doc();
		// @ts-ignore
		this.awareness = config.awareness ? config.awareness : new Awareness(this.configuration.document);
		this.supabase = supabase;

		this.on("connect", this.onConnect);
		this.on("disconnect", this.onDisconnect);
		this.debouncedDocumentUpdateHandler = debounce(this.documentUpdateHandler.bind(this), 50);
		this.debouncedAwarenessUpdateHandler = debounce(this.onAwarenessUpdate.bind(this), 50);
		this.document.on("update", this.debouncedDocumentUpdateHandler);
		this.awareness?.on("update", this.debouncedAwarenessUpdateHandler);
		this.connect();

		if (typeof window !== "undefined") {
			window.addEventListener("beforeunload", this.removeSelfFromAwarenessOnUnload);
		} else if (typeof process !== "undefined") {
			process.on("exit", () => this.removeSelfFromAwarenessOnUnload);
		}
	}

	public setConfiguration(configuration: Partial<SupabaseProviderConfiguration> = {}): void {
		this.configuration = { ...this.configuration, ...configuration };
	}

	get document() {
		return this.configuration.document;
	}

	private async documentUpdateHandler(update: Uint8Array, origin?: any) {
		if (origin === this) {
			return;
		}
		if (this.configuration.disableUpdatesRef.current) {
			console.log("updates disabled");
			return;
		}

		const dbDocument = fromUint8Array(Y.encodeStateAsUpdate(this.document));

		const res = await this.supabase.from(this.configuration.databaseDetails.table).upsert(
			{
				[this.configuration.databaseDetails.updateColumns.name]: this.configuration.id,
				[this.configuration.databaseDetails.updateColumns.content]: dbDocument,
			},
			this.configuration.databaseDetails.conflictColumns
				? { onConflict: this.configuration.databaseDetails.conflictColumns }
				: {},
		);

		if (res.status === 201 || res.status === 200) {
			this.emit("save", this.version);
			return this.channel!.send({
				type: "broadcast",
				event: "update",
				payload: { dbDocument },
			});
		} else {
			return Error(`Document not stored due to error: ${res.error}`);
		}
	}

	private onAwarenessUpdate({ added, updated, removed }: any, origin: any) {
		const changedClients = added.concat(updated).concat(removed);
		const awarenessUpdate = encodeAwarenessUpdate(this.awareness!, changedClients);

		if (this.channel) {
			this.channel.send({
				type: "broadcast",
				event: "awareness",
				payload: { awareness: fromUint8Array(awarenessUpdate) },
			});
		}
	}

	removeSelfFromAwarenessOnUnload() {
		if (this.awareness) {
			removeAwarenessStates(this.awareness, [this.document.clientID], "window unload");
		}
	}

	private async onConnect() {
		console.log("onConnect");
		let data = handleSupabaseError(
			await this.supabase
				.from(this.configuration.databaseDetails.table)
				.select<string, { [key: string]: string }>(`${this.configuration.databaseDetails.updateColumns.content}`)
				.eq(this.configuration.databaseDetails.updateColumns.name, this.configuration.id)
				.maybeSingle(),
		);

		if (!data) {
			data = handleSupabaseError(
				await this.supabase
					.from(this.configuration.databaseDetails.table)
					.insert({
						[this.configuration.databaseDetails.updateColumns.name]: this.configuration.id,
						[this.configuration.databaseDetails.updateColumns.content]: "",
					})
					.select()
					.single(),
			);
		}

		if (data && data[this.configuration.databaseDetails.updateColumns.content]) {
			try {
				const dbDocument = toUint8Array(data[this.configuration.databaseDetails.updateColumns.content]);
				this.version++;
				Y.applyUpdate(this.document, dbDocument);
			} catch (error) {
				console.error(error);
			}
		}

		this.emit("synced");
		this.isConnected = true;

		if (this.awareness && this.awareness.getLocalState() !== null) {
			const awarenessUpdate = encodeAwarenessUpdate(this.awareness, [this.document.clientID]);
			this.emit("awareness", awarenessUpdate);
		}
	}

	private connect() {
		console.log("connecting");
		this.channel = this.supabase.channel(this.configuration.name);
		this.startSync();
	}

	private startSync() {
		this.channel!.on("broadcast", { event: "update" }, event => {
			this.onReceiveUpdate(event);
		})
			.on("broadcast", { event: "awareness" }, ({ payload }) => {
				const update = toUint8Array(payload.awareness);
				applyAwarenessUpdate(this.awareness!, update, this);
			})
			.subscribe((status, err) => {
				console.log("subscribing", status);
				switch (status) {
					case "SUBSCRIBED":
						this.emit("connect", this);
						break;
					case "CHANNEL_ERROR":
						// this.emit('error', this);
						break;
					case "TIMED_OUT":
						this.emit("disconnect", this);
						break;
					case "CLOSED":
						this.emit("disconnect", this);
						break;
					default:
						break;
				}
			});
	}

	private onReceiveUpdate({ event, payload }: { event: string; [key: string]: any }) {
		const update = toUint8Array(payload.dbDocument);
		try {
			this.version++;
			Y.applyUpdate(this.document, update, this);
		} catch (error) {
			console.error(error);
		}
	}

	private disconnect() {
		if (this.channel) {
			this.supabase.removeChannel(this.channel);
			this.channel = null;
		}
	}

	public onDisconnect() {
		this.emit("status", [{ status: "disconnected" }]);

		if (this.awareness) {
			const states = Array.from(this.awareness.getStates().keys()).filter(client => client !== this.document.clientID);
			removeAwarenessStates(this.awareness, states, this);
		}
	}

	public destroy() {
		console.log("destroy");
		this.removeAllListeners();
		this.disconnect();
		this.document.off("update", this.debouncedDocumentUpdateHandler);
		this.awareness?.off("update", this.debouncedAwarenessUpdateHandler);

		if (typeof window !== "undefined") {
			window.removeEventListener("beforeunload", this.removeSelfFromAwarenessOnUnload);
		} else if (typeof process !== "undefined") {
			// @ts-ignore
			process.off("exit", () => this.removeSelfFromAwarenessOnUnload);
		}

		if (this.channel) {
			this.disconnect();
		}
	}
}
