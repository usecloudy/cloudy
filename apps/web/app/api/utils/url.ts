export const getAppBaseUrl = () => {
	// For local development
	if (process.env.NODE_ENV === "development") {
		return "http://localhost:3000";
	}

	// Fallback to APP_URL environment variable
	return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const getWebBaseUrl = () => {
	// For local development
	if (process.env.NODE_ENV === "development") {
		return "http://localhost:3001";
	}

	// Fallback to VERCEL_URL environment variable
	return process.env.VERCEL_URL || "http://localhost:3001";
};
