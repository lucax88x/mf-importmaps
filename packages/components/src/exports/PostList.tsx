import { useQuery } from "@tanstack/react-query";
import { Button } from "./Button";

import "../app.css";

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
			<ul className="text-left pl-6 space-y-2">
				{data?.map((post) => (
					<li key={post.id} className="text-red-600 font-semibold">
						{post.title}
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
