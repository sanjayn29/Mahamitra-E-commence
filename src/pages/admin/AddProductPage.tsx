import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Upload } from 'lucide-react';
import { toast } from 'sonner';

const AddProductPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    category: '',
    material: '',
    cost: '',
    description: '',
    status: 'available',
    sizes: '',
    colors: '',
    image: ''
  });

  const categories = [
    { value: 'women', label: 'Women', collection: 'women product' },
    { value: 'girls', label: 'Girls', collection: 'girls product' },
    { value: 'babies', label: 'Babies', collection: 'babies product' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateProductId = () => {
    const prefix = formData.category ? formData.category.toUpperCase().substring(0, 3) : 'PRD';
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const productId = `MM${prefix}${randomNum}`;
    setFormData(prev => ({
      ...prev,
      productId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.name || !formData.category) {
      toast.error('Required fields missing', {
        description: 'Please fill in Product ID, Name, and Category'
      });
      return;
    }

    setLoading(true);
    
    try {
      const selectedCategory = categories.find(cat => cat.value === formData.category);
      const collectionName = selectedCategory?.collection || 'women product';
      
      const productData = {
        productId: formData.productId,
        name: formData.name,
        category: formData.category,
        material: formData.material,
        cost: formData.cost ? parseInt(formData.cost) : 0,
        description: formData.description,
        status: formData.status,
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(s => s),
        colors: formData.colors.split(',').map(c => c.trim()).filter(c => c),
        image: formData.image,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Use productId as document ID
      await setDoc(doc(db, collectionName, formData.productId), productData);
      
      toast.success('Product added successfully!', {
        description: `${formData.name} has been added to ${selectedCategory?.label} collection`
      });
      
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product', {
        description: 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Package size={20} className="text-primary" />
            <h1 className="font-serif text-xl font-semibold">Add New Product</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-luxe">
          <CardHeader>
            <CardTitle className="font-serif">Product Information</CardTitle>
            <CardDescription>Add a new product to your Mahamitra collection</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product ID */}
              <div className="space-y-2">
                <Label htmlFor="productId">Product ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="productId"
                    value={formData.productId}
                    onChange={(e) => handleInputChange('productId', e.target.value)}
                    placeholder="MMWOM0001"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateProductId}
                    disabled={!formData.category}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Elegant Silk Saree"
                />
              </div>

              {/* Material */}
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                  placeholder="Silk, Cotton, Polyester..."
                />
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="2999"
                />
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <Label htmlFor="sizes">Available Sizes</Label>
                <Input
                  id="sizes"
                  value={formData.sizes}
                  onChange={(e) => handleInputChange('sizes', e.target.value)}
                  placeholder="S, M, L, XL"
                  className="font-sans"
                />
                <p className="text-xs text-muted-foreground">Separate sizes with commas</p>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <Label htmlFor="colors">Available Colors</Label>
                <Input
                  id="colors"
                  value={formData.colors}
                  onChange={(e) => handleInputChange('colors', e.target.value)}
                  placeholder="Red, Blue, Pink, Gold"
                  className="font-sans"
                />
                <p className="text-xs text-muted-foreground">Separate colors with commas</p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
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

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image">Product Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload size={16} />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the product features, style, and details..."
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 gradient-primary text-primary-foreground"
                >
                  {loading ? 'Adding Product...' : 'Add Product'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProductPage;