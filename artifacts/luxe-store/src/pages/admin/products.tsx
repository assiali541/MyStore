import { useState, useRef } from "react";
import { 
  useAdminListProducts, 
  useAdminDeleteProduct, 
  useListCategories, 
  useAdminCreateProduct, 
  useAdminUpdateProduct,
  getAdminListProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useAdminAuth } from "@/contexts/admin-auth-context";

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useAdminListProducts({
    page,
    limit: 10,
    search: debouncedSearch || undefined
  });
  
  const { data: categories } = useListCategories();

  const createMutation = useAdminCreateProduct();
  const updateMutation = useAdminUpdateProduct();
  const deleteMutation = useAdminDeleteProduct();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    price: "",
    salePrice: "",
    stock: "0",
    sizes: "",
    colors: "",
    images: [] as string[],
    featured: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      categoryId: "",
      price: "",
      salePrice: "",
      stock: "0",
      sizes: "",
      colors: "",
      images: [],
      featured: false
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId?.toString() || "",
      price: product.price.toString(),
      salePrice: product.salePrice?.toString() || "",
      stock: product.stock.toString(),
      sizes: product.sizes.join(", "),
      colors: product.colors.join(", "),
      images: product.images || [],
      featured: product.featured || false
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
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, data.url]
      }));
      toast.success("Image uploaded", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      description: formData.description || null,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      price: parseFloat(formData.price),
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
      stock: parseInt(formData.stock),
      sizes: formData.sizes ? formData.sizes.split(",").map(s => s.trim()).filter(Boolean) : [],
      colors: formData.colors ? formData.colors.split(",").map(c => c.trim()).filter(Boolean) : [],
      images: formData.images,
      featured: formData.featured
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast.success("Product updated");
      } else {
        await createMutation.mutateAsync({ data: payload as any });
        toast.success("Product created");
      }
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (isDeleting === id) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Product deleted");
        setIsDeleting(null);
        queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey() });
      } catch (err: any) {
        toast.error(err.message || "Failed to delete");
      }
    } else {
      setIsDeleting(id);
      setTimeout(() => setIsDeleting(null), 3000); // Reset after 3 seconds
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your store's inventory.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={openCreateDialog} className="shrink-0 gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Name *</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
                </div>
                
                <div className="space-y-2">
                  <Label>Price ($) *</Label>
                  <Input type="number" step="0.01" min="0" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label>Sale Price ($) (Optional)</Label>
                  <Input type="number" step="0.01" min="0" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v === "none" ? "" : v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories?.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Stock Quantity *</Label>
                  <Input type="number" min="0" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label>Sizes (Comma separated)</Label>
                  <Input placeholder="XS, S, M, L, XL" value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label>Colors (Comma separated)</Label>
                  <Input placeholder="Black, Beige, Navy" value={formData.colors} onChange={e => setFormData({...formData, colors: e.target.value})} />
                </div>

                <div className="flex items-center space-x-2 md:col-span-2">
                  <Switch 
                    id="featured" 
                    checked={formData.featured}
                    onCheckedChange={checked => setFormData({...formData, featured: checked})}
                  />
                  <Label htmlFor="featured">Featured Product (Shows on homepage)</Label>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Product Images</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative w-24 h-24 border border-border rounded overflow-hidden group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border border-dashed border-border rounded flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <ImageIcon className="h-6 w-6 mb-1" />
                      <span className="text-xs">Upload</span>
                    </button>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-border gap-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <form onSubmit={handleSearch} className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 font-medium w-16">Image</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center"><div className="animate-pulse h-4 w-24 bg-muted mx-auto rounded"></div></td>
                </tr>
              ) : productsData?.products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No products found.</td>
                </tr>
              ) : (
                productsData?.products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="w-10 h-12 rounded bg-muted overflow-hidden shrink-0">
                        {product.images[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.featured && <span className="text-[10px] uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-2">Featured</span>}
                    </td>
                    <td className="p-4 text-muted-foreground">{product.categoryName || "—"}</td>
                    <td className="p-4">
                      {product.salePrice ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">${product.salePrice.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="font-medium text-foreground">${product.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-500/10 text-green-500' : product.stock > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(product.id)}
                          className={isDeleting === product.id ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        >
                          {isDeleting === product.id ? "Sure?" : <Trash2 className="h-4 w-4 text-destructive opacity-70" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {productsData && productsData.totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-between items-center bg-muted/10">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, productsData.total)} of {productsData.total} items
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === productsData.totalPages} onClick={() => setPage(p => Math.min(productsData.totalPages, p + 1))}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
