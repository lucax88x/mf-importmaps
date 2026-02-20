import { useState } from 'react'
// All imports from @mf/components — loading the module also registers <mf-button>
import { Button, MfButton, calculate } from '@mf/components'

// Reference MfButton so the import isn't dropped (it registers the custom element)
console.log('Web component registered:', MfButton.name)

export default function App() {
  const [count, setCount] = useState(0)
  const [result, setResult] = useState<number | null>(null)

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <h1>Microfrontend Shell</h1>
      <p>
        All imports below come from <code>@mf/components</code> via import maps
        (in production build).
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2>1. React Component</h2>
        <p>
          Directly imported and rendered as a React component:
        </p>
        <Button
          label={`Clicked ${count} times`}
          onClick={() => setCount((c) => c + 1)}
        />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>2. Web Component</h2>
        <p>
          Used as a custom element <code>&lt;mf-button&gt;</code>:
        </p>
        <mf-button label="I'm a Web Component!"></mf-button>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>3. Utility Function</h2>
        <p>
          Using the <code>calculate()</code> function:
        </p>
        <button
          onClick={() => setResult(calculate(6, 7, 'multiply'))}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Calculate 6 x 7
        </button>
        {result !== null && (
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Result: {result}
          </p>
        )}
      </section>
    </div>
  )
}
