import { SandboxProvider } from '@/context/SandboxContext';
import Home from './Home';

function App() {
	return (
		<SandboxProvider>
			<Home />
		</SandboxProvider>
	);
}

export default App;
