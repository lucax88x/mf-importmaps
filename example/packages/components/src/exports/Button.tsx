export interface ButtonProps {
  label?: string
  onClick?: () => void
}

export function Button({ label = 'Click me', onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        cursor: 'pointer',
        backgroundColor: '#f0f0f0',
      }}
    >
      {label}
    </button>
  )
}
