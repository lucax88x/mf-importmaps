await new Promise((resolve) => setTimeout(resolve, 1000));

export function SlowButton({ text2 }: { text2: string }) {
	return (
		<button
			style={{
				padding: "8px 16px",
				borderRadius: "4px",
				border: "2px solid #e74c3c",
				cursor: "pointer",
				backgroundColor: "#ffcccc",
				color: "#c0392b",
				fontWeight: "bold",
			}}
		>
			Slow Button (loaded after 1s) after: {text2}
		</button>
	);
}
