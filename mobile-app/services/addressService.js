import { supabase } from './supabaseClient';

export async function fetchAddresses(userId) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addAddress(payload) {
  const { data, error } = await supabase.from('addresses').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteAddress(addressId) {
  const { error } = await supabase.from('addresses').delete().eq('id', addressId);
  if (error) throw error;
}
