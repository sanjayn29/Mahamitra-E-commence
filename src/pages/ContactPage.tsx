import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Instagram, Facebook, MessageCircle } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import emailjs from 'emailjs-com';
import { CONTACT_INFO } from '@/constants/contact';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // EmailJS Configuration for Mahamitra Ecommerce
    const serviceId = 'service_a0m592k';
    const adminTemplateId = 'template_tad9tyj'; // Contact Us Template
    const userTemplateId = 'template_fxajsfq'; // Welcome Template
    const publicKey = 'otpRPlxO39dpVAhXz';

    try {
      // Send notification to admin
      await emailjs.send(
        serviceId,
        adminTemplateId,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          from_email: CONTACT_INFO.email.primary,
          time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
        },
        publicKey
      );

      // Send confirmation to user
      await emailjs.send(
        serviceId,
        userTemplateId,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          from_email: CONTACT_INFO.email.primary
        },
        publicKey
      );

      toast.success('Message sent successfully!', {
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      console.error('EmailJS Error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      {/* Hero */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">
            Get in Touch
          </h1>
          <p className="text-muted-foreground font-sans max-w-2xl mx-auto mb-6">
            Have a question about our products or want to share feedback?
            We'd love to hear from you!
          </p>
          <div className="bg-card/50 backdrop-blur-sm rounded-lg px-4 py-3 inline-flex items-center gap-2 border border-border/50">
            <span className="text-sm font-medium">GSTIN:</span>
            <span className="text-primary font-mono text-sm font-semibold">{CONTACT_INFO.company.gstin}</span>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-card rounded-xl shadow-luxe p-8">
              <h2 className="font-serif text-2xl font-semibold mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder={CONTACT_INFO.phone.display}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="How can we help?"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us more..."
                    rows={5}
                    required
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full gradient-primary text-primary-foreground disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl shadow-luxe p-6">
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <h3 className="font-serif text-lg font-medium mb-2">Visit Us</h3>
                  <p className="text-muted-foreground font-sans text-sm">
                    210F, 1st Floor, Bharathiar Road,<br />
                    New Sidhapudur, Coimbatore – 641044,<br />
                    Tamil Nadu
                  </p>
                  <p className="text-muted-foreground font-sans text-xs mt-2">
                    <strong>GSTIN:</strong> 33AQWPR5424R1ZT
                  </p>
                </div>

                <div className="bg-card rounded-xl shadow-luxe p-6">
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
                    <Phone size={24} className="text-white" />
                  </div>
                  <h3 className="font-serif text-lg font-medium mb-2">Call Us</h3>
                  <p className="text-muted-foreground font-sans text-sm">
                    <a href="tel:9500844405" className="hover:text-primary transition-colors">+91 95008 44405</a><br />
                    <span className="text-xs">Ms. Ramya, Managing Partner</span>
                  </p>
                </div>

                <div className="bg-card rounded-xl shadow-luxe p-6">
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
                    <Mail size={24} className="text-white" />
                  </div>
                  <h3 className="font-serif text-lg font-medium mb-2">Email Us</h3>
                  <p className="text-muted-foreground font-sans text-sm">
                    {CONTACT_INFO.email.primary}<br />
                    {CONTACT_INFO.email.support}
                  </p>
                </div>

                <div className="bg-card rounded-xl shadow-luxe p-6">
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mb-4">
                    <Clock size={24} className="text-white" />
                  </div>
                  <h3 className="font-serif text-lg font-medium mb-2">Business Hours</h3>
                  <p className="text-muted-foreground font-sans text-sm">
                    Mon - Sat: 10:00 AM - 8:00 PM<br />
                    Sunday: 11:00 AM - 6:00 PM
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-muted rounded-xl p-6">
                <h3 className="font-serif text-lg font-medium mb-4">Connect With Us</h3>
                <div className="flex gap-4">
                  <a
                    href={CONTACT_INFO.social.instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-card rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow"
                  >
                    <Instagram size={24} />
                  </a>
                  <a
                    href="https://www.sanjayn.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-card rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow"
                  >
                    <Facebook size={24} />
                  </a>
                  <a
                    href="https://www.sanjayn.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-card rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow"
                  >
                    <MessageCircle size={24} />
                  </a>
                </div>
                <p className="text-muted-foreground font-sans text-sm mt-4">
                  Follow us for style inspiration, new arrivals, and exclusive offers!
                </p>
              </div>

              {/* Google Maps */}
              <div className="bg-muted rounded-xl h-64 overflow-hidden">
                <iframe
                  src={CONTACT_INFO.maps.embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mahamitra Location - Bharathiar Road, Coimbatore"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground font-sans mb-8 max-w-xl mx-auto">
            Find quick answers to common questions about orders, shipping, returns, and more.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { q: 'What are the shipping charges?', a: 'Free shipping on orders above ₹2,999. Otherwise, ₹199 flat rate.' },
              { q: 'How do I return an item?', a: '7-day hassle-free returns. Contact us to initiate a return.' },
              { q: 'Do you offer COD?', a: 'Yes! Cash on Delivery is available across India.' },
            ].map((faq, index) => (
              <div key={index} className="bg-card rounded-xl p-6 text-left shadow-sm">
                <h4 className="font-sans font-medium mb-2">{faq.q}</h4>
                <p className="text-muted-foreground font-sans text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ContactPage;
