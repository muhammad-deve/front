import { Header } from "@/components/header"
import { SignInForm } from "@/components/sign-in-form"

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <SignInForm />
      </div>
    </main>
  )
}
