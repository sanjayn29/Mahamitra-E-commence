import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit2, MapPin, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addressService, Address, AddressInput } from '@/services/addressService';
import { toast } from 'sonner';

interface AddressBookProps {
  selectable?: boolean;
  selectedAddressId?: string | null;
  onSelectAddress?: (address: Address) => void;
  title?: string;
}

const emptyForm: AddressInput = {
  full_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  is_default: false,
};

export const AddressBook = ({
  selectable = false,
  selectedAddressId = null,
  onSelectAddress,
  title = 'Saved Addresses',
}: AddressBookProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressInput>(emptyForm);

  const selectedId = useMemo(() => {
    if (selectedAddressId) {
      return selectedAddressId;
    }
    return addresses.find((address) => address.is_default)?.id || null;
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    if (selectable && onSelectAddress && selectedId) {
      const selectedAddress = addresses.find((address) => address.id === selectedId);
      if (selectedAddress) {
        onSelectAddress(selectedAddress);
      }
    }
  }, [addresses, selectable, onSelectAddress, selectedId]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      full_name: address.full_name,
      phone: address.phone,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone || !form.address_line_1 || !form.city || !form.state || !form.postal_code || !form.country) {
      toast.error('Please fill all required address fields');
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await addressService.updateAddress(editingId, form);
        toast.success('Address updated');
      } else {
        const shouldBeDefault = addresses.length === 0 ? true : form.is_default;
        await addressService.createAddress({ ...form, is_default: shouldBeDefault });
        toast.success('Address added');
      }

      await loadAddresses();
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    try {
      await addressService.deleteAddress(addressId);
      toast.success('Address deleted');
      await loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await addressService.setDefaultAddress(addressId);
      toast.success('Default address updated');
      await loadAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to set default address');
    }
  };

  const renderAddressCard = (address: Address) => {
    const isSelected = selectedId === address.id;

    return (
      <Card
        key={address.id}
        className={isSelected ? 'border-primary' : ''}
      >
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{address.full_name}</p>
              <p className="text-xs text-muted-foreground">{address.phone}</p>
            </div>
            {address.is_default && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
            )}
          </div>

          <p className="text-sm leading-relaxed">
            {address.address_line_1}
            {address.address_line_2 ? `, ${address.address_line_2}` : ''}, {address.city}, {address.state} {address.postal_code}, {address.country}
          </p>

          <div className="flex flex-wrap gap-2">
            {selectable && (
              <Button
                type="button"
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onSelectAddress?.(address)}
              >
                <CheckCircle2 size={14} className="mr-1" />
                {isSelected ? 'Selected' : 'Select'}
              </Button>
            )}

            {!address.is_default && (
              <Button type="button" size="sm" variant="outline" onClick={() => handleSetDefault(address.id)}>
                Set Default
              </Button>
            )}

            <Button type="button" size="sm" variant="ghost" onClick={() => handleEdit(address)}>
              <Edit2 size={14} className="mr-1" />
              Edit
            </Button>

            <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(address.id)}>
              <Trash2 size={14} className="mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <MapPin size={18} />
          {title}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setEditingId(null);
              setForm({ ...emptyForm, is_default: addresses.length === 0 });
            }
          }}
        >
          <Plus size={14} className="mr-1" />
          {showForm ? 'Cancel' : 'Add Address'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? 'Edit Address' : 'Add New Address'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} maxLength={15} />
              </div>
            </div>

            <div>
              <Label htmlFor="address_line_1">Address Line 1 *</Label>
              <Input id="address_line_1" value={form.address_line_1} onChange={(event) => setForm((prev) => ({ ...prev, address_line_1: event.target.value }))} />
            </div>

            <div>
              <Label htmlFor="address_line_2">Address Line 2</Label>
              <Input id="address_line_2" value={form.address_line_2 || ''} onChange={(event) => setForm((prev) => ({ ...prev, address_line_2: event.target.value }))} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input id="city" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input id="state" value={form.state} onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input id="postal_code" value={form.postal_code} onChange={(event) => setForm((prev) => ({ ...prev, postal_code: event.target.value }))} />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input id="country" value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_default"
                type="checkbox"
                checked={form.is_default}
                onChange={(event) => setForm((prev) => ({ ...prev, is_default: event.target.checked }))}
              />
              <Label htmlFor="is_default">Set as default address</Label>
            </div>

            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Loading addresses...</CardContent>
        </Card>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">No addresses found. Add your first shipping address.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">{addresses.map(renderAddressCard)}</div>
      )}
    </div>
  );
};

export default AddressBook;
