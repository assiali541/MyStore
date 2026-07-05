import { useGetSettings } from "@workspace/api-client-react";
import { Mail, MessageCircle, Instagram, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Contact() {
  const { data: settings } = useGetSettings();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Thank you for reaching out. We'll be in touch shortly.");
    e.currentTarget.reset();
  };

  return (
    <div className="w-full">
      <section className="relative pt-40 pb-24 md:pt-48 md:pb-32 bg-secondary/30 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <span className="text-muted-foreground tracking-[0.2em] uppercase text-sm mb-6 block">
            Get in Touch
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-foreground font-medium leading-tight">
            Contact Us
          </h1>
        </div>
      </section>

      <section className="py-24 px-4 md:px-6 container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-5xl mx-auto">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground font-medium mb-8">
              Send Us a Message
            </h2>
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm uppercase tracking-wide text-muted-foreground block mb-2">Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors rounded-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm uppercase tracking-wide text-muted-foreground block mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors rounded-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-sm uppercase tracking-wide text-muted-foreground block mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  className="w-full bg-transparent border-b border-border px-0 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors rounded-none resize-none"
                  placeholder="How can we help?"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-none uppercase tracking-wide h-14 w-full sm:w-auto sm:self-start px-10">
                Send Message
              </Button>
            </form>
          </div>

          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground font-medium mb-8">
              Reach Us Directly
            </h2>
            <ul className="flex flex-col gap-6 font-light text-foreground/80">
              {settings?.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="flex items-center gap-4 hover:text-primary transition-colors">
                    <span className="flex items-center justify-center h-10 w-10 border border-border">
                      <Mail className="h-4 w-4" />
                    </span>
                    <span>{settings.email}</span>
                  </a>
                </li>
              )}
              {settings?.whatsapp && (
                <li>
                  <a href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:text-primary transition-colors">
                    <span className="flex items-center justify-center h-10 w-10 border border-border">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <span>WhatsApp Us</span>
                  </a>
                </li>
              )}
              {settings?.instagramUrl && (
                <li>
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:text-primary transition-colors">
                    <span className="flex items-center justify-center h-10 w-10 border border-border">
                      <Instagram className="h-4 w-4" />
                    </span>
                    <span>Instagram</span>
                  </a>
                </li>
              )}
              {settings?.address && (
                <li className="flex items-center gap-4">
                  <span className="flex items-center justify-center h-10 w-10 border border-border shrink-0">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span>{settings.address}</span>
                </li>
              )}
              {!settings?.email && !settings?.whatsapp && !settings?.instagramUrl && !settings?.address && (
                <li className="text-muted-foreground">
                  Contact details will appear here once configured in the admin panel.
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
