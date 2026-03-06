import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ErrorInfo, ReactNode } from "react";
import { Component, StrictMode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import About from "./About";
import App from "./App";
import "./app.css";

function subscribeToLocation(callback: () => void) {
	window.addEventListener("popstate", callback);
	return () => window.removeEventListener("popstate", callback);
}

function getLocationPath() {
	return window.location.pathname;
}

export function navigate(to: string) {
	window.history.pushState(null, "", to);
	window.dispatchEvent(new PopStateEvent("popstate"));
}

function Router() {
	const pathname = useSyncExternalStore(subscribeToLocation, getLocationPath);

	switch (pathname) {
		case "/about":
			return <About />;
		default:
			return <App />;
	}
}

class ErrorBoundary extends Component<
	{ children: ReactNode },
	{ hasError: boolean; error: Error | null }
> {
	constructor(props: { children: ReactNode }) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("[Shell ErrorBoundary]", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: "2rem", color: "red", fontFamily: "monospace" }}>
					<h1>Shell Error</h1>
					<pre>{this.state.error?.message}</pre>
					<pre>{this.state.error?.stack}</pre>
				</div>
			);
		}
		return this.props.children;
	}
}

console.log("Starting microfrontend shell...");

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<Router />
			</QueryClientProvider>
		</ErrorBoundary>
	</StrictMode>,
);
