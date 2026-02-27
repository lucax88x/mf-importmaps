import { Button, MfButton } from "@mf/components";
import { calculate } from "@mf/components/calculate";
import { PostList } from "@mf/components/PostList";
import { YellowButton } from "@mf/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LazySlowButton } from "./LazySlowButton";

// Reference MfButton so the import isn't dropped (it registers the custom element)
console.log("Web component registered:", MfButton.name);

interface User {
	id: number;
	name: string;
	email: string;
}

function ShellUserList() {
	const { data, isLoading, error } = useQuery<User[]>({
		queryKey: ["users"],
		queryFn: () =>
			fetch("https://jsonplaceholder.typicode.com/users?_limit=5").then((res) =>
				res.json(),
			),
	});

	if (isLoading) return <p>Loading users...</p>;
	if (error) return <p>Error: {(error as Error).message}</p>;

	return (
		<ul className="text-left pl-6 space-y-2">
			{data?.map((user) => (
				<li key={user.id} className="text-blue-600 font-semibold">
					{user.name} — {user.email}
				</li>
			))}
		</ul>
	);
}

export default function App() {
	const [count, setCount] = useState(0);
	const [result, setResult] = useState<number | null>(null);

	return (
		<div
			style={{
				padding: "2rem",
				fontFamily: "system-ui, sans-serif",
				maxWidth: "600px",
				margin: "0 auto",
			}}
		>
			<h1>Microfrontend Shell</h1>
			<p>
				All imports below come from <code>@mf/components</code> via import maps
				(in production build).
			</p>

			<section style={{ marginBottom: "2rem" }}>
				<h2>1. React Component</h2>
				<p>Directly imported and rendered as a React component:</p>
				<Button
					label={`Clicked ${count} times`}
					onClick={() => setCount((c) => c + 1)}
				/>
			</section>

			<section style={{ marginBottom: "2rem" }}>
				<h2>2. Web Component</h2>
				<p>
					Used as a custom element <code>&lt;mf-button&gt;</code>:
				</p>
				<mf-button label="I'm a Web Component!"></mf-button>
			</section>

			<section style={{ marginBottom: "2rem" }}>
				<h2>3. Utility Function</h2>
				<p>
					Using the <code>calculate()</code> function:
				</p>
				<button
					onClick={() => setResult(calculate(6, 7, "multiply"))}
					style={{ padding: "8px 16px", cursor: "pointer" }}
				>
					Calculate 6 x 7
				</button>
				{result !== null && (
					<p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
						Result: {result}
					</p>
				)}
			</section>

			<section style={{ marginBottom: "2rem" }}>
				<h2>4. React Query — Remote Component</h2>
				<p>
					<code>PostList</code> from <code>@mf/components</code> uses{" "}
					<code>useQuery</code> internally:
				</p>
				<PostList />
			</section>

			<section style={{ marginBottom: "2rem" }}>
				<h2>5. React Query — Shell Local</h2>
				<p>
					<code>useQuery</code> used directly in the shell app (same{" "}
					<code>QueryClient</code>):
				</p>
				<ShellUserList />
			</section>

			<section style={{ marginBottom: "2rem" }}>
				<h2>6. YellowButton from @mf/ui (direct)</h2>
				<p>
					Imported directly from <code>@mf/ui</code> in the shell:
				</p>
				<YellowButton label="Direct from @mf/ui in shell!" />
			</section>

			<section style={{ marginBottom: "2rem" }}>
				<h2>Slow import</h2>
				<LazySlowButton text2="ciao" />
			</section>
		</div>
	);
}
