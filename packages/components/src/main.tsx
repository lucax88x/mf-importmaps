import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Component, StrictMode } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./app.css";

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
		console.error("[Components ErrorBoundary]", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: "2rem", color: "red", fontFamily: "monospace" }}>
					<h1>Components Error</h1>
					<pre>{this.state.error?.message}</pre>
					<pre>{this.state.error?.stack}</pre>
				</div>
			);
		}
		return this.props.children;
	}
}

console.log("Starting microfrontend components...");

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</ErrorBoundary>
	</StrictMode>,
);
