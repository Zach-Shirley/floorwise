import { Component, type ReactNode } from 'react';

/**
 * Keeps a bug in one panel from blanking the whole app: shows a small notice
 * instead, and recovers when `resetKey` changes (e.g. a new selection).
 */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string; label: string }, { error: Error | null; key?: string }> {
  state: { error: Error | null; key?: string } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  static getDerivedStateFromProps(props: { resetKey?: string }, state: { error: Error | null; key?: string }) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }
  componentDidCatch(error: Error) {
    console.error(`[${this.props.label}]`, error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="panel-error">
        <b>Something went wrong in the {this.props.label}.</b>
        <span>{this.state.error.message}</span>
        <button onClick={() => this.setState({ error: null })}>Try again</button>
      </div>
    );
  }
}
