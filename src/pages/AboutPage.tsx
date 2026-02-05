import { Heart, Award, Users, Sparkles } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative py-24 gradient-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920')] bg-cover bg-center opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="inline-block text-white/80 font-sans text-sm uppercase tracking-widest mb-4">
            Our Story
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 max-w-3xl mx-auto">
            Where Tradition Meets
            <br />
            <span className="italic">Modern Elegance</span>
          </h1>
          <p className="text-white/80 font-sans text-lg max-w-2xl mx-auto">
            For over a decade, Mahamitra Boutique has been celebrating the grace and beauty
            of Indian women through exquisite handcrafted apparel.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-primary font-sans text-sm uppercase tracking-widest">
                The Beginning
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold">
                A Dream Woven with Love
              </h2>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Mahamitra Boutique was born from a passion to preserve India's rich textile
                heritage while embracing contemporary fashion. Founded in 2014, we started
                as a small family-owned boutique in the heart of Coimbatore, Tamil Nadu, with a vision to
                bring the finest handcrafted apparel to women who appreciate quality and elegance.
              </p>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Under the leadership of Ms. Ramya, our Managing Partner, we've grown into a beloved brand, trusted by thousands of customers
                across the country. But our core values remain unchanged – quality craftsmanship,
                ethical sourcing, and a commitment to celebrating every woman's unique beauty.
              </p>
              <p className="text-muted-foreground font-sans leading-relaxed">
                Every saree we curate, every kurta we design, and every outfit we create tells
                a story – a story of skilled artisans, timeless traditions, and the modern Indian woman.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"
                alt="Boutique story"
                className="rounded-2xl shadow-luxe-lg"
              />
              <div className="absolute -bottom-6 -left-6 bg-accent text-white p-6 rounded-xl shadow-lg hidden md:block">
                <p className="font-serif text-3xl font-semibold">10+</p>
                <p className="font-sans text-sm">Years of Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-sans text-sm uppercase tracking-widest">
              Our Values
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mt-4">
              What We Stand For
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Heart,
                title: 'Passion for Craft',
                description: 'Every piece is crafted with love and attention to detail by skilled artisans.',
              },
              {
                icon: Award,
                title: 'Quality First',
                description: 'We source only the finest fabrics and maintain strict quality standards.',
              },
              {
                icon: Users,
                title: 'Women Empowerment',
                description: 'Supporting women artisans and celebrating feminine strength through fashion.',
              },
              {
                icon: Sparkles,
                title: 'Timeless Elegance',
                description: 'Creating pieces that transcend trends and become treasured wardrobe staples.',
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 text-center shadow-luxe hover:shadow-luxe-lg transition-all hover-lift"
              >
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon size={28} className="text-white" />
                </div>
                <h3 className="font-serif text-xl font-medium mb-3">{value.title}</h3>
                <p className="text-muted-foreground font-sans text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800"
                alt="Our mission"
                className="rounded-2xl shadow-luxe-lg"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <span className="text-primary font-sans text-sm uppercase tracking-widest">
                Our Mission
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold">
                Empowering Women Through Fashion
              </h2>
              <p className="text-muted-foreground font-sans leading-relaxed">
                At Mahamitra, we believe that fashion is more than just clothing – it's a form
                of self-expression, confidence, and empowerment. Our mission is to provide
                every woman with apparel that makes her feel beautiful, confident, and proud
                of her heritage.
              </p>
              <p className="text-muted-foreground font-sans leading-relaxed">
                We're committed to supporting women artisans across India, preserving
                traditional crafts while providing fair wages and sustainable livelihoods.
                When you shop with us, you're not just buying clothes – you're supporting
                a movement of women empowerment and cultural preservation.
              </p>
              <Button asChild className="gradient-primary text-primary-foreground">
                <Link to="/shop">Explore Our Collection</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '10,000+', label: 'Happy Customers' },
              { number: '500+', label: 'Unique Designs' },
              { number: '10+', label: 'Artisan Partners' },
              { number: '25+', label: 'Cities Served' },
            ].map((stat, index) => (
              <div key={index}>
                <p className="font-serif text-3xl md:text-4xl font-semibold text-primary">
                  {stat.number}
                </p>
                <p className="font-sans text-sm text-background/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
            Join the Mahamitra Family
          </h2>
          <p className="text-muted-foreground font-sans max-w-2xl mx-auto mb-8">
            Experience the joy of wearing beautifully crafted apparel that celebrates your
            unique style. Start your journey with us today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gradient-primary text-primary-foreground">
              <Link to="/shop">Shop Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default AboutPage;
