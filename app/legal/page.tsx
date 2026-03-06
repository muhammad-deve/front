import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Scale, ShieldCheck, AlertTriangle, FileText, Globe, Mail } from "lucide-react"
import Link from "next/link"

export default function LegalPage() {
    return (
        <main className="min-h-screen bg-background">
            <Header />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

                <div className="relative container mx-auto px-4 pt-28 lg:pt-36 pb-12">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/10">
                            <Scale className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                            Legal <span className="text-primary">Information</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                            Transparency matters. Here&apos;s everything you need to know about how StreamVault operates.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Disclaimer */}
            <section className="container mx-auto px-4 pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-8 lg:p-10 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />

                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-1">Content Disclaimer</h2>
                                <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                StreamVault does not host, store, upload, or distribute any media content — including but
                                not limited to movies, television series, live broadcasts, or any audiovisual material — on
                                its servers or within its databases.
                            </p>
                            <p>
                                All content accessible through this platform is sourced from publicly available, third-party
                                providers and external services. StreamVault functions exclusively as an aggregation and
                                indexing service, providing users with a convenient interface to discover and access content
                                that is already freely available on the internet.
                            </p>
                            <p>
                                StreamVault does not claim ownership or control over any of the content displayed.
                                All trademarks, copyrights, and intellectual property rights belong to their respective
                                owners and content creators.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Legal Sections */}
            <section className="container mx-auto px-4 pb-12">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* DMCA / Copyright */}
                    <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">DMCA & Copyright Notices</h2>
                        </div>
                        <div className="space-y-3 text-muted-foreground leading-relaxed">
                            <p>
                                If you believe that any content indexed by StreamVault infringes on your copyright or
                                intellectual property rights, please contact us immediately. We take copyright claims
                                seriously and will promptly review and address all legitimate requests.
                            </p>
                            <p>
                                To submit a DMCA takedown notice, please include the following information: a description
                                of the copyrighted work, the specific URL or location of the allegedly infringing content,
                                your contact information, and a statement of good faith belief that the use is not authorized.
                            </p>
                        </div>
                    </div>

                    {/* Terms of Use */}
                    <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Terms of Use</h2>
                        </div>
                        <div className="space-y-3 text-muted-foreground leading-relaxed">
                            <p>
                                By accessing and using StreamVault, you acknowledge and agree that the platform is
                                provided &quot;as is&quot; without warranties of any kind, whether express or implied.
                            </p>
                            <p>
                                Users are solely responsible for ensuring their use of the platform complies with all
                                applicable local, national, and international laws and regulations. StreamVault shall not
                                be held liable for any misuse of the platform or its services by its users.
                            </p>
                            <p>
                                We reserve the right to modify, suspend, or discontinue any aspect of the platform at
                                any time without prior notice.
                            </p>
                        </div>
                    </div>

                    {/* Privacy */}
                    <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Privacy & Data</h2>
                        </div>
                        <div className="space-y-3 text-muted-foreground leading-relaxed">
                            <p>
                                StreamVault is committed to protecting user privacy. We do not collect, sell, or share
                                personal information with third parties for advertising or marketing purposes.
                            </p>
                            <p>
                                Minimal data may be collected solely for the purpose of improving user experience and
                                platform functionality. No intrusive tracking, analytics cookies, or fingerprinting
                                technologies are employed.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact for Legal */}
            <section className="container mx-auto px-4 pb-16">
                <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-card to-secondary/30 border border-border rounded-2xl p-8">
                    <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-3">Legal Inquiries</h2>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        For any legal matters, DMCA requests, or questions regarding our policies, please reach out to us directly.
                    </p>
                    <a
                        href="https://t.me/deve_muhammad"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        Contact Us on Telegram
                    </a>
                </div>
            </section>

            <Footer />
        </main>
    )
}
