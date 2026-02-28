export interface YellowButtonProps {
  label?: string
  onClick?: () => void
}

export function YellowButton({ label = 'Yellow Button', onClick }: YellowButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '4px',
        border: '1px solid #b8860b',
        cursor: 'pointer',
        backgroundColor: '#ffd700',
        color: '#333',
        fontWeight: 'bold',
      }}
    >
      {label}
    </button>
  )
}
