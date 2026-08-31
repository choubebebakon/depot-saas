import { Component } from 'react';
import { normalizeApiError } from '../shared/utils/apiError';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    const normalized = normalizeApiError(error);
    console.error('[ErrorBoundary]', { error, normalized, componentStack: info?.componentStack });
  }

  handleRetry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      const message = normalizeApiError(this.state.error).message;
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6" role="alert">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10" aria-hidden="true">⚠️</div>
            <h2 className="mb-2 text-lg font-black text-white">Une erreur est survenue</h2>
            <p className="mb-6 text-sm text-slate-400">{message}</p>
            <button type="button" onClick={this.handleRetry} className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
