import { BucketsProvider } from "@/components/BucketsProvider";
import { CodeSandboxProvider } from "@/components/CodeSandboxProvider";
import Home from "./Home";

function App() {
  return (
    <CodeSandboxProvider>
      <BucketsProvider>
        <Home />
      </BucketsProvider>
    </CodeSandboxProvider>
  );
}

export default App;
