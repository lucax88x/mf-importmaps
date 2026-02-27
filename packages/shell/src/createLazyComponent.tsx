import {
	Component,
	type ComponentProps,
	type ComponentType,
	type ErrorInfo,
	lazy,
	type ReactNode,
	Suspense,
} from "react";

class ErrorBoundary extends Component<
	{ fallback: ReactNode; children: ReactNode },
	{ hasError: boolean }
> {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("Failed to load component:", error, info);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}

interface LazyOptions {
	loading?: ReactNode;
	error?: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLazyComponent<T extends ComponentType<any>>(
	factory: Parameters<typeof lazy>[0],
	options?: LazyOptions,
) {
	const LazyComponent = lazy(factory);

	const Wrapped = (props: ComponentProps<T>) => (
		<ErrorBoundary
			fallback={options?.error ?? <div>Failed to load component.</div>}
		>
			<Suspense fallback={options?.loading ?? <div>Loading...</div>}>
				<LazyComponent {...(props as Record<string, unknown>)} />
			</Suspense>
		</ErrorBoundary>
	);

	// Wrapped.displayName = `Lazy(${LazyComponent.displayName ?? "Component"})`;
	return Wrapped;
}
