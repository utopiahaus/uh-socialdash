export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">UH SocialDash</h1>
        <p className="mt-4 text-muted-foreground">
          Instagram Analytics Dashboard
        </p>
        <a
          href="/dashboard"
          className="mt-8 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
