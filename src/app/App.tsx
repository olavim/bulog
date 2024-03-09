import { BucketsProvider } from '@/context/BucketsContext';
import { SandboxProvider } from '@/context/SandboxContext';
import Home from './Home';
import { FiltersProvider } from './context/FiltersContext';
import { LogProvider } from './context/LogContext';

function App() {
	return (
		<SandboxProvider>
			<LogProvider>
				<BucketsProvider>
					<FiltersProvider>
						<Home />
					</FiltersProvider>
				</BucketsProvider>
			</LogProvider>
		</SandboxProvider>
	);
}

export default App;
