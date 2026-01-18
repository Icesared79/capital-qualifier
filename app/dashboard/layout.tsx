export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Dashboard pages have their own headers, so we just render children
  // This layout overrides the root layout's Header/Footer rendering
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {children}
    </div>
  )
}
