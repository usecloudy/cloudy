// These hashes are for algorithmic use cases, such as bucketing in hashtables, where security isn't
// needed and 32 or 64 bits is enough (that is, rare collisions are acceptable). These are way simpler
// than sha1 (and all its deps) or similar, and with a short, clean (base 36 alphanumeric) result.

// A simple, *insecure* 32-bit hash that's short, fast, and has no dependencies.
// Output is always 7 characters.
// Loosely based on the Java version; see
// https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
export const simpleHash = (str: string): string => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
	}
	// Convert to 32bit unsigned integer in base 36 and pad with "0" to ensure length is 7.
	return (hash >>> 0).toString(36).padStart(7, "0");
};
