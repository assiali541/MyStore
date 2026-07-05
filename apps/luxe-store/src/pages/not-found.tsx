import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="font-serif text-6xl md:text-8xl font-bold text-foreground mb-4">404</h1>
      <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">Page Not Found</h2>
      <p className="text-muted-foreground font-light max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Button asChild size="lg" className="rounded-none bg-foreground text-background uppercase tracking-widest px-8">
        <Link href="/">
          Return Home
        </Link>
      </Button>
    </div>
  );
}