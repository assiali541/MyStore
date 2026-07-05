import { useState, useRef } from "react";
import { 
  useAdminListCategories, 
  useAdminCreateCategory, 
  useAdminUpdateCategory, 
  useAdminDeleteCategory,
  getAdminListCategoriesQueryKey,
  getListCategoriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAdminAuth } from "@/contexts/admin-auth-context";

export default function AdminCategories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useAdminListCategories();
  
  const createMutation = useAdminCreateCategory();
  const updateMutation = useAdminUpdateCategory();
  const deleteMutation = useAdminDeleteCategory();

  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "" as string | null
  });

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData({ name: "", imageUrl: null });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: any) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      imageUrl: category.imageUrl || null
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success("Image uploaded", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
        toast.success("Category updated");
      } else {
        await createMutation.mutateAsync({ data: formData as any });
        toast.success("Category created");
      }
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleDelete = async (id: number, productCount: number) => {
    if (productCount > 0) {
      toast.error("Cannot delete a category that contains products. Reassign or delete the products first.");
      return;
    }

    if (isDeleting === id) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Category deleted");
        setIsDeleting(null);
        queryClient.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
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
          <h1 className="text-3xl font-serif font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your products into collections.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={openCreateDialog} className="shrink-0 gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingId ? "Edit Category" : "Add New Category"}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="mt-2">
                  {formData.imageUrl ? (
                    <div className="relative w-full aspect-video border border-border rounded overflow-hidden group">
                      <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData({...formData, imageUrl: null})} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video border-2 border-dashed border-border rounded flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                      <span>Upload Image</span>
                    </button>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-border gap-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Save Changes" : "Create Category"}
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
                <th className="p-4 font-medium w-24">Image</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Products</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center"><div className="animate-pulse h-4 w-24 bg-muted mx-auto rounded"></div></td>
                </tr>
              ) : categories?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">No categories found.</td>
                </tr>
              ) : (
                categories?.map((category) => (
                  <tr key={category.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="w-16 h-12 rounded bg-muted overflow-hidden shrink-0">
                        {category.imageUrl ? (
                          <img src={category.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-foreground">{category.name}</td>
                    <td className="p-4 text-muted-foreground">{category.productCount} items</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(category.id, category.productCount)}
                          className={isDeleting === category.id ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        >
                          {isDeleting === category.id ? "Sure?" : <Trash2 className="h-4 w-4 text-destructive opacity-70" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
