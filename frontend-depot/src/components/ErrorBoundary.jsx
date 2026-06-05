import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-white font-black text-lg mb-2">Une erreur est survenue</h2>
            <p className="text-slate-400 text-sm mb-6">
              {this.state.error?.message || 'Erreur inattendue'}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all text-sm"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
