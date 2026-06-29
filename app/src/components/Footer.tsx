export function Footer() {
  return (
    <footer className="w-full py-3 px-4 flex items-center justify-center border-t border-brand-hairline bg-brand-gray/80 backdrop-blur-sm">
      <p className="text-[11px] font-medium tracking-wide text-brand-muted/70 select-none">
        Made by{' '}
        <span className="font-semibold text-brand-dark">Shanawaz</span>
        {' '}for{' '}
        <span className="font-semibold text-brand-red">Jamshedpur</span>
        {' '}
        <span
          role="img"
          aria-label="heart"
          className="text-brand-red inline-block animate-[heartbeat_1.4s_ease-in-out_infinite]"
        >
          ❤️
        </span>
      </p>
    </footer>
  )
}
