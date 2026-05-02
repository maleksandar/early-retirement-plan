export function FieldTooltip({ text }: { text: string }) {
  return (
    <span className='tip'>
      <span className='tip-icon' aria-hidden='true'>
        i
      </span>
      <span className='tip-bubble' role='tooltip'>
        {text}
      </span>
    </span>
  );
}
