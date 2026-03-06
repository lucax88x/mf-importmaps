import { navigate } from "./main";

export default function About() {
	return (
		<div
			style={{
				padding: "2rem",
				fontFamily: "system-ui, sans-serif",
				maxWidth: "600px",
				margin: "0 auto",
			}}
		>
			<nav style={{ marginBottom: "1rem" }}>
				<a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Home</a>
				{" | "}
				<a href="/about" onClick={(e) => { e.preventDefault(); navigate("/about"); }}>About</a>
			</nav>
			<h1>About</h1>
			<p>
				This is a microfrontend shell example using <code>@mf/vite-plugin</code>{" "}
				with import maps.
			</p>
		</div>
	);
}
