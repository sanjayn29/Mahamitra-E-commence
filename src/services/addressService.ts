import { supabase } from '@/lib/supabaseClient';

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export type AddressInput = Omit<Address, 'id' | 'user_id' | 'created_at'>;

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  },

  async createAddress(input: AddressInput): Promise<Address> {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (input.is_default) {
      await this.clearDefaultAddress(user.id);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        ...input,
        user_id: user.id,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateAddress(addressId: string, input: Partial<AddressInput>): Promise<Address> {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (input.is_default) {
      await this.clearDefaultAddress(user.id);
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(input)
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async deleteAddress(addressId: string): Promise<void> {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    const remainingAddresses = await this.getAddresses();
    const hasDefault = remainingAddresses.some((address) => address.is_default);

    if (!hasDefault && remainingAddresses.length > 0) {
      await this.setDefaultAddress(remainingAddresses[0].id);
    }
  },

  async setDefaultAddress(addressId: string): Promise<void> {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    await this.clearDefaultAddress(user.id);

    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }
  },

  async clearDefaultAddress(userId: string): Promise<void> {
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    if (error) {
      throw error;
    }
  },
};
