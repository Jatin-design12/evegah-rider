export default function ChartCard({
  id,
  title,
  subtitle,
  actions,
  children,
  bodyClassName = "",
}) {
  return (
    <section id={id} className="bg-white rounded-xl border shadow-sm">
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 px-4 pt-4">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
