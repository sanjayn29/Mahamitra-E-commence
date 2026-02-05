import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CONTACT_INFO } from '@/constants/contact';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      

      {/* Main Footer */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <Link to="/" className="inline-block mb-4">
                <span className="font-serif text-2xl font-semibold text-background">
                  Mahamitra
                </span>
                <span className="block text-xs text-background/70 tracking-[0.3em] uppercase font-sans">
                  Boutique
                </span>
              </Link>
              <p className="text-background/70 text-sm font-sans mb-4">
                Celebrating the grace and elegance of Indian women through timeless fashion.
                From traditional sarees to contemporary designs, we bring you the finest apparel.
              </p>
              <div className="flex gap-4">
                <a href={CONTACT_INFO.social.instagram.url} target="_blank" rel="noopener noreferrer" className="text-background/70 hover:text-primary transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" className="text-background/70 hover:text-primary transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-background/70 hover:text-primary transition-colors">
                  <Twitter size={20} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-serif text-lg font-semibold text-background mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2 font-sans text-sm">
                <li>
                  <Link to="/shop" className="text-background/70 hover:text-primary transition-colors">
                    Shop All
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=women" className="text-background/70 hover:text-primary transition-colors">
                    Women's Collection
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=girls" className="text-background/70 hover:text-primary transition-colors">
                    Girls' Collection
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=babies" className="text-background/70 hover:text-primary transition-colors">
                    Baby Collection
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-background/70 hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="font-serif text-lg font-semibold text-background mb-4">
                Customer Service
              </h4>
              <ul className="space-y-2 font-sans text-sm">
                <li>
                  <Link to="/contact" className="text-background/70 hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                
                
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-serif text-lg font-semibold text-background mb-4">
                Get in Touch
              </h4>
              <ul className="space-y-3 font-sans text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-background/70">
                    210F, 1st Floor, Bharathiar Road,<br />
                    New Sidhapudur, Coimbatore – 641044,<br />
                    Tamil Nadu
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-primary flex-shrink-0" />
                  <span className="text-background/70">+91 95008 44405</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-primary flex-shrink-0" />
                  <span className="text-background/70">{CONTACT_INFO.email.primary}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-sans text-background/60">
            <p>© 2026 Mahamitra Boutique. All rights reserved.</p>
            
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
