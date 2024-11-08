import Image from "next/image";
import Link from "next/link";

import LogoPng from "app/assets/logo.png";

export const Navbar = () => {
	return (
		<nav className="flex w-full items-center justify-center">
			<Link href="/">
				<div className="flex items-center justify-between py-4">
					<Image src={LogoPng} alt="Cloudy" width={128} height={128} className="w-14" />
				</div>
			</Link>
		</nav>
	);
};
