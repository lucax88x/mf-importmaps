import { useState } from "react";
import { BaseSelect } from "./exports/BaseSelect";
import { MuiSelect } from "./exports/MuiSelect";
import { YellowButton } from "./exports/YellowButton";

const fruitOptions = [
	{ value: "apple", label: "Apple" },
	{ value: "banana", label: "Banana" },
	{ value: "cherry", label: "Cherry" },
	{ value: "dragonfruit", label: "Dragonfruit" },
];

export default function App() {
	const [count, setCount] = useState(0);
	const [fruit, setFruit] = useState("");

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

			<section style={{ marginBottom: "2rem" }}>
				<h2>MUI Select</h2>
				<p>Selected: {fruit || "none"}</p>
				<MuiSelect
					label="Fruit"
					value={fruit}
					options={fruitOptions}
					onChange={setFruit}
				/>
			</section>

			<section style={{ marginBottom: "2rem" }}>
				<h2>Base Select</h2>
				<p>Selected: {fruit || "none"}</p>
				<BaseSelect options={fruitOptions} />
			</section>
		</div>
	);
}
