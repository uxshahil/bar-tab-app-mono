import { createClient } from '@supabase/supabase-js';
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from 'cors'; // Consider adding CORS if needed

import { Server } from 'socket.io';
import { createServer } from 'http';

import instructionResolver from './utils/instructionResolver.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(express.json());
app.use(cors({
    exposedHeaders: ['X-Cache-Revalidating']
}));

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
      io.emit('user:created', { id: authData.user.id });
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

  console.log(`[UPDATE USER] START. userId: ${userId}`);
  console.log(`[UPDATE USER] Body keys: ${Object.keys(updateData).join(', ')}`);

  try {
    // 1. Update profile table
    console.log('[UPDATE USER] Updating profile table...');
    const { error: profileError } = await supabaseAdmin
      .from('profile')
      .update(updateData)
      .eq('id', userId);

    if (profileError) {
      console.error('[UPDATE USER] Profile update error:', profileError.message);
      return res.status(400).json({ error: profileError.message });
    }
    console.log('[UPDATE USER] Profile table updated.');

    // 2. Update Auth
    console.log('[UPDATE USER] preparing auth updates...');
    const authUpdates = {};
    if (updateData.email) authUpdates.email = updateData.email;
    if (updateData.password) authUpdates.password = updateData.password;
    if (updateData.firstName || updateData.lastName) {
        authUpdates.user_metadata = {
            first_name: updateData.firstName,
            last_name: updateData.lastName,
            full_name: updateData.full_name || `${updateData.firstName} ${updateData.lastName}`
        };
    }
    console.log(`[UPDATE USER] Auth updates: ${JSON.stringify(authUpdates)}`);

    if (Object.keys(authUpdates).length > 0) {
        console.log('[UPDATE USER] calling supabaseAdmin.auth.admin.updateUserById...');
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);
        if (authError) {
           console.error('[UPDATE USER] Auth update error:', authError.message);
        } else {
           console.log('[UPDATE USER] Auth updated.');
        }
    } else {
        console.log('[UPDATE USER] No auth updates needed.');
    }

    console.log(`[UPDATE USER] SUCCESS for ${userId}`);
    io.emit('user:updated', { id: userId });
    return res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('[UPDATE USER] CRITICAL ERROR:', error);
    // Log stack trace if available
    if (error.stack) console.error(error.stack);
    
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    return res.status(500).json({ error: errorMessage, details: 'Check server logs for "table is not defined" source' });
  }
});

// Delete Bar
app.delete('/bars/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('bar')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`[DELETE BAR] Bar ${id} deleted`);
    io.emit('bar:deleted', { id });
    return res.status(200).json({ message: 'Bar deleted successfully' });
  } catch (error) {
    console.error('[DELETE BAR] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============== MENU ENDPOINTS ==============

// Create Menu
app.post('/menus', async (req, res) => {
  console.log('[CREATE MENU] Attempting to create new menu');
  const { name, slug, active } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('menu')
      .insert({ name, slug, active: active ?? true })
      .select();

    if (error) throw error;

    console.log('[CREATE MENU] Menu created successfully');
    io.emit('menu:created', { id: data?.[0]?.id });
    return res.status(200).json({ menuId: data?.[0]?.id, message: 'Menu created successfully' });
  } catch (error) {
    console.error('[CREATE MENU] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Update Menu
app.put('/menus/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const { error } = await supabaseAdmin
      .from('menu')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    console.log(`[UPDATE MENU] Menu ${id} updated`);
    io.emit('menu:updated', { id });
    return res.status(200).json({ message: 'Menu updated successfully' });
  } catch (error) {
    console.error('[UPDATE MENU] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Delete Menu
app.delete('/menus/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('menu')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`[DELETE MENU] Menu ${id} deleted`);
    io.emit('menu:deleted', { id });
    return res.status(200).json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('[DELETE MENU] Error:', error.message);
    return res.status(500).json({ error: error.message });
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
    io.emit('user:deleted', { id: userId });
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
    io.emit('drink:created', { id: data?.[0]?.id, name });
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
    io.emit('drink:updated', { id: drinkId });
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
    io.emit('drink:deleted', { id: drinkId });
    return res.status(200).json({ message: 'Drink deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[DELETE DRINK] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// SWR Drink Fetching Endpoint
app.get('/drinks/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[GET DRINK] Fetching drink with ID/Slug: ${id}`);

  try {
    // 1. Check Internal DB (Cache)
    let query = supabaseAdmin
      .from('menu_item')
      .select('*, category (name, slug)')

    if (!isNaN(id)) {
        // If numeric, check both ID and Slug (some slugs might be numeric strings, unlikely but possible)
        query = query.or(`id.eq.${id},slug.eq.${id}`);
    } else {
        // If non-numeric, it MUST be a slug
        query = query.eq('slug', id);
    }

    const { data: cachedDrink, error: dbError } = await query.single();

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('[GET DRINK] Database check error:', dbError.message);
    }

    // Helper to fetch from External API
    const fetchFromExternal = async (lookupId) => {
      try {
        console.log(`[EXTERNAL FETCH] Looking up ${lookupId} in CocktailDB`);
        // If it's a number, assume ID. If string, assume name/search.
        // For simplicity, let's try searching by ID first then name.
        let url = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${lookupId}`;
        let response = await axios.get(url);
        
        if (!response.data.drinks) {
            // Fallback: Try search by name if it looks like a slug
             url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${lookupId}`;
             response = await axios.get(url);
        }

        return response.data.drinks ? response.data.drinks[0] : null;

      } catch (e) {
        console.error('[EXTERNAL FETCH] Error:', e.message);
        return null;
      }
    };

    // Helper to map and save to DB
    const cacheToDb = async (externalDrink, existingRecord = null) => {
        if (!externalDrink) return null;

        // 1. Resolve Category (By Name, as per schema)
        let categoryRef = null; 
        const categoryName = externalDrink.strCategory || 'Other';
        const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        try {
            // Check if exists in the correct table
            const { data: existingCat } = await supabaseAdmin
                .from('menu_item_category')
                .select('name') // Select NAME, not ID
                .or(`name.eq.${categoryName},slug.eq.${categorySlug}`)
                .single();

            if (existingCat) {
                categoryRef = existingCat.name;
            } else {
                // Create new category
                // We need a menu NAME for the category.
                // Let's look for 'Standard' or ANY menu.
                const { data: firstMenu } = await supabaseAdmin.from('menu').select('name').limit(1).single();
                const menuName = firstMenu ? firstMenu.name : 'Standard'; // Fallback to 'Standard' text if DB empty

                // Ensure 'Standard' menu exists if we are falling back to it and it wasn't found
                if (!firstMenu) {
                     await supabaseAdmin.from('menu').upsert({ name: 'Standard', slug: 'standard', active: true }, { onConflict: 'name' });
                }

                const { data: newCat, error: catError } = await supabaseAdmin
                    .from('menu_item_category')
                    .insert({
                        name: categoryName,
                        slug: categorySlug,
                        menu: menuName, // Use NAME, not ID
                        active: true
                    })
                    .select()
                    .single();
                
                if (newCat) categoryRef = newCat.name;
                else if (catError) console.error('[CACHE WRITE] Category creation error:', catError.message);
            }
        } catch (e) {
            console.error('[CACHE WRITE] Category resolution error:', e.message);
        }

        // Final Fallback: Get ANY existing category NAME
        if (!categoryRef) {
             const { data: fallbackCat } = await supabaseAdmin
                .from('menu_item_category')
                .select('name')
                .limit(1)
                .single();
             if (fallbackCat) categoryRef = fallbackCat.name;
        }

        if (!categoryRef) {
            console.error('[CACHE WRITE] CRITICAL: No valid category found. Cannot save drink.');
            return null;
        }

        // 1.5 Resolve Glass (Ensure it exists, Case-Insensitive)
        let resolvedGlassName = externalDrink.strGlass;
        
        if (externalDrink.strGlass) {
            try {
                const glassName = externalDrink.strGlass;
                const glassSlug = glassName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                
                // 1. Try to find existing glass (Case Insensitive) to avoid "Highball Glass" vs "Highball glass"
                const { data: existingGlass } = await supabaseAdmin
                    .from('drinks_glass')
                    .select('name')
                    .ilike('name', glassName)
                    .maybeSingle(); // Use maybeSingle to avoid error if 0 or multiple

                if (existingGlass) {
                    // Use the canonical name from DB
                     resolvedGlassName = existingGlass.name;
                } else {
                    // 2. Not found, create it
                    const { error: glassError } = await supabaseAdmin
                        .from('drinks_glass')
                        .upsert({ name: glassName, slug: glassSlug }, { onConflict: 'name' }); 

                     if (glassError) {
                         console.log('[CACHE WRITE] Glass upsert warning:', glassError.message);
                     }
                }
            } catch (e) {
                console.error('[CACHE WRITE] Glass resolution error:', e.message);
            }
        }

        const drinkData = {
            name: externalDrink.strDrink,
            slug: externalDrink.strDrink.toLowerCase().replace(/ /g, '-'),
            category: categoryRef,
            thumb_url: externalDrink.strDrinkThumb,
            // Resolver returns an array, we stringify it to store in TEXT column for now
            // or we could join it. Given User request "destructure", JSON is safer to preserve structure.
            instructions: JSON.stringify(instructionResolver.resolve(externalDrink.strInstructions)),
            glass: resolvedGlassName, // Use the resolved name
            alcoholic: externalDrink.strAlcoholic === 'Alcoholic',
            measurements: [], 
            ingredients: [], 
            active: true,
            last_modified: new Date().toISOString()
        };

        // If updating an existing record, preserve ID and Slug to avoid conflicts/URL breaking
        if (existingRecord) {
            drinkData.id = existingRecord.id;
            drinkData.slug = existingRecord.slug;
        }

        // Parse ingredients/measurements
        for (let i = 1; i <= 15; i++) {
            if (externalDrink[`strIngredient${i}`]) {
                drinkData.ingredients.push(externalDrink[`strIngredient${i}`]);
                drinkData.measurements.push(externalDrink[`strMeasure${i}`] || '');
            }
        }
        
        // Upsert based on ID if we have it (Update), or Slug if we don't (Insert/Update)
        const upsertConfig = existingRecord ? { onConflict: 'id' } : { onConflict: 'slug' };

        const { data: saved, error } = await supabaseAdmin
            .from('menu_item')
            .upsert(drinkData, upsertConfig)
            .select()
            .single();

        if (error) console.error('[CACHE WRITE] Error saving to DB:', error.message);
        else {
            console.log('[CACHE WRITE] Saved to DB:', saved ? saved.id : 'Unknown');
            if (saved) {
                io.emit('drink:updated', { id: saved.id });
                // Also emit specific update for list views if needed, but drink:updated covers detail
            }
        }

        return saved;
    };

    // 2. Logic: Cache Hit
    if (cachedDrink) {
        // BACKGROUND REVALIDATION CHECK
        // Only if older than X time (e.g., 24h)
        const lastMod = new Date(cachedDrink.last_modified).getTime();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        const isDataIncomplete = !cachedDrink.instructions || 
                                 !cachedDrink.ingredients || cachedDrink.ingredients.length === 0 ||
                                 !cachedDrink.measurements || cachedDrink.measurements.length === 0;

        const needsRevalidation = (now - lastMod > oneDay) || isDataIncomplete;

        if (needsRevalidation) {
            console.log('[SWR] Triggering background revalidation. Reason:', isDataIncomplete ? 'Incomplete Data' : 'Stale Data');
            res.set('X-Cache-Revalidating', 'true');
            
            // Trigger background fetch (detached from request)
            setTimeout(() => {
                fetchFromExternal(cachedDrink.id).then(fresh => {
                    if(fresh) cacheToDb(fresh, cachedDrink);
                }).catch(err => console.error('[SWR] Background fetch failed:', err.message));
            }, 0);
        } else {
            res.set('X-Cache-Revalidating', 'false');
        }

        // RETURN RESPONSE
        res.status(200).json(cachedDrink);
        return;
    }

    // 3. Logic: Cache Miss
    console.log('[GET DRINK] Cache miss. Fetching from external...');
    const freshData = await fetchFromExternal(id);

    if (freshData) {
        // Save to DB and return the *saved* record to ensure ID matches our system
        const savedRecord = await cacheToDb(freshData);
        return res.status(200).json(savedRecord || freshData);
    } else {
        return res.status(404).json({ error: 'Drink not found' });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[GET DRINK] Unexpected error:', errorMessage);
    res.status(500).json({ error: errorMessage });
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
    io.emit('tab:created', { id: data?.[0]?.id, user_id, tab_number });
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
    io.emit('tab:updated', { id: tabId });
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
    io.emit('tab:updated', { id: tab_id });
    io.emit('tab:item:added', { id: data?.[0]?.id, tab_id });
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
    // Fetch item first to get tab_id
    const { data: itemToUpdate } = await supabaseAdmin
        .from('tab_item')
        .select('tab_id')
        .eq('id', itemId)
        .single();
    
    if (!itemToUpdate) return res.status(404).json({ error: 'Item not found' });
    const tabId = itemToUpdate.tab_id;

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
    io.emit('tab:updated', { id: tabId });
    io.emit('tab:item:updated', { id: itemId, tab_id: tabId, ...updateData });
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
    // Fetch item first to get tab_id
     const { data: itemToDelete } = await supabaseAdmin
        .from('tab_item')
        .select('tab_id')
        .eq('id', itemId)
        .single();
    
    if (!itemToDelete) return res.status(404).json({ error: 'Item not found' });
    const tabId = itemToDelete.tab_id;

    const { error: itemError } = await supabaseAdmin
      .from('tab_item')
      .delete()
      .eq('id', itemId);

    if (itemError) {
      console.error('[DELETE TAB ITEM] Deletion error:', itemError.message);
      return res.status(400).json({ error: itemError.message });
    }

    console.log(`[DELETE TAB ITEM] Item ${itemId} deleted successfully`);
    io.emit('tab:updated', { id: tabId });
    io.emit('tab:item:deleted', { id: itemId, tab_id: tabId });
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
    io.emit('tab:updated', { id: tab_id });
    io.emit('tab:payment:added', { id: data?.[0]?.id, tab_id });
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
    io.emit('tab:updated', { id: tabId, status: 'settled' });
    return res.status(200).json({ message: 'Tab settled successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) ?? 'An unexpected error occurred';
    console.error('[SETTLE TAB] Unexpected error:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
});

// ============== BAR ENDPOINTS ==============

// Create Bar
app.post('/bars', async (req, res) => {
  console.log('[CREATE BAR] Attempting to create new bar');
  const { name, slug, address, active } = req.body; // Add other fields as needed

  try {
    const { data, error } = await supabaseAdmin
      .from('bar')
      .insert({ name, slug, address, active: active ?? true })
      .select();

    if (error) throw error;

    console.log('[CREATE BAR] Bar created successfully');
    io.emit('bar:created', { id: data?.[0]?.id });
    return res.status(200).json({ barId: data?.[0]?.id, message: 'Bar created successfully' });
  } catch (error) {
    console.error('[CREATE BAR] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Update Bar
app.put('/bars/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const { error } = await supabaseAdmin
      .from('bar')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    console.log(`[UPDATE BAR] Bar ${id} updated`);
    io.emit('bar:updated', { id });
    return res.status(200).json({ message: 'Bar updated successfully' });
  } catch (error) {
    console.error('[UPDATE BAR] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Start the server
app.get('/', (req, res) => {
  console.log('[HEALTH CHECK] API health check requested');
  res.json({ status: 'OK', message: 'Bar Tab API is running' });
});

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
