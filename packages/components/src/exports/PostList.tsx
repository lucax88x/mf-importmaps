import { useQuery } from "@tanstack/react-query";
import { Button } from "./Button";

interface Post {
	id: number;
	title: string;
	body: string;
}

export function PostList() {
	const { data, isLoading, error } = useQuery<Post[]>({
		queryKey: ["posts"],
		queryFn: () =>
			fetch("https://jsonplaceholder.typicode.com/posts?_limit=5").then((res) =>
				res.json(),
			),
	});

	if (isLoading) return <p>Loading posts...</p>;
	if (error) return <p>Error loading posts: {(error as Error).message}</p>;

	return (
		<div>
			<ul style={{ textAlign: "left", paddingLeft: "1.5rem" }}>
				{data?.map((post) => (
					<li key={post.id} style={{ marginBottom: "0.5rem" }}>
						<strong>{post.title}</strong>
					</li>
				))}
			</ul>
			<Button
				label="Click me"
				onClick={() => alert("Button in PostList clicked!")}
			/>
		</div>
	);
}
