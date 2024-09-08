import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const registerUserToResend = async (email: string, name?: string | null) => {
	if (process.env.NODE_ENV === "production") {
		await resend.contacts.create({
			audienceId: "e81314a1-919c-4b0d-b0a3-20b6e8609ed2",
			email,
			firstName: name ?? undefined,
		});
		console.log("User registered to Resend.");
	} else {
		console.log("Skipping user registration to Resend in non-production environment.");
	}
};
