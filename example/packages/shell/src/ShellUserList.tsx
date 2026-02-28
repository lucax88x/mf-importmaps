import { useQuery } from "@tanstack/react-query";

interface User {
	id: number;
	name: string;
	email: string;
}

export function ShellUserList() {
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
