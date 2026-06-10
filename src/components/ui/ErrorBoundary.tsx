import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center rounded-lg border border-red-800 bg-red-950 text-sm text-red-400">
          Failed to load card
        </div>
      );
    }
    return this.props.children;
  }
}
