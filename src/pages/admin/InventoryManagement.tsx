import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Package,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  Eye,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

type CategoryType = 'all' | 'women' | 'girls' | 'babies';

interface SupabaseProduct {
  id?: number;
  productId: string;
  name: string;
  material?: string;
  cost: number;
  description?: string;
  status: string;
  sizes: string[];
  colors: string[];
  image?: string;
  created_at?: string;
  category: CategoryType;
  size_required?: boolean;
}

const InventoryManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<SupabaseProduct | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [productToView, setProductToView] = useState<SupabaseProduct | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<SupabaseProduct | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SupabaseProduct>>({});

  // Fetch products from Supabase
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const allProducts: SupabaseProduct[] = [];
      const categories: CategoryType[] = ['women', 'girls', 'babies'];

      for (const category of categories) {
        const { data, error } = await supabase
          .from(`${category}_products`)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching ${category} products:`, error);
          toast.error(`Failed to fetch ${category} products`);
          continue;
        }

        if (data) {
          const categorizedProducts = data.map(product => ({
            ...product,
            category: category as CategoryType
          }));
          allProducts.push(...categorizedProducts);
        }
      }

      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search term and category
  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.material && product.material.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const handleDeleteProduct = async (productId: string, productName: string, category: CategoryType) => {
    setDeleteLoading(productId);
    try {
      const { error } = await supabase
        .from(`${category}_products`)
        .delete()
        .eq('productId', productId);

      if (error) {
        throw error;
      }

      // Remove from local state
      setProducts(prev => prev.filter(p => p.productId !== productId));

      toast.success('Product deleted', {
        description: `${productName} has been removed from inventory`
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product', {
        description: error.message || 'Please try again'
      });
    } finally {
      setDeleteLoading(null);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const openDeleteDialog = (product: SupabaseProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const openViewDialog = (product: SupabaseProduct) => {
    setProductToView(product);
    setViewDialogOpen(true);
  };

  const openEditDialog = (product: SupabaseProduct) => {
    setProductToEdit(product);
    setEditFormData({
      name: product.name,
      material: product.material,
      cost: product.cost,
      description: product.description,
      status: product.status,
      sizes: product.sizes,
      colors: product.colors,
      size_required: product.size_required !== false,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!productToEdit) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from(`${productToEdit.category}_products`)
        .update({
          name: editFormData.name,
          material: editFormData.material,
          cost: editFormData.cost,
          description: editFormData.description,
          status: editFormData.status,
          sizes: editFormData.sizes,
          colors: editFormData.colors,
          size_required: editFormData.size_required,
        })
        .eq('productId', productToEdit.productId);

      if (error) {
        throw error;
      }

      // Update local state
      setProducts(prev => prev.map(p =>
        p.productId === productToEdit.productId
          ? { ...p, ...editFormData }
          : p
      ));

      toast.success('Product updated successfully!');
      setEditDialogOpen(false);
      setProductToEdit(null);
      setEditFormData({});
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product', {
        description: error.message || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStats = (category: CategoryType) => {
    if (category === 'all') return products.length;
    return products.filter(p => p.category === category).length;
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'women': return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      case 'girls': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'babies': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Package size={20} className="text-primary" />
              <h1 className="font-serif text-xl font-semibold">Inventory Management</h1>
            </div>
          </div>
          <Link to="/admin/add-product">
            <Button className="gradient-primary">
              <Plus size={16} className="mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Stats */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products by name, ID, or category..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCategory('all')}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{getCategoryStats('all')}</div>
                <div className="text-sm text-muted-foreground">Total Products</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCategory('women')}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-pink-600">{getCategoryStats('women')}</div>
                <div className="text-sm text-muted-foreground">Women</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCategory('girls')}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{getCategoryStats('girls')}</div>
                <div className="text-sm text-muted-foreground">Girls</div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCategory('babies')}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{getCategoryStats('babies')}</div>
                <div className="text-sm text-muted-foreground">Babies</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Tabs Navigation */}
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CategoryType)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="women">Women</TabsTrigger>
            <TabsTrigger value="girls">Girls</TabsTrigger>
            <TabsTrigger value="babies">Babies</TabsTrigger>
          </TabsList>

          {/* Products Table */}
          <TabsContent value={selectedCategory} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {selectedCategory === 'all' ? 'All Products' :
                      selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) + ' Products'}
                  </span>
                  <Badge variant="outline">
                    {filteredProducts.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Colors</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.productId}>
                          <TableCell>
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-md border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-md border flex items-center justify-center">
                                <Package size={16} className="text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">ID: {product.productId}</div>
                              {product.material && (
                                <div className="text-xs text-muted-foreground">{product.material}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryBadgeColor(product.category)}>
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatPrice(product.cost)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.status === 'available' ? "default" : product.status === 'sold' ? "secondary" : "destructive"}>
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {product.colors.length > 0 && (
                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                  {product.colors.join(', ')}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={deleteLoading === product.productId}>
                                  {deleteLoading === product.productId ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <MoreVertical size={16} />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openViewDialog(product)}>
                                  <Eye size={14} className="mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                  <Edit size={14} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(product)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No products found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading !== null}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (productToDelete) {
                    handleDeleteProduct(productToDelete.productId, productToDelete.name, productToDelete.category);
                  }
                }}
                disabled={deleteLoading !== null}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteLoading === productToDelete?.productId ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Product Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
              <DialogDescription>
                View complete information for {productToView?.name}
              </DialogDescription>
            </DialogHeader>
            {productToView && (
              <div className="space-y-4">
                {productToView.image && (
                  <div className="flex justify-center">
                    <img
                      src={productToView.image}
                      alt={productToView.name}
                      className="w-48 h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Product ID</Label>
                    <p className="text-sm font-mono">{productToView.productId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="text-sm capitalize">{productToView.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Price</Label>
                    <p className="text-sm font-medium">{formatPrice(productToView.cost)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <p className="text-sm capitalize">{productToView.status}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Material</Label>
                    <p className="text-sm">{productToView.material || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Colors</Label>
                    <p className="text-sm">{productToView.colors.join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Size Required</Label>
                    <p className="text-sm">{productToView.size_required !== false ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Sizes</Label>
                    <p className="text-sm">{productToView.sizes.join(', ') || 'None'}</p>
                  </div>
                  {productToView.description && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <p className="text-sm">{productToView.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update information for {productToEdit?.name}
              </DialogDescription>
            </DialogHeader>
            {productToEdit && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Product Name</Label>
                    <Input
                      id="edit-name"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-material">Material</Label>
                    <Input
                      id="edit-material"
                      value={editFormData.material || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, material: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cost">Price (INR)</Label>
                    <Input
                      id="edit-cost"
                      type="number"
                      value={editFormData.cost || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, cost: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={editFormData.status} onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-colors">Colors</Label>
                    <Input
                      id="edit-colors"
                      value={editFormData.colors?.join(', ') || ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        colors: e.target.value.split(',').map(c => c.trim()).filter(c => c)
                      }))}
                      placeholder="Red, Blue, Green"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-sizes">Sizes</Label>
                    <Input
                      id="edit-sizes"
                      value={editFormData.sizes?.join(', ') || ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      }))}
                      placeholder="S, M, L, XL"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <Label className="text-sm font-medium" htmlFor="edit-size-required">Size Required</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {editFormData.size_required !== false
                          ? 'Customers must select a size'
                          : 'No size selection needed'}
                      </p>
                    </div>
                    <Switch
                      id="edit-size-required"
                      checked={editFormData.size_required !== false}
                      onCheckedChange={(checked) =>
                        setEditFormData(prev => ({ ...prev, size_required: checked }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InventoryManagement;
