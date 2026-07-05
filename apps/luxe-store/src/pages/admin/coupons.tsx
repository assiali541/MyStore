import { useState } from "react";
import { 
  useAdminListCoupons, 
  useAdminCreateCoupon, 
  useAdminDeleteCoupon,
  getAdminListCouponsQueryKey,
  CouponInputDiscountType
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function AdminCoupons() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useAdminListCoupons();
  
  const createMutation = useAdminCreateCoupon();
  const deleteMutation = useAdminDeleteCoupon();

  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage" as CouponInputDiscountType,
    discountValue: "10",
    expiresAt: ""
  });

  const openCreateDialog = () => {
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: "10",
      expiresAt: ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ 
        data: {
          code: formData.code.toUpperCase(),
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
          active: true
        } 
      });
      toast.success("Coupon created successfully");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: getAdminListCouponsQueryKey() });
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon");
    }
  };

  const handleDelete = async (id: number) => {
    if (isDeleting === id) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Coupon deleted");
        setIsDeleting(null);
        queryClient.invalidateQueries({ queryKey: getAdminListCouponsQueryKey() });
      } catch (err: any) {
        toast.error(err.message || "Failed to delete");
      }
    } else {
      setIsDeleting(id);
      setTimeout(() => setIsDeleting(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Discount Codes</h1>
          <p className="text-muted-foreground mt-1">Manage promotional coupons for your store.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={openCreateDialog} className="shrink-0 gap-2">
            <Plus className="h-4 w-4" /> Create Coupon
          </Button>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Create New Coupon</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>Coupon Code *</Label>
                <Input 
                  required 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})} 
                  placeholder="e.g. SUMMER20"
                  className="uppercase"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={formData.discountType} onValueChange={(v: any) => setFormData({...formData, discountType: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input 
                    type="number" 
                    required 
                    min="0.1" 
                    step={formData.discountType === "percentage" ? "1" : "0.01"}
                    max={formData.discountType === "percentage" ? "100" : undefined}
                    value={formData.discountValue} 
                    onChange={e => setFormData({...formData, discountValue: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expiration Date (Optional)</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.expiresAt} 
                  onChange={e => setFormData({...formData, expiresAt: e.target.value})} 
                />
              </div>
              
              <div className="flex justify-end pt-4 border-t border-border gap-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Create Coupon
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 font-medium">Code</th>
                <th className="p-4 font-medium">Discount</th>
                <th className="p-4 font-medium">Status / Expiry</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center"><div className="animate-pulse h-4 w-24 bg-muted mx-auto rounded"></div></td>
                </tr>
              ) : coupons?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">No coupons found.</td>
                </tr>
              ) : (
                coupons?.map((coupon) => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                  
                  return (
                    <tr key={coupon.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium text-foreground uppercase tracking-wider">{coupon.code}</td>
                      <td className="p-4 text-foreground font-medium">
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountValue}% OFF` 
                          : `$${coupon.discountValue.toFixed(2)} OFF`}
                      </td>
                      <td className="p-4">
                        {isExpired ? (
                          <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">Expired</span>
                        ) : coupon.expiresAt ? (
                          <span className="text-xs text-muted-foreground">
                            Expires {format(new Date(coupon.expiresAt), "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">Never expires</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(coupon.id)}
                          className={isDeleting === coupon.id ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "text-destructive hover:bg-destructive/10 hover:text-destructive"}
                        >
                          {isDeleting === coupon.id ? "Confirm?" : <Trash2 className="h-4 w-4 mr-2" />}
                          {isDeleting !== coupon.id && "Delete"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
