import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SandboxProvider } from '@app/context/SandboxContext';
import { Home } from './Home';

const queryClient = new QueryClient();

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<SandboxProvider>
				<Home />
			</SandboxProvider>
		</QueryClientProvider>
	);
}
