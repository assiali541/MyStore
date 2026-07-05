import { useState, useRef, useEffect } from "react";
import { 
  useAdminGetSettings, 
  useAdminUpdateSettings,
  getAdminGetSettingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuth } from "@/contexts/admin-auth-context";

export default function AdminSettings() {
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useAdminGetSettings();
  const updateMutation = useAdminUpdateSettings();

  const [formData, setFormData] = useState({
    storeName: "",
    logoUrl: null as string | null,
    email: null as string | null,
    whatsapp: null as string | null,
    instagramUrl: null as string | null,
    address: null as string | null,
    deliveryFee: "0",
    freeDeliveryThreshold: null as string | null,
    heroImageUrl: null as string | null,
    aboutText: null as string | null,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        storeName: settings.storeName,
        logoUrl: settings.logoUrl || null,
        email: settings.email || null,
        whatsapp: settings.whatsapp || null,
        instagramUrl: settings.instagramUrl || null,
        address: settings.address || null,
        deliveryFee: settings.deliveryFee.toString(),
        freeDeliveryThreshold: settings.freeDeliveryThreshold?.toString() || null,
        heroImageUrl: settings.heroImageUrl || null,
        aboutText: settings.aboutText || null,
      });
    }
  }, [settings]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'heroImageUrl') => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    
    try {
      const toastId = toast.loading("Uploading image...");
      const form = new FormData();
      form.append('file', file);
      
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      setFormData(prev => ({ ...prev, [field]: data.url }));
      toast.success("Image uploaded", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      if (field === 'logoUrl' && logoInputRef.current) logoInputRef.current.value = '';
      if (field === 'heroImageUrl' && heroInputRef.current) heroInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        data: {
          storeName: formData.storeName,
          logoUrl: formData.logoUrl,
          email: formData.email,
          whatsapp: formData.whatsapp,
          instagramUrl: formData.instagramUrl,
          address: formData.address,
          deliveryFee: parseFloat(formData.deliveryFee),
          freeDeliveryThreshold: formData.freeDeliveryThreshold ? parseFloat(formData.freeDeliveryThreshold) : null,
          heroImageUrl: formData.heroImageUrl,
          aboutText: formData.aboutText,
        }
      });
      toast.success("Settings saved successfully");
      queryClient.invalidateQueries({ queryKey: getAdminGetSettingsQueryKey() });
      // Also invalidate public settings query if needed, though they might refetch on navigation
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 w-48 bg-muted rounded"></div>
      <div className="h-96 bg-muted rounded-lg border border-border"></div>
    </div>;
  }

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Store Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your brand identity and store policies.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <h2 className="font-serif text-xl border-b border-border pb-2">Brand Identity</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label>Store Name *</Label>
              <Input 
                required 
                value={formData.storeName} 
                onChange={e => setFormData({...formData, storeName: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Store Logo (Light/Transparent bg preferred)</Label>
              <div className="mt-2">
                {formData.logoUrl ? (
                  <div className="relative w-48 h-16 border border-border bg-background rounded flex items-center justify-center group overflow-hidden">
                    <img src={formData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    <button type="button" onClick={() => setFormData({...formData, logoUrl: null})} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-48 h-16 border border-dashed border-border rounded flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm">Upload Logo</span>
                  </button>
                )}
                <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={e => handleFileUpload(e, 'logoUrl')} />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>About Text (Footer)</Label>
              <Textarea 
                value={formData.aboutText || ""} 
                onChange={e => setFormData({...formData, aboutText: e.target.value})} 
                rows={3}
                placeholder="A short description of your brand..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Homepage Hero Image</Label>
              <div className="mt-2">
                {formData.heroImageUrl ? (
                  <div className="relative w-full aspect-video md:aspect-[21/9] border border-border rounded overflow-hidden group">
                    <img src={formData.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormData({...formData, heroImageUrl: null})} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => heroInputRef.current?.click()}
                    className="w-full aspect-video md:aspect-[21/9] border-2 border-dashed border-border rounded flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                    <span>Upload Hero Image</span>
                  </button>
                )}
                <input type="file" accept="image/*" className="hidden" ref={heroInputRef} onChange={e => handleFileUpload(e, 'heroImageUrl')} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <h2 className="font-serif text-xl border-b border-border pb-2">Contact & Social</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input 
                type="email"
                value={formData.email || ""} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>WhatsApp Number (with country code)</Label>
              <Input 
                placeholder="+1234567890"
                value={formData.whatsapp || ""} 
                onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input 
                placeholder="https://instagram.com/yourbrand"
                value={formData.instagramUrl || ""} 
                onChange={e => setFormData({...formData, instagramUrl: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Physical Address / Showroom</Label>
              <Textarea 
                value={formData.address || ""} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <h2 className="font-serif text-xl border-b border-border pb-2">Shipping Policies</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Standard Delivery Fee ($) *</Label>
              <Input 
                type="number" 
                step="0.01" 
                min="0"
                required
                value={formData.deliveryFee} 
                onChange={e => setFormData({...formData, deliveryFee: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Free Delivery Threshold ($) (Optional)</Label>
              <Input 
                type="number" 
                step="0.01" 
                min="0"
                placeholder="Leave blank for no free shipping"
                value={formData.freeDeliveryThreshold || ""} 
                onChange={e => setFormData({...formData, freeDeliveryThreshold: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 sticky bottom-6 p-4 bg-background/80 backdrop-blur border border-border rounded-lg">
          <Button 
            type="submit" 
            size="lg"
            className="w-full sm:w-auto"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : (
              <><Save className="mr-2 h-4 w-4" /> Save Settings</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
