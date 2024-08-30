import axios from "axios";

import { supabase } from "src/clients/supabase";

export const apiClient = axios.create({
	baseURL: process.env.REACT_APP_API_BASE_URL,
	timeout: 20000,
	headers: {},
});

const setHeader = (key: string, value: string) => {
	apiClient.defaults.headers.common[key] = value;
};

export const setupAuthHeader = async () => {
	const { data } = await supabase.auth.getSession();

	if (data.session?.access_token) {
		å;
		setHeader("Authorization", `Bearer ${data.session.access_token}`);
	}
};

if (process.env.REACT_APP_VERCEL_PROTECTION_BYPASS_KEY) {
	setHeader("x-vercel-protection-bypass", process.env.REACT_APP_VERCEL_PROTECTION_BYPASS_KEY);
}
