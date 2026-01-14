import { Header } from "@/components/header"
import { SignUpFlow } from "@/components/sign-up-flow"

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8">
        <SignUpFlow />
      </div>
    </main>
  )
}
