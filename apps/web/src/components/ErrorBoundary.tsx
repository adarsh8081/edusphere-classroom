import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallbackMessage?: string; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: any) {
        console.error('[ErrorBoundary] Caught error:', error, info)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 glass-panel border-white/10 rounded-3xl m-4 backdrop-blur-3xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-2xl font-display font-bold text-red-500 drop-shadow-sm">
                        Something went wrong
                    </h2>
                    <p className="text-muted-foreground text-center max-w-md">
                        {this.props.fallbackMessage ?? 'An unexpected error occurred in this section.'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-4 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all shadow-lg hover:shadow-primary/20 active:scale-95"
                    >
                        Try Again
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
