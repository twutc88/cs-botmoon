import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CustomerAction {
  id: string;
  user_id: number;
  action_type: string;
  note: string | null;
  created_at: string;
}

export async function saveAction(
  userId: number,
  actionType: string,
  note: string
): Promise<CustomerAction> {
  const { data, error } = await supabase
    .from('customer_actions')
    .insert({
      user_id: userId,
      action_type: actionType,
      note: note || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save action: ${error.message}`);
  }

  return data;
}

export async function getActionsByUserId(userId: number): Promise<CustomerAction[]> {
  const { data, error } = await supabase
    .from('customer_actions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch actions: ${error.message}`);
  }

  return data || [];
}

export async function getLatestAction(userId: number): Promise<CustomerAction | null> {
  const { data, error } = await supabase
    .from('customer_actions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rows found
    }
    throw new Error(`Failed to fetch latest action: ${error.message}`);
  }

  return data;
}

