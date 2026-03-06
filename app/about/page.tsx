import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Play, Film, Tv, Radio, Globe, Shield, Zap, Users } from "lucide-react"
import Link from "next/link"
import { AnimatedCounter } from "@/components/animated-counter"

export default function AboutPage() {
    const features = [
        {
            icon: Film,
            title: "Vast Movie Library",
            description:
                "Browse thousands of movies across every genre — from timeless classics to the latest blockbusters, all in one place.",
        },
        {
            icon: Tv,
            title: "TV Series Collection",
            description:
                "Binge-worthy series with full season and episode listings, keeping you up to date with every release.",
        },
        {
            icon: Radio,
            title: "Live TV Channels",
            description:
                "Stream live television channels from around the world, bringing real-time entertainment to your fingertips.",
        },
        {
            icon: Globe,
            title: "Global Content",
            description:
                "Content sourced from every corner of the globe — Hollywood, Bollywood, anime, K-dramas, and more.",
        },
        {
            icon: Shield,
            title: "No Ads, No Tracking",
            description:
                "We believe in a clean viewing experience. No intrusive ads, no tracking cookies, no data harvesting.",
        },
        {
            icon: Zap,
            title: "Lightning Fast",
            description:
                "Built on modern technology for instant search, smooth playback, and a seamless browsing experience.",
        },
    ]

    return (
        <main className="min-h-screen bg-background">
            <Header />

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

                <div className="relative container mx-auto px-4 pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8">
                            <Play className="w-4 h-4 text-primary fill-primary" />
                            <span className="text-sm text-primary font-medium">About StreamVault</span>
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                            Your Premium{" "}
                            <span className="text-primary">Streaming</span>{" "}
                            Destination
                        </h1>
                        <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            StreamVault is built by passionate movie lovers, for movie lovers. We bring together
                            the world&apos;s entertainment into a single, beautifully crafted platform — free from
                            clutter, ads, and distractions.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="container mx-auto px-4 pb-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {[
                        { value: 86776, label: "Movies" },
                        { value: 17992, label: "TV Series" },
                        { value: 2416, label: "Live Channels" },
                        { staticText: "24/7", label: "Availability" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/40 transition-colors"
                        >
                            <p className="text-3xl lg:text-4xl font-bold text-primary mb-1">
                                {stat.staticText ? stat.staticText : <AnimatedCounter value={stat.value as number} />}
                            </p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mission Section */}
            <section className="container mx-auto px-4 pb-16">
                <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl p-8 lg:p-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Our Mission</h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                        <p>
                            We started StreamVault with a simple belief — everyone deserves access to great entertainment
                            without barriers. No subscriptions, no paywalls, no compromise on quality.
                        </p>
                        <p>
                            Our platform aggregates and indexes content from publicly available sources across the internet,
                            presenting it in a sleek, organized, and easy-to-navigate interface. Whether you&apos;re in the mood for a
                            Hollywood thriller, a Korean drama, an anime adventure, or live news coverage, StreamVault has
                            you covered.
                        </p>
                        <p>
                            We&apos;re a small, independent team driven by our love for cinema and technology. Every feature,
                            every design choice, and every line of code is crafted with care to deliver the best possible
                            experience to our users.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto px-4 pb-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">What Makes Us Different</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Built with modern technology and a passion for great design.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <feature.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4 pb-16">
                <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-2xl p-8 lg:p-12">
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                        Want to Support Us?
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        StreamVault is free and always will be. If you love what we do, consider supporting the project.
                    </p>
                    <Link
                        href="/support-us"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        Support StreamVault
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    )
}
