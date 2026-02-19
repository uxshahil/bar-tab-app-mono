import { createClient } from '@supabase/supabase-js';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Consider adding CORS if needed

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Add if you need cross-origin requests

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

// Add logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.post('/create-user', async (req, res) => {
  console.log('[CREATE USER] Attempting to create new user');
  const { firstName, lastName, username, email, password, user_role, pin } = req.body;

  // Input validation
  if (!email || !password || !firstName || !lastName) {
    console.log('[CREATE USER] Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        username
      }
    });

    if (authError) {
      console.error('[CREATE USER] Auth error:', authError.message);
      return res.status(400).json({ error: authError.message });
    }

    if (authData?.user?.id) {
      console.log(`[CREATE USER] User created with ID: ${authData.user.id}`);
      const { error: profileError } = await supabaseAdmin
        .from('profile')
        .insert({
          id: authData.user.id,
          full_name: `${firstName} ${lastName}`,
          username,
          bio: 'The main testing account',
          avatar_url: `https://i.pravatar.cc/150?u=${authData.user.id}`,
          email,
          password, // WARNING: Don't store plain passwords
          user_role,
          pin
        });

      if (profileError) {
        console.error('[CREATE USER] Profile error:', profileError.message);
        return res.status(400).json({ error: profileError.message });
      }

      console.log('[CREATE USER] User profile created successfully');
      return res.status(200).json({ userId: authData.user.id });
    }

    console.log('[CREATE USER] Failed to create user');
    return res.status(400).json({ error: 'Failed to create user' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[CREATE USER] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Update User endpoint
app.put('/update-user/:userId', async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;

  console.log(`[UPDATE USER] Attempting to update user with ID: ${userId}`);

  try {
    // Update profile table
    const { error: profileError } = await supabaseAdmin
      .from('profile')
      .update(updateData)
      .eq('id', userId);

    if (profileError) {
      console.error('[UPDATE USER] Profile update error:', profileError.message);
      return res.status(400).json({ error: profileError.message });
    }

    // If you also want to update the user's email or other auth fields:
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
    if (authError) {
      console.error('[UPDATE USER] Auth update error:', authError.message);
      return res.status(400).json({ error: authError.message });
    }

    console.log(`[UPDATE USER] User ${userId} updated successfully`);
    return res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[UPDATE USER] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Delete user endpoint
app.delete('/delete-user/:userId', async (req, res) => {
  const { userId } = req.params;

  console.log(`[DELETE USER] Attempting to delete user with ID: ${userId}`);

  try {
    // Delete from profile table
    const { error: profileError } = await supabaseAdmin
      .from('profile')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('[DELETE USER] Profile deletion error:', profileError.message);
      return res.status(400).json({ error: profileError.message });
    }

    // Delete from auth.users table
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('[DELETE USER] Auth deletion error:', authError.message);
      return res.status(400).json({ error: authError.message });
    }

    console.log(`[DELETE USER] User ${userId} deleted successfully`);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[DELETE USER] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// ============== DRINK ENDPOINTS ==============

// Create Drink endpoint
app.post('/create-drink', async (req, res) => {
  console.log('[CREATE DRINK] Attempting to create new drink');
  const { name, slug, category, alcoholic, glass, instructions, thumb_url, measurements, ingredients, price } = req.body;

  // Input validation
  if (!name || !slug || !thumb_url) {
    console.log('[CREATE DRINK] Missing required fields');
    return res.status(400).json({ error: 'Missing required fields: name, slug, thumb_url' });
  }

  try {
    const { data, error: drinkError } = await supabaseAdmin
      .from('menu_item')
      .insert({
        name,
        slug,
        category,
        alcoholic: alcoholic ?? null,
        glass: glass ?? null,
        instructions: instructions ?? null,
        thumb_url,
        measurements: measurements ?? [],
        ingredients: ingredients ?? [],
        active: true,
        price: price ?? null,
        last_modified: new Date().toISOString()
      })
      .select();

    if (drinkError) {
      console.error('[CREATE DRINK] Database error:', drinkError.message);
      return res.status(400).json({ error: drinkError.message });
    }

    console.log('[CREATE DRINK] Drink created successfully');
    return res.status(200).json({ drinkId: data?.[0]?.id, message: 'Drink created successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[CREATE DRINK] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Update Drink endpoint
app.put('/update-drink/:drinkId', async (req, res) => {
  const { drinkId } = req.params;
  const updateData = req.body;

  console.log(`[UPDATE DRINK] Attempting to update drink with ID: ${drinkId}`);

  try {
    const { error: drinkError } = await supabaseAdmin
      .from('menu_item')
      .update({
        ...updateData,
        last_modified: new Date().toISOString()
      })
      .eq('id', drinkId);

    if (drinkError) {
      console.error('[UPDATE DRINK] Update error:', drinkError.message);
      return res.status(400).json({ error: drinkError.message });
    }

    console.log(`[UPDATE DRINK] Drink ${drinkId} updated successfully`);
    return res.status(200).json({ message: 'Drink updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[UPDATE DRINK] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Delete Drink endpoint
app.delete('/delete-drink/:drinkId', async (req, res) => {
  const { drinkId } = req.params;

  console.log(`[DELETE DRINK] Attempting to delete drink with ID: ${drinkId}`);

  try {
    const { error: drinkError } = await supabaseAdmin
      .from('menu_item')
      .delete()
      .eq('id', drinkId);

    if (drinkError) {
      console.error('[DELETE DRINK] Deletion error:', drinkError.message);
      return res.status(400).json({ error: drinkError.message });
    }

    console.log(`[DELETE DRINK] Drink ${drinkId} deleted successfully`);
    return res.status(200).json({ message: 'Drink deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[DELETE DRINK] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// ============== TAB ENDPOINTS ==============

// Create Tab endpoint
app.post('/tabs', async (req, res) => {
  console.log('[CREATE TAB] Attempting to create new tab');
  const { user_id, tab_number, special_notes } = req.body;

  // Input validation
  if (!user_id || !tab_number) {
    console.log('[CREATE TAB] Missing required fields');
    return res.status(400).json({ error: 'Missing required fields: user_id, tab_number' });
  }

  try {
    const { data, error: tabError } = await supabaseAdmin
      .from('tab')
      .insert({
        user_id,
        tab_number,
        status: 'open',
        subtotal: 0,
        tax_amount: 0,
        total_before_tip: 0,
        tip_amount: 0,
        total_owed: 0,
        is_split: false,
        split_count: 1,
        special_notes: special_notes || null
      })
      .select();

    if (tabError) {
      console.error('[CREATE TAB] Database error:', tabError.message);
      return res.status(400).json({ error: tabError.message });
    }

    console.log('[CREATE TAB] Tab created successfully');
    return res.status(200).json({ tabId: data?.[0]?.id, message: 'Tab created successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[CREATE TAB] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Update Tab endpoint
app.put('/tabs/:tabId', async (req, res) => {
  const { tabId } = req.params;
  const updateData = req.body;

  console.log(`[UPDATE TAB] Attempting to update tab with ID: ${tabId}`);

  try {
    const { error: tabError } = await supabaseAdmin
      .from('tab')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', tabId);

    if (tabError) {
      console.error('[UPDATE TAB] Update error:', tabError.message);
      return res.status(400).json({ error: tabError.message });
    }

    console.log(`[UPDATE TAB] Tab ${tabId} updated successfully`);
    return res.status(200).json({ message: 'Tab updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[UPDATE TAB] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Add Item to Tab endpoint
app.post('/tabs/items', async (req, res) => {
  console.log('[ADD TAB ITEM] Attempting to add item to tab');
  const { tab_id, menu_item_id, quantity, unit_price, item_total, special_instructions } = req.body;

  // Input validation
  if (!tab_id || !menu_item_id || !quantity || !unit_price || !item_total) {
    console.log('[ADD TAB ITEM] Missing required fields');
    return res.status(400).json({ error: 'Missing required fields: tab_id, menu_item_id, quantity, unit_price, item_total' });
  }

  try {
    const { data, error: itemError } = await supabaseAdmin
      .from('tab_item')
      .insert({
        tab_id,
        menu_item_id,
        quantity,
        unit_price,
        item_total,
        special_instructions: special_instructions || null
      })
      .select();

    if (itemError) {
      console.error('[ADD TAB ITEM] Database error:', itemError.message);
      return res.status(400).json({ error: itemError.message });
    }

    console.log('[ADD TAB ITEM] Item added successfully');
    return res.status(200).json({ itemId: data?.[0]?.id, message: 'Item added successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[ADD TAB ITEM] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Update Tab Item endpoint
app.put('/tabs/items/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const updateData = req.body;

  console.log(`[UPDATE TAB ITEM] Attempting to update item with ID: ${itemId}`);

  try {
    const { error: itemError } = await supabaseAdmin
      .from('tab_item')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (itemError) {
      console.error('[UPDATE TAB ITEM] Update error:', itemError.message);
      return res.status(400).json({ error: itemError.message });
    }

    console.log(`[UPDATE TAB ITEM] Item ${itemId} updated successfully`);
    return res.status(200).json({ message: 'Item updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[UPDATE TAB ITEM] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Delete Tab Item endpoint
app.delete('/tabs/items/:itemId', async (req, res) => {
  const { itemId } = req.params;

  console.log(`[DELETE TAB ITEM] Attempting to delete item with ID: ${itemId}`);

  try {
    const { error: itemError } = await supabaseAdmin
      .from('tab_item')
      .delete()
      .eq('id', itemId);

    if (itemError) {
      console.error('[DELETE TAB ITEM] Deletion error:', itemError.message);
      return res.status(400).json({ error: itemError.message });
    }

    console.log(`[DELETE TAB ITEM] Item ${itemId} deleted successfully`);
    return res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[DELETE TAB ITEM] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Create Tab Split endpoint
app.post('/tabs/splits', async (req, res) => {
  console.log('[CREATE TAB SPLIT] Attempting to create tab split');
  const { tab_id, split_number, items_included, subtotal, tax_on_split, total_owed } = req.body;

  // Input validation
  if (!tab_id || !split_number || !subtotal || !tax_on_split || !total_owed) {
    console.log('[CREATE TAB SPLIT] Missing required fields');
    return res.status(400).json({ error: 'Missing required fields: tab_id, split_number, subtotal, tax_on_split, total_owed' });
  }

  try {
    const { data, error: splitError } = await supabaseAdmin
      .from('tab_split')
      .insert({
        tab_id,
        split_number,
        items_included: items_included || [],
        subtotal,
        tax_on_split,
        total_owed,
        amount_paid: 0,
        status: 'pending'
      })
      .select();

    if (splitError) {
      console.error('[CREATE TAB SPLIT] Database error:', splitError.message);
      return res.status(400).json({ error: splitError.message });
    }

    console.log('[CREATE TAB SPLIT] Split created successfully');
    return res.status(200).json({ splitId: data?.[0]?.id, message: 'Split created successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[CREATE TAB SPLIT] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Update Tab Split endpoint
app.put('/tabs/splits/:splitId', async (req, res) => {
  const { splitId } = req.params;
  const updateData = req.body;

  console.log(`[UPDATE TAB SPLIT] Attempting to update split with ID: ${splitId}`);

  try {
    const { error: splitError } = await supabaseAdmin
      .from('tab_split')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', splitId);

    if (splitError) {
      console.error('[UPDATE TAB SPLIT] Update error:', splitError.message);
      return res.status(400).json({ error: splitError.message });
    }

    console.log(`[UPDATE TAB SPLIT] Split ${splitId} updated successfully`);
    return res.status(200).json({ message: 'Split updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[UPDATE TAB SPLIT] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Create Payment endpoint
app.post('/tabs/payments', async (req, res) => {
  console.log('[CREATE PAYMENT] Attempting to create payment');
  const { tab_id, split_id, amount_paid, tip_added, payment_method } = req.body;

  // Input validation
  if (!tab_id || !amount_paid || !payment_method) {
    console.log('[CREATE PAYMENT] Missing required fields');
    return res.status(400).json({ error: 'Missing required fields: tab_id, amount_paid, payment_method' });
  }

  try {
    const { data, error: paymentError } = await supabaseAdmin
      .from('tab_payment')
      .insert({
        tab_id,
        split_id: split_id || null,
        amount_paid,
        tip_added: tip_added || 0,
        payment_method,
        status: 'completed'
      })
      .select();

    if (paymentError) {
      console.error('[CREATE PAYMENT] Database error:', paymentError.message);
      return res.status(400).json({ error: paymentError.message });
    }

    console.log('[CREATE PAYMENT] Payment recorded successfully');
    return res.status(200).json({ paymentId: data?.[0]?.id, message: 'Payment recorded successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[CREATE PAYMENT] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Settle/Close Tab endpoint
app.post('/tabs/:tabId/settle', async (req, res) => {
  const { tabId } = req.params;

  console.log(`[SETTLE TAB] Attempting to settle tab with ID: ${tabId}`);

  try {
    const { error: settleError } = await supabaseAdmin
      .from('tab')
      .update({
        status: 'settled',
        settled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tabId);

    if (settleError) {
      console.error('[SETTLE TAB] Update error:', settleError.message);
      return res.status(400).json({ error: settleError.message });
    }

    console.log(`[SETTLE TAB] Tab ${tabId} settled successfully`);
    return res.status(200).json({ message: 'Tab settled successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[SETTLE TAB] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  console.log('[HEALTH CHECK] API health check requested');
  res.json({ status: 'OK', message: 'Bar Tab API is running' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
