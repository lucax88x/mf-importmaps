import { useState } from "react";
import { YellowButton } from "./exports/YellowButton";

export default function App() {
	const [count, setCount] = useState(0);

	return (
		<div
			style={{
				padding: "2rem",
				fontFamily: "system-ui, sans-serif",
				maxWidth: "600px",
				margin: "0 auto",
			}}
		>
			<h1>Microfrontend UI</h1>

			<section style={{ marginBottom: "2rem" }}>
				<h2>YellowButton</h2>
				<p>A yellow button component:</p>
				<YellowButton
					label={`Clicked ${count} times`}
					onClick={() => setCount((c) => c + 1)}
				/>
			</section>
		</div>
	);
}
