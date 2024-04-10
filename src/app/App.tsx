import { SandboxProvider } from '@context/SandboxContext';
import { Home } from './Home';

export function App() {
	return (
		<SandboxProvider>
			<Home />
		</SandboxProvider>
	);
}
