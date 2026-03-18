import { supabase } from './supabaseClient';

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signup({ email, password, fullName, phone, address }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
      },
    },
  });

  if (error) throw error;

  if (data?.user?.id && address) {
    const { error: addressError } = await supabase.from('addresses').insert({
      user_id: data.user.id,
      full_name: fullName,
      phone,
      line1: address.line1,
      line2: address.line2 || null,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country || 'India',
      is_default: true,
    });

    if (addressError) throw addressError;
  }

  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
