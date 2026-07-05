import ASCIIAnimation from "@/components/ascii-animation";
import { DEFAULT_ASCII_APPEARANCE } from "@/lib/ascii-appearance";

export default function ASCIIAnimationPage() {
	return (
		<main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-16">
			<div className="w-full max-w-5xl">
				<ASCIIAnimation
					appearance={DEFAULT_ASCII_APPEARANCE}
					className="min-h-[24rem] overflow-x-auto"
					fps={30}
					frameCount={29}
					frameFolder="frames"
				/>
			</div>
		</main>
	);
}
